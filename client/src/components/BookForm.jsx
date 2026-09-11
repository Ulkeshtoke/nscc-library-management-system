import React, { useState } from 'react';
import { BookPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api.js';

export default function BookForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    publisher: '',
    publishedYear: new Date().getFullYear(),
    initialCopies: 1,
    customCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Electronics',
    'Mechanical',
    'Civil Engineering',
    'Literature',
    'General Reference',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      setError('Title and Author are required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim(),
        category: formData.category,
        publisher: formData.publisher.trim(),
        publishedYear: formData.publishedYear ? Number(formData.publishedYear) : undefined,
        initialCopies: Number(formData.initialCopies) || 1,
      };

      if (formData.customCode.trim() && payload.initialCopies === 1) {
        payload.customAccessionCodes = [formData.customCode.trim().toUpperCase()];
      }

      const res = await api.createBook(payload);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to create book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          Book Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Operating System Concepts"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Author <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Abraham Silberschatz"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm bg-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            ISBN
          </label>
          <input
            type="text"
            placeholder="e.g. 978-1118063330"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Publisher
          </label>
          <input
            type="text"
            placeholder="e.g. Wiley"
            value={formData.publisher}
            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Year
          </label>
          <input
            type="number"
            value={formData.publishedYear}
            onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm"
          />
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Physical Copies to Add</h4>
            <p className="text-xs text-slate-500">
              Each copy receives a unique accession code and printable QR label.
            </p>
          </div>
          <input
            type="number"
            min="1"
            max="50"
            value={formData.initialCopies}
            onChange={(e) =>
              setFormData({ ...formData, initialCopies: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {formData.initialCopies === 1 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Custom Accession Code (Optional — leave blank for auto-generation)
            </label>
            <input
              type="text"
              placeholder="e.g. ACC-2026-9001"
              value={formData.customCode}
              onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
              className="w-full px-3 py-1.5 uppercase border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Saving & Creating Copies...</span>
          ) : (
            <>
              <BookPlus className="w-4 h-4" />
              <span>Save Book & Generate Copies</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
