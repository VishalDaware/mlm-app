'use client';

import { useState } from 'react';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('Sales Report');

  const reportTypes = [
    'Sales Report', 'Distributor Wise Report', 'Dealer Wise Report',
    'Monthly Sales Report', 'Half Yearly Sales Report',
    'Distributor Hierarchy', 'Dealer Hierarchy'
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Reports</h2>
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {reportTypes.map(report => (
          <button
            key={report}
            onClick={() => setActiveReport(report)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeReport === report
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {report}
          </button>
        ))}
      </div>
      <div className="p-4 bg-stone-50 rounded-md min-h-[200px]">
        <p className="text-gray-500">Select a report to generate.</p>
        <p className="font-semibold mt-2">Displaying: {activeReport}</p>
      </div>
    </div>
  );
}