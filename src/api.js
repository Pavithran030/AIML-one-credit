const API_BASE_URL = 'http://localhost:3001/api';

// Fetch with timeout and error handling
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Transaction API
export const transactionAPI = {
  // GET all transactions for a month
  getAll: async (month) => {
    const url = `${API_BASE_URL}/transactions${month ? `?month=${month}` : ''}`;
    const response = await fetchWithTimeout(url);
    return response.json();
  },

  // GET single transaction
  getById: async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/transactions/${id}`);
    return response.json();
  },

  // POST create transaction
  create: async (transaction) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
    return response.json();
  },

  // PUT update transaction
  update: async (id, transaction) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
    return response.json();
  },

  // DELETE transaction
  delete: async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Month API
export const monthAPI = {
  getAll: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/months`);
    return response.json();
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
    return response.json();
  } catch {
    return null;
  }
};
