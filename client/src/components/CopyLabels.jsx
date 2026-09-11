import React, { useEffect, useState } from 'react';
import { Printer, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

export default function CopyLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCopyLabels();
      setLabels(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load copy labels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabels();
  }, []);

  const filteredLabels = labels.filter((lbl) => {
    const term = searchTerm.toLowerCase();
    return (
      lbl.accessionCode.toLowerCase().includes(term) ||
      lbl.title.toLowerCase().includes(term) ||
      lbl.author.toLowerCase().includes(term)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls - Hidden during print */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Printable QR Accession Labels</h2>
          <p className="text-xs text-slate-500">
            Generate printable sticker tags for book spines and inside covers.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <button
            onClick={loadLabels}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Labels"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            disabled={filteredLabels.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print Labels ({filteredLabels.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="no-print p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="no-print p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Loading copy QR labels...</span>
        </div>
      ) : filteredLabels.length === 0 ? (
        <div className="no-print p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          No physical copies found matching your search.
        </div>
      ) : (
        /* Printable grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredLabels.map((copy) => (
            <div
              key={copy.id}
              className="label-card bg-white p-4 rounded-xl border border-slate-300 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-2 mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                    NSCC Library
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-900">
                    {copy.accessionCode}
                  </div>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                    copy.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {copy.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {copy.qrCodeUrl ? (
                  <img
                    src={copy.qrCodeUrl}
                    alt={`QR for ${copy.accessionCode}`}
                    className="w-24 h-24 border border-slate-200 rounded p-1 bg-white"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400">
                    No QR
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={copy.title}>
                    {copy.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 truncate">{copy.author}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{copy.category}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Scan for Issue / Return
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
