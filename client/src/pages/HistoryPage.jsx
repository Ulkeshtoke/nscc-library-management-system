import React, { useEffect, useState } from 'react';
import {
  History,
  FileSpreadsheet,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { api } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [borrowerSearch, setBorrowerSearch] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (overdueOnly) params.overdueOnly = true;
      if (borrowerSearch.trim()) params.borrower = borrowerSearch.trim();

      const res = await api.getTransactions(params);
      setTransactions(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, overdueOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleExportXlsx = () => {
    try {
      const link = document.createElement('a');
      link.href = api.getExportUrl();
      link.setAttribute('download', `library-transactions-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(api.getExportUrl(), '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Circulation Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete audit trail of all physical book issues, returns, and overdue calculations.
          </p>
        </div>

        <button
          onClick={handleExportXlsx}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel Report (.xlsx)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by borrower name or roll number..."
            value={borrowerSearch}
            onChange={(e) => setBorrowerSearch(e.target.value)}
            className="w-full pl-9 pr-24 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Status: All Loans</option>
            <option value="ISSUED">Status: Currently Issued</option>
            <option value="RETURNED">Status: Returned</option>
          </select>

          <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Overdue Only</span>
          </label>

          <button
            onClick={fetchTransactions}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Loading transaction audit records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No transactions match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Accession Code</th>
                  <th className="px-5 py-3">Book Title / Author</th>
                  <th className="px-5 py-3">Borrower / Roll No</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Return Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isIssued = tx.status === 'ISSUED';
                  const isOverdue = tx.isOverdue;

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900">
                        {tx.accessionCode}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {tx.book?.title || 'Unknown Title'}
                        </div>
                        <div className="text-xs text-slate-500">{tx.book?.author}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{tx.borrowerName}</div>
                        <div className="text-xs font-mono text-slate-400">
                          {tx.borrowerRollNumber}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {formatDate(tx.issueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {formatDate(tx.dueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {tx.returnDate ? formatDate(tx.returnDate) : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isOverdue
                              ? 'bg-red-100 text-red-700'
                              : isIssued
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOverdue && isIssued
                            ? 'OVERDUE'
                            : isOverdue && !isIssued
                            ? 'RETURNED (LATE)'
                            : tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 italic max-w-xs truncate">
                        {tx.remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
