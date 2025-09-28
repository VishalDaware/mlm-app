'use client';

import { useState, useEffect, useCallback } from 'react';
import { addUser, getUsersByRole, getDownline } from '@/services/apiService'; 
import toast from 'react-hot-toast';
import { ThreeDots } from 'react-loader-spinner';

export default function AddNewUser() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Franchise');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [franchises, setFranchises] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [subDistributors, setSubDistributors] = useState([]);
  const [dealers, setDealers] = useState([]);
  
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [selectedSubDistributor, setSelectedSubDistributor] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');

 
  const fetchFranchises = useCallback(async () => {
    try {
      const data = await getUsersByRole('Franchise');
      setFranchises(data);
    } catch (error) { 
      console.error("Failed to fetch franchises", error); 
      toast.error("Could not load franchises.");
    }
  }, []);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  useEffect(() => {
    if (selectedFranchise) {
      const franchise = franchises.find(f => f.id === selectedFranchise);
      if (franchise) {
        getDownline(franchise.userId).then(setDistributors).catch(console.error);
      }
    } else {
      setDistributors([]); 
    }
    setSelectedDistributor(''); 
  }, [selectedFranchise, franchises]);

  useEffect(() => {
    if (selectedDistributor) {
      const distributor = distributors.find(d => d.id === selectedDistributor);
      if (distributor) {
        getDownline(distributor.userId).then(setSubDistributors).catch(console.error);
      }
    } else {
      setSubDistributors([]);
    }
    setSelectedSubDistributor('');
  }, [selectedDistributor, distributors]);
    useEffect(() => {
    if (selectedSubDistributor) {
        const subDist = subDistributors.find(sd => sd.id === selectedSubDistributor);
        if(subDist) {
            getDownline(subDist.userId).then(setDealers).catch(console.error);
        }
    } else {
        setDealers([]);
    }
    setSelectedDealer('');
  }, [selectedSubDistributor, subDistributors]);



  const resetForm = () => {
    setName('');
    setRole('Franchise');
    setSelectedFranchise('');
    setSelectedDistributor('');
    setSelectedSubDistributor('');
    setSelectedDealer('');
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    setSelectedFranchise('');
    setSelectedDistributor('');
    setSelectedSubDistributor('');
    setSelectedDealer('');
    setName('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter a name for the new user.');

    let uplineId;
    switch(role) {
        case 'Franchise': uplineId = 'admin'; break;
        case 'Distributor': uplineId = selectedFranchise; break;
        case 'SubDistributor': uplineId = selectedDistributor; break;
        case 'Dealer': uplineId = selectedSubDistributor; break;
        case 'Farmer': uplineId = selectedDealer; break;
        default: return toast.error('Invalid role selected.');
    }

    if (!uplineId) return toast.error(`Please select an upline for the new ${role}.`);

    setIsSubmitting(true);
    try {
      const createdUser = await addUser({ name, role, uplineId });
      toast.success(`User "${createdUser.name}" created successfully! ID: ${createdUser.userId}`);
      
      if (role === 'Franchise') {
        fetchFranchises();
      }
      
      resetForm(); 

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
          <select value={role} onChange={handleRoleChange} className="w-full p-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="Franchise">Franchise</option>
            <option value="Distributor">Distributor</option>
            <option value="SubDistributor">Sub-Distributor</option>
            <option value="Dealer">Dealer</option>
            <option value="Farmer">Farmer</option>
          </select>
        </div>

        {['Distributor', 'SubDistributor', 'Dealer', 'Farmer'].includes(role) && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Under Franchise</label>
            <select value={selectedFranchise} onChange={(e) => setSelectedFranchise(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white">
              <option value="">-- Select a Franchise --</option>
              {franchises.map(f => <option key={f.id} value={f.id}>{f.name} ({f.userId})</option>)}
            </select>
          </div>
        )}

        {['SubDistributor', 'Dealer', 'Farmer'].includes(role) && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Under Distributor</label>
            <select value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white" disabled={!selectedFranchise}>
              <option value="">-- Select a Distributor --</option>
              {distributors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
            </select>
          </div>
        )}

        {['Dealer', 'Farmer'].includes(role) && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Under Sub-Distributor</label>
            <select value={selectedSubDistributor} onChange={(e) => setSelectedSubDistributor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white" disabled={!selectedDistributor}>
              <option value="">-- Select a Sub-Distributor --</option>
              {subDistributors.map(sd => <option key={sd.id} value={sd.id}>{sd.name} ({sd.userId})</option>)}
            </select>
          </div>
        )}
        
        {role === 'Farmer' && (
           <div>
            <label className="block text-gray-700 font-semibold mb-2">Under Dealer</label>
            <select value={selectedDealer} onChange={(e) => setSelectedDealer(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white" disabled={!selectedSubDistributor}>
              <option value="">-- Select a Dealer --</option>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-semibold mb-2">New User&apos;s Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
        </div>
        
        <button type="submit" disabled={isSubmitting} className="w-40 h-12 flex justify-center items-center px-8 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400">
          {isSubmitting ? <ThreeDots color="#FFF" height={30} width={30} /> : 'Create User'}
        </button>
      </form>
    </div>
  );
}

