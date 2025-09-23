// src/components/DatabaseInitializer.jsx
'use client';

import { useEffect } from 'react';
import { initDatabase } from '@/services/localStorageService';
import { useAuthStore } from '@/store/authStore'; // Import the store

export default function DatabaseInitializer() {
  const checkAuth = useAuthStore((state) => state.checkAuth); // Get the checkAuth action

  useEffect(() => {
    initDatabase();
    checkAuth(); // Check for a logged-in user on initial load
  }, [checkAuth]);

  return null;
}