// src/components/admin/AddNewUser.jsx
'use client';

import { useState } from 'react';
import { addUser } from '@/services/localStorageService';
import toast from 'react-hot-toast';
import { ThreeDots } from 'react-loader-spinner'; // 1. Import spinner

export default function AddNewUser() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Distributor');
  const [isSubmitting, setIsSubmitting] = useState(false); // 2. Add submitting state

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name.');
      return;
    }

    setIsSubmitting(true); // 3. Set submitting to true

    // Simulate a delay for the action
    setTimeout(() => {
      const newUser = { name, role };
      const createdUser = addUser(newUser, 'admin');

      toast.success(`User "${createdUser.name}" created! ID: ${createdUser.userId}`);

      // Reset form and submitting state
      setName('');
      setRole('Distributor');
      setIsSubmitting(false); // 4. Set submitting back to false
    }, 1000); // 1-second delay
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Add New User</h2>
      <form onSubmit={handleCreateUser} className="max-w-lg">
        {/* Form inputs remain the same */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">User's Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className="w-full p-3 border border-gray-300 rounded-md" required />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Assign Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white">
            <option value="Distributor">Distributor</option>
            <option value="Dealer">Dealer</option>
            <option value="Farmer">Farmer</option>
          </select>
        </div>
        
        {/* 5. Update the button to show spinner and be disabled when submitting */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-40 h-12 flex justify-center items-center px-8 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <ThreeDots color="#FFF" height={30} width={30} />
          ) : (
            'Create User'
          )}
        </button>
      </form>
    </div>
  );
}