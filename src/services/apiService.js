// src/services/apiService.js
import toast from 'react-hot-toast';

// --- Helper to handle API responses ---
const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    let errorData = { error: `HTTP error! Status: ${response.status}` };
    if (contentType && contentType.includes("application/json")) {
      errorData = await response.json();
    }
    toast.error(errorData.error || 'An unexpected error occurred.');
    throw new Error(errorData.error || 'API request failed');
  }

  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return;
  }

  return response.json();
};

// --- Auth ---
export const login = (credentials) => {
  return fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include' // 🔑 ensures cookie gets stored
  })
    .then(handleResponse)
    .then((data) => {
      return data; // no need to store token manually
    });
};

export const checkAuthStatus = () => {
  return fetch('/api/auth/me', {
    credentials: 'include' // 🔑 cookie auto-sent
  }).then(res => {
    if (!res.ok) return null;
    return res.json();
  });
};

// --- Products ---
export const getProducts = () => {
  return fetch('/api/products', {
    credentials: 'include'
  }).then(handleResponse);
};

export const addProduct = (productData) => {
  return fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
    credentials: 'include'
  }).then(handleResponse);
};

export const updateProduct = (productId, productData) => {
  return fetch(`/api/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
    credentials: 'include'
  }).then(handleResponse);
};

export const deleteProduct = (productId) => {
  return fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
};

// --- Users ---
export const addUser = (userData) => {
  return fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include'
  }).then(handleResponse);
};

export const getDownline = (userId) => {
  return fetch(`/api/users/${userId}/downline`, {
    credentials: 'include'
  }).then(handleResponse);
};

export const getHierarchy = (userId) => {
  return fetch(`/api/users/${userId}/hierarchy`, {
    credentials: 'include'
  }).then(handleResponse);
};

// --- Sales ---
export const createSale = (saleData) => {
  return fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
    credentials: 'include'
  }).then(handleResponse);
};

export const getSalesForUser = (userId) => {
  return fetch(`/api/sales/user/${userId}`, {
    credentials: 'include'
  }).then(handleResponse);
};
