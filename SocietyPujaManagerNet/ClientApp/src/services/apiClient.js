const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('jwt_token');
    window.location.hash = '/login';
    throw new Error('Unauthorized or session expired');
  }
  
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const apiGet = async (path) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const apiPost = async (path, body) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const apiPut = async (path, body) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const apiDelete = async (path) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};
