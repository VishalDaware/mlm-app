// src/components/admin/AddNewUser.jsx
'use client';

import { useState, useEffect } from 'react';
import { addUser, getUsersByRole, getDownline } from '@/services/apiService'; 
import toast from 'react-hot-toast';
import { ThreeDots } from 'react-loader-spinner';

export default function AddNewUser() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Distributor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for dynamic dropdowns
  const [distributors, setDistributors] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');

  // Fetch all distributors when the component loads
  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const data = await getUsersByRole('Distributor');
        setDistributors(data);
      } catch (error) {
        console.error("Failed to fetch distributors", error);
      }
    };
    fetchDistributors();
  }, []);

  // When a distributor is selected, fetch their downline (dealers)
  useEffect(() => {
    if (role === 'Farmer' && selectedDistributor) {
      const fetchDealers = async () => {
        try {
          const distributor = distributors.find(d => d.id === selectedDistributor);
          const data = await getDownline(distributor.userId);
          setDealers(data);
        } catch (error) {
          console.error("Failed to fetch dealers", error);
          setDealers([]); // Clear dealers on error
        }
      };
      fetchDealers();
    } else {
      setDealers([]); // Clear dealers if role or distributor changes
    }
  }, [role, selectedDistributor, distributors]);

  // Reset form fields when role changes
  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setName('');
    setSelectedDistributor('');
    setSelectedDealer('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name.');
      return;
    }

    let uplineId = 'admin'; // Default for Distributor
    if (role === 'Dealer') {
      if (!selectedDistributor) {
        toast.error('Please select a distributor.');
        return;
      }
      uplineId = selectedDistributor;
    } else if (role === 'Farmer') {
      if (!selectedDealer) {
        toast.error('Please select a dealer.');
        return;
      }
      uplineId = selectedDealer;
    }
    
    setIsSubmitting(true);
    try {
      const createdUser = await addUser({ name, role, uplineId });
      toast.success(`User "${createdUser.name}" created! ID: ${createdUser.userId}`);
      // Reset form
      setName('');
      setRole('Distributor');
      setSelectedDistributor('');
      setSelectedDealer('');
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Add New User</h2>
      <form onSubmit={handleCreateUser} className="max-w-lg space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Assign Role</label>
          <select value={role} onChange={handleRoleChange} className="w-full p-3 border border-gray-300 rounded-md bg-white">
            <option value="Distributor">Distributor</option>
            <option value="Dealer">Dealer</option>
            <option value="Farmer">Farmer</option>
          </select>
        </div>

        {/* Conditional Fields for Dealer */}
        {role === 'Dealer' && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Under Distributor</label>
            <select value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white">
              <option value="">-- Select a Distributor --</option>
              {distributors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
            </select>
          </div>
        )}

        {/* Conditional Fields for Farmer */}
        {role === 'Farmer' && (
          <>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Under Distributor</label>
              <select value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white">
                <option value="">-- Select a Distributor --</option>
                {distributors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Under Dealer</label>
              <select value={selectedDealer} onChange={(e) => setSelectedDealer(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white" disabled={!selectedDistributor || dealers.length === 0}>
                <option value="">-- Select a Dealer --</option>
                {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-gray-700 font-semibold mb-2">New User's Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className="w-full p-3 border border-gray-300 rounded-md" required />
        </div>
        
        <button type="submit" disabled={isSubmitting} className="w-40 h-12 flex justify-center items-center px-8 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400">
          {isSubmitting ? <ThreeDots color="#FFF" height={30} width={30} /> : 'Create User'}
        </button>
      </form>
    </div>
  );
}