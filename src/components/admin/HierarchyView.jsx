// src/components/admin/HierarchyView.jsx
'use client';

import { useState } from 'react';
import { getHierarchy } from '@/services/localStorageService';
import HierarchyNode from './HierarchyNode';

export default function HierarchyView() {
  const [searchInput, setSearchInput] = useState('');
  const [hierarchyData, setHierarchyData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    const data = getHierarchy(searchInput);
    if (data) {
      setHierarchyData(data);
      setError('');
    } else {
      setHierarchyData(null);
      setError(`User with ID "${searchInput}" not found.`);
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
        {/* Changed button color from blue to green */}
        <button 
          onClick={handleSearch} 
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          View Hierarchy
        </button>
      </div>
      
      <div>
        {error && <p className="text-red-500">{error}</p>}
        {hierarchyData && <HierarchyNode user={hierarchyData} />}
      </div>
    </div>
  );
}