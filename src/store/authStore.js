// src/store/authStore.js
import { create } from 'zustand';

// Create the store
export const useAuthStore = create((set) => ({
  // State
  user: null,

  // Actions
  login: (userData) => {
    // Save user to localStorage for persistence
    localStorage.setItem('loggedInUser', JSON.stringify(userData));
    set({ user: userData });
  },

  logout: () => {
    // Remove user from localStorage
    localStorage.removeItem('loggedInUser');
    set({ user: null });
  },
  
  // Action to check localStorage on initial load
  checkAuth: () => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      set({ user: JSON.parse(userJson) });
    }
  },
}));