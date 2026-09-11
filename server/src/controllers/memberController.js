import Member from '../models/Member.js';
import Transaction from '../models/Transaction.js';

/**
 * Generate a unique membership ID based on type and timestamp/counter
 */
async function generateUniqueMembershipId(type = 'STUDENT') {
  const prefix = type === 'FACULTY' ? 'FAC' : type === 'STAFF' ? 'STF' : 'STU';
  const year = new Date().getFullYear();

  // Find the highest existing ID with this prefix for the current year
  const regex = new RegExp(`^${prefix}-${year}-(\\d{4})$`);
  const members = await Member.find({ membershipId: regex }).select('membershipId');

  let maxNum = 0;
  for (const m of members) {
    const match = m.membershipId.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextSeq = String(maxNum + 1).padStart(4, '0');
  return `${prefix}-${year}-${nextSeq}`;
}

/**
 * List all members with optional search, type filter, and status filter
 */
export async function getAllMembers(req, res, next) {
  try {
    const { search, memberType, status } = req.query;
    const filter = { isArchived: false };

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { fullName: { $regex: term, $options: 'i' } },
        { membershipId: { $regex: term, $options: 'i' } },
        { rollOrEmployeeNumber: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { department: { $regex: term, $options: 'i' } },
      ];
    }

    if (memberType && memberType !== 'ALL') {
      filter.memberType = memberType.toUpperCase();
    }

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    const members = await Member.find(filter).sort({ createdAt: -1 });

    // Compute real active loans count for each member from transactions
    const membersWithLoans = await Promise.all(
      members.map(async (m) => {
        const activeLoans = await Transaction.countDocuments({
          $or: [
            { borrowerRollNumber: m.rollOrEmployeeNumber },
            { borrowerRollNumber: m.membershipId },
          ],
          status: 'ISSUED',
        });
        return {
          ...m.toObject(),
          activeLoansCount: activeLoans,
        };
      })
    );

    res.json({
      success: true,
      count: membersWithLoans.length,
      data: membersWithLoans,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Quick lookup by exact roll number or membership ID
 */
export async function lookupMember(req, res, next) {
  try {
    const query = req.params.query?.trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Lookup query is required' });
    }

    const member = await Member.findOne({
      isArchived: false,
      $or: [
        { membershipId: query.toUpperCase() },
        { rollOrEmployeeNumber: query.toUpperCase() },
      ],
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: `No registered member found for '${query}'`,
      });
    }

    const activeLoans = await Transaction.find({
      $or: [
        { borrowerRollNumber: member.rollOrEmployeeNumber },
        { borrowerRollNumber: member.membershipId },
      ],
      status: 'ISSUED',
    }).populate('book', 'title author');

    res.json({
      success: true,
      data: {
        ...member.toObject(),
        activeLoansCount: activeLoans.length,
        activeLoans,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get member by ID with their active transactions
 */
export async function getMemberById(req, res, next) {
  try {
    const member = await Member.findById(req.params.id);
    if (!member || member.isArchived) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const activeLoans = await Transaction.find({
      $or: [
        { borrowerRollNumber: member.rollOrEmployeeNumber },
        { borrowerRollNumber: member.membershipId },
      ],
      status: 'ISSUED',
    })
      .populate('book', 'title author')
      .populate('bookCopy', 'accessionCode');

    res.json({
      success: true,
      data: {
        ...member.toObject(),
        activeLoansCount: activeLoans.length,
        activeLoans,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Register a new member (Student or Faculty)
 */
export async function createMember(req, res, next) {
  try {
    const {
      fullName,
      memberType = 'STUDENT',
      rollOrEmployeeNumber,
      email,
      phone,
      department = 'General',
      maxAllowedBooks,
      remarks,
      customMembershipId,
    } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    if (!rollOrEmployeeNumber || typeof rollOrEmployeeNumber !== 'string' || !rollOrEmployeeNumber.trim()) {
      return res.status(400).json({ success: false, error: 'Roll number or Employee ID is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Contact phone number is required' });
    }

    const normalizedRoll = rollOrEmployeeNumber.trim().toUpperCase();

    // Check roll number uniqueness
    const existingRoll = await Member.findOne({ rollOrEmployeeNumber: normalizedRoll, isArchived: false });
    if (existingRoll) {
      return res.status(409).json({
        success: false,
        error: `A member with Roll/Employee number '${normalizedRoll}' already exists (${existingRoll.fullName})`,
      });
    }

    // Determine membership ID
    let membershipId;
    if (customMembershipId && customMembershipId.trim()) {
      membershipId = customMembershipId.trim().toUpperCase();
      const existingId = await Member.findOne({ membershipId });
      if (existingId) {
        return res.status(409).json({
          success: false,
          error: `Membership ID '${membershipId}' is already in use`,
        });
      }
    } else {
      membershipId = await generateUniqueMembershipId(memberType);
    }

    const member = await Member.create({
      membershipId,
      fullName: fullName.trim(),
      memberType: memberType.toUpperCase(),
      rollOrEmployeeNumber: normalizedRoll,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department: department.trim() || 'General',
      maxAllowedBooks: Number(maxAllowedBooks) || (memberType === 'FACULTY' ? 5 : 3),
      remarks: remarks?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: member,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate field value: Membership ID or Roll/Employee number already exists in database',
      });
    }
    next(err);
  }
}

/**
 * Update member information
 */
export async function updateMember(req, res, next) {
  try {
    const { fullName, email, phone, department, status, maxAllowedBooks, remarks } = req.body;
    const member = await Member.findById(req.params.id);

    if (!member || member.isArchived) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    if (fullName) member.fullName = fullName.trim();
    if (email) member.email = email.trim().toLowerCase();
    if (phone) member.phone = phone.trim();
    if (department) member.department = department.trim();
    if (status) {
      const targetStatus = status.toUpperCase();
      if (targetStatus === 'INACTIVE') {
        const activeLoans = await Transaction.countDocuments({
          $or: [
            { borrowerRollNumber: member.rollOrEmployeeNumber },
            { borrowerRollNumber: member.membershipId },
          ],
          status: 'ISSUED',
        });
        if (activeLoans > 0) {
          return res.status(400).json({
            success: false,
            error: `Cannot deactivate member: '${member.fullName}' currently has ${activeLoans} unreturned book(s) on loan. Please process book returns first.`,
          });
        }
      }
      member.status = targetStatus;
    }
    if (maxAllowedBooks) member.maxAllowedBooks = Number(maxAllowedBooks);
    if (remarks !== undefined) member.remarks = remarks.trim();

    await member.save();

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: member,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Archive / Delete member
 */
export async function deleteMember(req, res, next) {
  try {
    const member = await Member.findById(req.params.id);
    if (!member || member.isArchived) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    // Check if member has unreturned books
    const activeLoans = await Transaction.countDocuments({
      $or: [
        { borrowerRollNumber: member.rollOrEmployeeNumber },
        { borrowerRollNumber: member.membershipId },
      ],
      status: 'ISSUED',
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete member: '${member.fullName}' currently has ${activeLoans} unreturned book(s) on loan. Please process book returns first.`,
      });
    }

    member.isArchived = true;
    member.status = 'INACTIVE';
    await member.save();

    res.json({
      success: true,
      message: 'Member archived successfully',
    });
  } catch (err) {
    next(err);
  }
}
