// src/components/admin/PayoutsView.jsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPendingPayouts, createPayout } from '@/services/apiService';
import toast from 'react-hot-toast';
import { ThreeDots } from 'react-loader-spinner';

export default function PayoutsView() {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All', 'Distributor', 'Dealer'

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPendingPayouts();
      setPayouts(data);
    } catch (error) {
      console.error("Failed to fetch pending payouts:", error);
      toast.error("Could not load payout data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePay = async (userToPay) => {
    if (window.confirm(`Are you sure you want to pay ₹${userToPay.pendingBalance.toFixed(2)} to ${userToPay.name}?`)) {
      try {
        await createPayout({ userId: userToPay.id, amount: userToPay.pendingBalance });
        toast.success('Payment recorded successfully!');
        fetchData(); // Refresh the list
      } catch (error) {
        console.error("Failed to record payment:", error);
      }
    }
  };

  const filteredPayouts = useMemo(() => {
    if (filter === 'All') return payouts;
    return payouts.filter(p => p.role === filter);
  }, [filter, payouts]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Pending Payouts</h2>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        {['All', 'Distributor', 'Dealer'].map(role => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              filter === role ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {role}s
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <ThreeDots color="#166534" height={80} width={80} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                <th className="p-3 font-semibold">User Name</th>
                <th className="p-3 font-semibold">User ID</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Pending Amount</th>
                <th className="p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.length > 0 ? (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-stone-200 hover:bg-stone-50">
                    <td className="p-3 text-gray-800">{payout.name}</td>
                    <td className="p-3 text-gray-800">{payout.userId}</td>
                    <td className="p-3 text-gray-800">{payout.role}</td>
                    <td className="p-3 font-bold text-red-600">₹{payout.pendingBalance.toFixed(2)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handlePay(payout)}
                        className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">No pending payouts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}