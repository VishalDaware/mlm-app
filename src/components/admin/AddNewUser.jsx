'use client';

import { useState } from 'react';
import { addUser } from '@/services/apiService'; 
import toast from 'react-hot-toast';
import Spinner from '@/components/Spinner';

export default function AddNewUser() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Distributor');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newUser = {
        name,
        role,
        uplineId: 'admin', 
      };

      const createdUser = await addUser(newUser);

      toast.success(`User "${createdUser.name}" created! ID: ${createdUser.userId}`);
      
      setName('');
      setRole('Distributor');
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Add New User</h2>
      <form onSubmit={handleCreateUser} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">User's Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Assign Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Distributor">Distributor</option>
            <option value="Dealer">Dealer</option>
            <option value="Farmer">Farmer</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-40 h-12 flex justify-center items-center px-8 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Spinner size={30} color="#FFF" />
          ) : (
            'Create User'
          )}
        </button>
      </form>
    </div>
  );
}