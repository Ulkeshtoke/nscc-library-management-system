import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';
import QrScanner from '../components/QrScanner.jsx';

export default function ScanPage({ initialAccessionCode = '', onTransactionComplete }) {
  const [accessionInput, setAccessionInput] = useState(initialAccessionCode);
  const [copyData, setCopyData] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // Issue Form state
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days by default
    return d.toISOString().split('T')[0];
  };

  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerRollNumber, setBorrowerRollNumber] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [remarks, setRemarks] = useState('');

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Scanner control
  const [isScannerPaused, setIsScannerPaused] = useState(false);

  // Registered members for quick-select
  const [registeredMembers, setRegisteredMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  useEffect(() => {
    api.getMembers()
      .then((res) => {
        if (res.data) setRegisteredMembers(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialAccessionCode) {
      setAccessionInput(initialAccessionCode);
      handleLookup(initialAccessionCode);
    }
  }, [initialAccessionCode]);

  const handleLookup = async (codeToLookup) => {
    const code = (codeToLookup || accessionInput).trim().toUpperCase();
    if (!code) {
      setLookupError('Please enter an accession code');
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError(null);
      setActionSuccess(null);
      setActionError(null);

      const res = await api.lookupCopy(code);
      setCopyData(res.data);
      setAccessionInput(code);
      setIsScannerPaused(true); // Pause scanner once decoded
    } catch (err) {
      setCopyData(null);
      setLookupError(err.message || `No book copy found with code '${code}'`);
      setIsScannerPaused(false);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleLookup(accessionInput);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!copyData) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const payload = {
        accessionCode: copyData.accessionCode,
        borrowerName: borrowerName.trim(),
        borrowerRollNumber: borrowerRollNumber.trim(),
        dueDate,
        remarks: remarks.trim(),
      };

      const res = await api.issueBook(payload);
      setActionSuccess(res.message);

      // Re-lookup to refresh current copy state
      await handleLookup(copyData.accessionCode);

      if (onTransactionComplete) onTransactionComplete();
    } catch (err) {
      setActionError(err.message || 'Failed to issue book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!copyData) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const payload = {
        accessionCode: copyData.accessionCode,
        remarks: remarks.trim(),
      };

      const res = await api.returnBook(payload);
      setActionSuccess(res.message);

      // Re-lookup to refresh current copy state
      await handleLookup(copyData.accessionCode);

      if (onTransactionComplete) onTransactionComplete();
    } catch (err) {
      setActionError(err.message || 'Failed to return book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = () => {
    setCopyData(null);
    setAccessionInput('');
    setLookupError(null);
    setActionSuccess(null);
    setActionError(null);
    setBorrowerName('');
    setBorrowerRollNumber('');
    setDueDate(defaultDueDate());
    setRemarks('');
    setIsScannerPaused(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Book Issue & Return Terminal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Scan the book QR accession code using your webcam or enter the accession code manually.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Process Next Copy
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Scanner & Manual Input */}
        <div className="lg:col-span-5 space-y-4">
          <QrScanner
            onScanSuccess={(scannedCode) => {
              setAccessionInput(scannedCode);
              handleLookup(scannedCode);
            }}
            isScanningPaused={isScannerPaused}
          />

          {/* Manual Accession Input Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Manual Accession Code Fallback
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              If camera permissions are denied or scanning is unavailable, enter the accession code directly.
            </p>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. ACC-2026-10492"
                value={accessionInput}
                onChange={(e) => setAccessionInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {lookupLoading ? 'Looking up...' : 'Inspect Copy'}
              </button>
            </form>

            {lookupError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Copy Details & Action Form */}
        <div className="lg:col-span-7">
          {!copyData ? (
            <div className="h-full min-h-[360px] bg-white rounded-xl border border-dashed border-slate-300 p-8 flex flex-col items-center justify-center text-center text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-600 mb-1">
                No Book Copy Selected
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Point your webcam at a book&rsquo;s QR accession label or type the code in the manual entry box to inspect status and process an Issue or Return.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Copy Overview Header */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      Accession Identification
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      {copyData.book?.title}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                      <span>Author: <strong>{copyData.book?.author}</strong></span>
                      {copyData.book?.isbn && (
                        <span>ISBN: <strong className="font-mono">{copyData.book?.isbn}</strong></span>
                      )}
                      <span>Category: <strong>{copyData.book?.category}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        copyData.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {copyData.status}
                    </span>
                    <div className="font-mono text-xs font-bold text-slate-700 mt-1">
                      {copyData.accessionCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Form: Available -> Issue OR Issued -> Return */}
              <div className="p-6">
                {copyData.status === 'AVAILABLE' ? (
                  <form onSubmit={handleIssueSubmit} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Issue Book to Student / Faculty
                      </h3>
                    </div>

                    {registeredMembers.length > 0 && (
                      <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200/80">
                        <label className="block text-xs font-semibold text-blue-900 mb-1">
                          Quick Autofill from Registered Members (Optional)
                        </label>
                        <select
                          value={selectedMemberId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setSelectedMemberId(id);
                            const found = registeredMembers.find((m) => m._id === id);
                            if (found) {
                              setBorrowerName(found.fullName);
                              setBorrowerRollNumber(found.rollOrEmployeeNumber);
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-blue-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        >
                          <option value="">-- Select Member to autofill details --</option>
                          {registeredMembers.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.fullName} ({m.membershipId} &bull; {m.rollOrEmployeeNumber} &bull; {m.memberType})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Borrower Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Johnathan Smith"
                          value={borrowerName}
                          onChange={(e) => setBorrowerName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Roll / ID Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CS-2026-108"
                          value={borrowerRollNumber}
                          onChange={(e) => setBorrowerRollNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Scheduled Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Remarks / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Final year capstone project research"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{actionLoading ? 'Issuing Book...' : 'Confirm & Issue Book'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Copy is currently ISSUED - Process Return */
                  <form onSubmit={handleReturnSubmit} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <RotateCcw className="w-5 h-5 text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Process Return for Currently Issued Copy
                      </h3>
                    </div>

                    {copyData.activeTransaction && (
                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                        <div className="font-semibold text-amber-950 text-sm">
                          Current Borrower Details
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            Borrower: <strong>{copyData.activeTransaction.borrowerName}</strong>
                          </div>
                          <div>
                            Roll Number: <strong>{copyData.activeTransaction.borrowerRollNumber}</strong>
                          </div>
                          <div>
                            Issued Date: <strong>{formatDate(copyData.activeTransaction.issueDate)}</strong>
                          </div>
                          <div>
                            Due Date:{' '}
                            <strong
                              className={
                                new Date() > new Date(copyData.activeTransaction.dueDate)
                                  ? 'text-red-700 font-extrabold'
                                  : ''
                              }
                            >
                              {formatDate(copyData.activeTransaction.dueDate)}
                              {new Date() > new Date(copyData.activeTransaction.dueDate) &&
                                ' (OVERDUE)'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Return Remarks (Condition, fine notes, etc.)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Returned on time in good condition"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>
                          {actionLoading ? 'Processing Return...' : 'Confirm Book Return'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
