import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  History,
} from 'lucide-react';
import { api } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';

export default function DashboardPage({ onNavigate, onSelectAccessionCode }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard metrics from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Fetching live library database metrics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center max-w-lg mx-auto my-8">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-red-800 mb-1">Failed to Load Dashboard</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Titles',
      value: stats?.totalTitles ?? 0,
      description: 'Cataloged Book Titles',
      icon: BookOpen,
      color: 'blue',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Physical Copies',
      value: stats?.totalCopies ?? 0,
      description: 'Total Tracked Inventory',
      icon: Copy,
      color: 'slate',
      textColor: 'text-slate-700',
      bgColor: 'bg-slate-100',
    },
    {
      title: 'Available Copies',
      value: stats?.availableCopies ?? 0,
      description: 'Ready to Issue on Shelves',
      icon: CheckCircle2,
      color: 'emerald',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Issued Copies',
      value: stats?.issuedCopies ?? 0,
      description: 'Currently with Borrowers',
      icon: Clock,
      color: 'amber',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Active Transactions',
      value: stats?.activeTransactions ?? 0,
      description: 'Open Borrowing Loans',
      icon: TrendingUp,
      color: 'indigo',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Overdue Copies',
      value: stats?.overdueCopies ?? 0,
      description: 'Past Scheduled Due Date',
      icon: AlertTriangle,
      color: 'rose',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Library Circulation Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
            <span>Circulation metrics, physical inventory status, and active loans</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live Data
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => onNavigate('scan')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Scan QR / Issue / Return</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Live Database Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">
                  {card.value}
                </div>
                <p className="text-xs text-slate-400 mt-1">{card.description}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor} ${card.textColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Currently Issued Books Table (Active Loans) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/30">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Currently Issued Books ({stats?.currentlyIssuedBooks?.length ?? 0})
              </h2>
              <p className="text-xs text-slate-500">
                All physical copies currently out on active loan to borrowers.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('scan')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Issue / Return Terminal</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {!stats?.currentlyIssuedBooks || stats.currentlyIssuedBooks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No books currently on loan. All physical copies are available on library shelves.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Accession Code</th>
                  <th className="px-5 py-3">Book Title</th>
                  <th className="px-5 py-3">Author</th>
                  <th className="px-5 py-3">Borrower Name</th>
                  <th className="px-5 py-3">Roll Number</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.currentlyIssuedBooks.map((tx) => {
                  const isOverdue = tx.isOverdue;

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900">
                        {tx.accessionCode}
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 font-medium max-w-xs truncate">
                        {tx.book?.title || 'Unknown Title'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {tx.book?.author || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 font-medium">
                        {tx.borrowerName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">
                        {tx.borrowerRollNumber}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {formatDate(tx.issueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        <span className={isOverdue ? 'text-red-700 font-bold' : ''}>
                          {formatDate(tx.dueDate)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isOverdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isOverdue ? 'OVERDUE' : 'ISSUED'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {onSelectAccessionCode && (
                          <button
                            onClick={() => onSelectAccessionCode(tx.accessionCode)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-semibold transition-colors"
                            title="Return this book"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="text-base font-bold text-slate-800">Recent Lending Transactions</h2>
          </div>

          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {stats?.recentTransactions?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No transactions recorded yet. Use &ldquo;Scan QR / Issue / Return&rdquo; to issue your first book copy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Accession Code</th>
                  <th className="px-6 py-3">Book Title</th>
                  <th className="px-6 py-3">Borrower</th>
                  <th className="px-6 py-3">Issue Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentTransactions?.map((tx) => {
                  const isIssued = tx.status === 'ISSUED';
                  const isOverdue =
                    isIssued && tx.dueDate && new Date() > new Date(tx.dueDate);

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900">
                        {tx.accessionCode}
                      </td>
                      <td className="px-6 py-3.5 text-slate-800 font-medium">
                        {tx.book?.title || 'Unknown Title'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{tx.borrowerName}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {tx.borrowerRollNumber}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 text-xs">
                        {formatDate(tx.issueDate)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 text-xs">
                        {formatDate(tx.dueDate)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isOverdue
                              ? 'bg-red-100 text-red-700'
                              : isIssued
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOverdue ? 'OVERDUE' : tx.status}
                        </span>
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
