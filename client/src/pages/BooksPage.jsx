import React, { useEffect, useState } from 'react';
import {
  BookPlus,
  Search,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  QrCode,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import BookForm from '../components/BookForm.jsx';

export default function BooksPage({ onSelectAccessionCode }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');

  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [expandedBookId, setExpandedBookId] = useState(null);
  const [bookCopiesMap, setBookCopiesMap] = useState({});
  const [loadingCopies, setLoadingCopies] = useState({});

  const [addCopyModalBook, setAddCopyModalBook] = useState(null);
  const [copiesToAddCount, setCopiesToAddCount] = useState(1);
  const [addingCopiesLoading, setAddingCopiesLoading] = useState(false);

  const [activeQrModal, setActiveQrModal] = useState(null);

  const categories = [
    'All',
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

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBooks({
        search: search.trim(),
        category: selectedCategory,
        availability: selectedAvailability,
      });
      setBooks(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch cataloged books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, selectedAvailability]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const toggleExpandBook = async (bookId) => {
    if (expandedBookId === bookId) {
      setExpandedBookId(null);
      return;
    }

    setExpandedBookId(bookId);
    if (!bookCopiesMap[bookId]) {
      try {
        setLoadingCopies((prev) => ({ ...prev, [bookId]: true }));
        const res = await api.getBookById(bookId);
        setBookCopiesMap((prev) => ({ ...prev, [bookId]: res.data.copies }));
      } catch (err) {
        console.error('Failed to load book copies:', err);
      } finally {
        setLoadingCopies((prev) => ({ ...prev, [bookId]: false }));
      }
    }
  };

  const handleAddCopiesSubmit = async (e) => {
    e.preventDefault();
    if (!addCopyModalBook) return;

    try {
      setAddingCopiesLoading(true);
      await api.addCopies(addCopyModalBook._id, { count: copiesToAddCount });

      // Refresh copies & books
      const updatedBook = await api.getBookById(addCopyModalBook._id);
      setBookCopiesMap((prev) => ({ ...prev, [addCopyModalBook._id]: updatedBook.data.copies }));
      setAddCopyModalBook(null);
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Failed to add copies');
    } finally {
      setAddingCopiesLoading(false);
    }
  };

  const handleArchiveBook = async (book) => {
    if (
      !window.confirm(
        `Are you sure you want to archive '${book.title}'? This will archive all physical copies.`
      )
    ) {
      return;
    }

    try {
      await api.archiveBook(book._id);
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Failed to archive book');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Books & Physical Copies</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage bibliographic titles, inventory copies, and unique accession codes.
          </p>
        </div>

        <button
          onClick={() => setIsAddBookModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <BookPlus className="w-4 h-4" />
          <span>Add New Book Title</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-24 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Availability: All</option>
            <option value="AVAILABLE">Availability: Available</option>
            <option value="ISSUED">Availability: Issued</option>
          </select>

          <button
            onClick={fetchBooks}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Book Catalog List */}
      {loading && books.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Loading catalog records...</span>
        </div>
      ) : books.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">No books found in catalog.</p>
          <button
            onClick={() => setIsAddBookModalOpen(true)}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Add First Book Title
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((book) => {
            const isExpanded = expandedBookId === book._id;
            const copies = bookCopiesMap[book._id] || [];
            const isLoadingCopies = loadingCopies[book._id];

            return (
              <div
                key={book._id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{book.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {book.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span>
                        Author: <strong className="text-slate-700">{book.author}</strong>
                      </span>
                      {book.isbn && (
                        <span>
                          ISBN: <strong className="font-mono text-slate-700">{book.isbn}</strong>
                        </span>
                      )}
                      {book.publishedYear && (
                        <span>
                          Year: <strong className="text-slate-700">{book.publishedYear}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Copy Counts Pill */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400">Total:</span>{' '}
                        <strong className="text-slate-800">{book.totalCopies}</strong>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div>
                        <span className="text-emerald-600 font-medium">Avail:</span>{' '}
                        <strong className="text-emerald-700">{book.availableCopies}</strong>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div>
                        <span className="text-amber-600 font-medium">Issued:</span>{' '}
                        <strong className="text-amber-700">
                          {book.totalCopies - book.availableCopies}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setAddCopyModalBook(book)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="Add physical copies"
                    >
                      + Copy
                    </button>

                    <button
                      onClick={() => toggleExpandBook(book._id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <span>Copies ({book.totalCopies})</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleArchiveBook(book)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Archive book title"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Physical Copies Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Physical Copies & QR Accession Identifiers
                      </h4>
                      <span className="text-xs text-slate-500">
                        Click any accession code to quickly test Issue or Return.
                      </span>
                    </div>

                    {isLoadingCopies ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Loading copy details...
                      </div>
                    ) : copies.length === 0 ? (
                      <div className="py-3 text-xs text-slate-500 text-center">
                        No physical copies found for this title.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {copies.map((copy) => (
                          <div
                            key={copy._id}
                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {copy.accessionCode}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                    copy.status === 'AVAILABLE'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {copy.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Condition: {copy.condition}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  setActiveQrModal({
                                    code: copy.accessionCode,
                                    qrUrl: copy.qrCodeUrl,
                                    title: book.title,
                                  })
                                }
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                                title="View QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              {onSelectAccessionCode && (
                                <button
                                  onClick={() => onSelectAccessionCode(copy.accessionCode)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold transition-colors"
                                >
                                  Use Code
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Book Modal */}
      <Modal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        title="Add New Catalog Book Title"
        maxWidth="max-w-2xl"
      >
        <BookForm
          onSuccess={() => {
            setIsAddBookModalOpen(false);
            fetchBooks();
          }}
          onCancel={() => setIsAddBookModalOpen(false)}
        />
      </Modal>

      {/* Add Copies Modal */}
      <Modal
        isOpen={!!addCopyModalBook}
        onClose={() => setAddCopyModalBook(null)}
        title={`Add Physical Copies: ${addCopyModalBook?.title}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCopiesSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Specify how many physical inventory copies to generate. Each copy will automatically
            receive a guaranteed unique accession code and printable QR tag.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Number of Copies to Add
            </label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={copiesToAddCount}
              onChange={(e) => setCopiesToAddCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddCopyModalBook(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingCopiesLoading}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {addingCopiesLoading ? 'Adding...' : `Add ${copiesToAddCount} Copies`}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Inspection Modal */}
      <Modal
        isOpen={!!activeQrModal}
        onClose={() => setActiveQrModal(null)}
        title={`Accession QR Code: ${activeQrModal?.code}`}
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-xs mb-3">
            {activeQrModal?.qrUrl && (
              <img
                src={activeQrModal.qrUrl}
                alt={`QR for ${activeQrModal.code}`}
                className="w-48 h-48"
              />
            )}
          </div>
          <div className="font-mono text-sm font-bold text-slate-900">{activeQrModal?.code}</div>
          <p className="text-xs text-slate-500 mt-1">{activeQrModal?.title}</p>
        </div>
      </Modal>
    </div>
  );
}
