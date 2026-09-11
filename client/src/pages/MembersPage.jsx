import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Shield,
  Building,
} from 'lucide-react';
import { api } from '../services/api.js';

export default function MembersPage({ onNavigateToScan }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [memberType, setMemberType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    memberType: 'STUDENT',
    rollOrEmployeeNumber: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    maxAllowedBooks: 3,
    customMembershipId: '',
    remarks: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const departmentList = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Business Administration',
    'Humanities & Literature',
  ];

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMembers({
        search: search.trim(),
        memberType,
        status: statusFilter,
      });
      setMembers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load library members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [memberType, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleOpenRegister = () => {
    setFormData({
      fullName: '',
      memberType: 'STUDENT',
      rollOrEmployeeNumber: '',
      email: '',
      phone: '',
      department: 'Computer Science',
      maxAllowedBooks: 3,
      customMembershipId: '',
      remarks: '',
    });
    setFormError(null);
    setIsRegisterModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName,
      memberType: member.memberType,
      rollOrEmployeeNumber: member.rollOrEmployeeNumber,
      email: member.email,
      phone: member.phone,
      department: member.department,
      maxAllowedBooks: member.maxAllowedBooks || (member.memberType === 'FACULTY' ? 5 : 3),
      status: member.status || 'ACTIVE',
      remarks: member.remarks || '',
    });
    setFormError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingMember) {
        await api.updateMember(editingMember._id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          maxAllowedBooks: formData.maxAllowedBooks,
          status: formData.status,
          remarks: formData.remarks,
        });
        setSuccessMessage(`Member '${formData.fullName}' updated successfully`);
        setEditingMember(null);
      } else {
        await api.createMember(formData);
        setSuccessMessage(`New member '${formData.fullName}' registered successfully`);
        setIsRegisterModalOpen(false);
      }
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setFormError(err.message || 'Failed to save member information');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async (member) => {
    if (member.activeLoansCount > 0) {
      setError(`Cannot remove member '${member.fullName}' because they have ${member.activeLoansCount} active book loan(s).`);
      return;
    }

    if (!window.confirm(`Are you sure you want to deactivate member '${member.fullName}' (${member.membershipId})?`)) {
      return;
    }

    try {
      await api.deleteMember(member._id);
      setSuccessMessage(`Member '${member.fullName}' deactivated successfully`);
      fetchMembers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to deactivate member');
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard?.writeText(id);
    setSuccessMessage(`Copied '${id}' to clipboard`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Quick stats
  const totalCount = members.length;
  const studentCount = members.filter((m) => m.memberType === 'STUDENT').length;
  const facultyCount = members.filter((m) => m.memberType === 'FACULTY' || m.memberType === 'STAFF').length;
  const activeLoansTotal = members.reduce((acc, m) => acc + (m.activeLoansCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Member Management
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Circulation Directory
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Register students and faculty members, assign membership IDs, and track active borrowing rights.
          </p>
        </div>

        <button
          onClick={handleOpenRegister}
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Member</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Members</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Registered library patrons</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{studentCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Undergraduate & Graduate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty & Staff</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{facultyCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Professors & Instructors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Loans</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{activeLoansTotal}</div>
          <div className="text-xs text-slate-400 mt-0.5">Copies currently with members</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, roll no, membership ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-24 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={memberType}
            onChange={(e) => setMemberType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Role: All Roles</option>
            <option value="STUDENT">Role: Students</option>
            <option value="FACULTY">Role: Faculty</option>
            <option value="STAFF">Role: Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Status: Active</option>
            <option value="SUSPENDED">Status: Suspended</option>
            <option value="INACTIVE">Status: Inactive</option>
          </select>

          <button
            onClick={fetchMembers}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium">Loading member directory...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700">No members found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              No registered members match your search filter. Click &ldquo;Register New Member&rdquo; to add students or faculty.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Membership ID</th>
                  <th className="px-5 py-3.5">Member Name</th>
                  <th className="px-5 py-3.5">Type & Roll / ID</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Active Loans</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isFaculty = m.memberType === 'FACULTY';
                  const isStaff = m.memberType === 'STAFF';
                  const isActive = m.status === 'ACTIVE';

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {m.membershipId}
                          </span>
                          <button
                            onClick={() => handleCopyId(m.membershipId)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy Membership ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{m.fullName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{m.email}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isFaculty
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : isStaff
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isFaculty ? (
                              <Briefcase className="w-3 h-3" />
                            ) : (
                              <GraduationCap className="w-3 h-3" />
                            )}
                            <span>{m.memberType}</span>
                          </span>
                        </div>
                        <div className="text-xs font-mono font-medium text-slate-700 mt-1">
                          {m.rollOrEmployeeNumber}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700 text-xs">
                        <div className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{m.department}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{m.phone}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                              m.activeLoansCount > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            {m.activeLoansCount} / {m.maxAllowedBooks || 3}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Member"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Deactivate Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration / Edit Member Modal */}
      {(isRegisterModalOpen || editingMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {editingMember ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMember ? `Edit Member: ${editingMember.fullName}` : 'Register New Member'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingMember ? 'Update contact or borrowing permissions' : 'Create profile for student or faculty member'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setEditingMember(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Member Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Member Type *
                  </label>
                  <select
                    disabled={!!editingMember}
                    value={formData.memberType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setFormData({
                        ...formData,
                        memberType: type,
                        maxAllowedBooks: type === 'FACULTY' ? 5 : 3,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
                  >
                    <option value="STUDENT">Student (Undergraduate / Postgrad)</option>
                    <option value="FACULTY">Faculty (Professor / Lecturer)</option>
                    <option value="STAFF">Institutional Staff</option>
                  </select>
                </div>

                {/* Roll Number or Employee ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll No / Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingMember}
                    placeholder="e.g. CS-2026-042 or EMP-109"
                    value={formData.rollOrEmployeeNumber}
                    onChange={(e) => setFormData({ ...formData, rollOrEmployeeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor or Dr. Aris Thorne"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (555) 234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {departmentList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Allowed Books */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Allowed Loans
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.maxAllowedBooks}
                    onChange={(e) => setFormData({ ...formData, maxAllowedBooks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Custom Membership ID or Status */}
              {editingMember ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="ACTIVE">ACTIVE (Borrowing permitted)</option>
                    <option value="SUSPENDED">SUSPENDED (Overdue hold)</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Membership ID <span className="text-slate-400 font-normal">(Optional - auto-generated if blank)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STU-2026-0042 (Leave blank for automated generator)"
                    value={formData.customMembershipId}
                    onChange={(e) => setFormData({ ...formData, customMembershipId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dean's list scholar, teaching assistant..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {formLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingMember ? 'Save Changes' : 'Register Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
