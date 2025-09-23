// src/services/apiService.js
import toast from 'react-hot-toast';

// A more robust helper function to handle various API responses
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
  }).then(handleResponse);
};

export const checkAuthStatus = () => {
  return fetch('/api/auth/me').then(res => {
    if (!res.ok) return null;
    return res.json();
  });
};

// --- Products ---
export const getProducts = () => fetch('/api/products').then(handleResponse);

export const addProduct = (productData) => {
  return fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  }).then(handleResponse);
};

export const updateProduct = (productId, productData) => {
  return fetch(`/api/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  }).then(handleResponse);
};

export const deleteProduct = (productId) => {
  return fetch(`/api/products/${productId}`, {
    method: 'DELETE',
  }).then(handleResponse);
};


// --- Users ---
export const addUser = (userData) => {
   return fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  }).then(handleResponse);
}

// NEW: Function to get a user's downline
export const getDownline = (userId) => fetch(`/api/users/${userId}/downline`).then(handleResponse);

// NEW: Function to get a user's hierarchy
export const getHierarchy = (userId) => fetch(`/api/users/${userId}/hierarchy`).then(handleResponse);


// --- Sales ---
export const createSale = (saleData) => {
   return fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  }).then(handleResponse);
}

// NEW: Function to get sales for a specific user
export const getSalesForUser = (userId) => fetch(`/api/sales/user/${userId}`).then(handleResponse);