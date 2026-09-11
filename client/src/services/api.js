const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'Network error occurred';
    try {
      const data = await response.json();
      errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    } catch {
      errorMessage = `Server responded with ${response.status} ${response.statusText}`;
    }
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Dashboard
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return handleResponse(res);
  },

  // Books
  async getBooks(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.availability && params.availability !== 'ALL') query.set('availability', params.availability);
    const res = await fetch(`${API_BASE}/books?${query.toString()}`);
    return handleResponse(res);
  },

  async getBookById(id) {
    const res = await fetch(`${API_BASE}/books/${id}`);
    return handleResponse(res);
  },

  async createBook(payload) {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async addCopies(bookId, payload) {
    const res = await fetch(`${API_BASE}/books/${bookId}/copies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async archiveBook(id) {
    const res = await fetch(`${API_BASE}/books/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Copies
  async lookupCopy(accessionCode) {
    const res = await fetch(`${API_BASE}/copies/lookup/${encodeURIComponent(accessionCode)}`);
    return handleResponse(res);
  },

  async getCopyLabels() {
    const res = await fetch(`${API_BASE}/copies/labels/all`);
    return handleResponse(res);
  },

  // Transactions
  async issueBook(payload) {
    const res = await fetch(`${API_BASE}/transactions/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async returnBook(payload) {
    const res = await fetch(`${API_BASE}/transactions/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.borrower) query.set('borrower', params.borrower);
    if (params.accessionCode) query.set('accessionCode', params.accessionCode);
    if (params.overdueOnly) query.set('overdueOnly', 'true');
    const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
    return handleResponse(res);
  },

  getExportUrl() {
    return `${API_BASE}/transactions/export`;
  },

  // Members
  async getMembers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.memberType && params.memberType !== 'ALL') query.set('memberType', params.memberType);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    const res = await fetch(`${API_BASE}/members?${query.toString()}`);
    return handleResponse(res);
  },

  async getMemberById(id) {
    const res = await fetch(`${API_BASE}/members/${id}`);
    return handleResponse(res);
  },

  async lookupMember(query) {
    const res = await fetch(`${API_BASE}/members/lookup/${encodeURIComponent(query)}`);
    return handleResponse(res);
  },

  async createMember(payload) {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateMember(id, payload) {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteMember(id) {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};
