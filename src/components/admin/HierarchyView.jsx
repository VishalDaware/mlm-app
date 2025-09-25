'use client';

import { useState } from 'react';
import { getHierarchy } from '@/services/apiService'; 
import HierarchyNode from './HierarchyNode';
import Spinner from '@/components/Spinner'; 

export default function HierarchyView() {
  const [searchInput, setSearchInput] = useState('');
  const [hierarchyData, setHierarchyData] = useState(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false); 

  const handleSearch = async () => { 
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setHierarchyData(null);
    setError('');

    try {
      const data = await getHierarchy(searchInput);
      setHierarchyData(data);
    } catch (err) {
      setHierarchyData(null);
      setError(`User with ID "${searchInput}" not found or an error occurred.`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Distributor Hierarchy View</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Enter User ID (e.g., DIS3309)"
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="w-40 h-10 flex justify-center items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400"
        >
          {isSearching ? <Spinner size={20} color="#FFF" /> : 'View Hierarchy'}
        </button>
      </div>
      
      <div className="min-h-[200px]">
        {error && <p className="text-red-500">{error}</p>}
        {hierarchyData && <HierarchyNode user={hierarchyData} />}
      </div>
    </div>
  );
}