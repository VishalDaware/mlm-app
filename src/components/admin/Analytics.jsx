// src/components/admin/Analytics.jsx
'use client';

import { useEffect, useState } from 'react';
import { getSalesForUser } from '@/services/apiService';
import { getSales, getUsers } from '@/services/apiService';

const StatCard = ({ title, value, colorClass }) => (
  <div className={`p-6 rounded-lg shadow-md ${colorClass}`}>
    <h3 className="text-sm font-semibold uppercase text-gray-700">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [totalCommissionValue, setTotalCommissionValue] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const sales = await getSales();
        const users = await getUsers();

        if (!mounted) return;

        const totalSales = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
        const totalCommission = sales.reduce((acc, sale) => acc + sale.sellerCommission + sale.uplineCommission, 0);
        const activeUsers = users.filter(u => u.role !== 'Admin').length;

        setTotalSalesValue(totalSales);
        setTotalCommissionValue(totalCommission);
        setActiveUsersCount(activeUsers);
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p>Loading analytics...</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Analytics & Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value={`₹${totalSalesValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          colorClass="bg-blue-200"
        />
        <StatCard
          title="Total Commission Paid"
          value={`₹${totalCommissionValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          colorClass="bg-green-200"
        />
        <StatCard
          title="Active Users"
          value={activeUsersCount}
          colorClass="bg-yellow-200"
        />
      </div>
    </div>
  );
}