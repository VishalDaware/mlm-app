// src/components/DatabaseInitializer.jsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore'; // Import the store

export default function DatabaseInitializer() {
  const checkAuth = useAuthStore((state) => state.checkAuth); // Get the checkAuth action

  useEffect(() => {
    // backend initialization handled server-side; just check auth on load
    checkAuth(); // Check for a logged-in user on initial load
  }, [checkAuth]);

  return null;
}