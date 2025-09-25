// src/components/admin/FullHierarchyModal.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHierarchy } from '@/services/apiService'; 
import HierarchyNode from './HierarchyNode';
import { ThreeDots } from 'react-loader-spinner';

export default function FullHierarchyModal({ onClose }) {
  const [hierarchyData, setHierarchyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the full hierarchy starting from 'admin'
  const fetchFullHierarchy = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getHierarchy('admin');
      setHierarchyData(data);
    } catch (err) {
      console.error("Failed to fetch full hierarchy", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFullHierarchy();
  }, [fetchFullHierarchy]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Full Company Hierarchy</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </header>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <ThreeDots color="#166534" height={80} width={80} />
            </div>
          ) : (
            hierarchyData ? <HierarchyNode user={hierarchyData} /> : <p>Could not load hierarchy.</p>
          )}
        </div>
      </div>
    </div>
  );
}