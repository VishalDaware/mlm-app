'use client';

import { useEffect, useState } from 'react';
import { getSales, getUsers } from '@/services/apiService';

const StatCard = ({ title, value, colorClass }) => (
  <div className={`p-6 rounded-lg shadow-lg ${colorClass}`}>
    <h3 className="text-sm font-semibold uppercase text-gray-800">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [salesData, usersData] = await Promise.all([
          getSales(),
          getUsers(),
        ]);

        console.log("Sales Data:", salesData);
        console.log("Users Data:", usersData);

        const totalSales = Array.isArray(salesData)
          ? salesData.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0)
          : 0;

        const totalCommission = Array.isArray(salesData)
          ? salesData.reduce(
              (acc, sale) =>
                acc +
                ((sale.sellerCommission || 0) +
                  (sale.uplineCommission || 0)),
              0
            )
          : 0;

        const activeUsers = Array.isArray(usersData) ? usersData.length : 0;

        setStats({
          totalSalesValue: totalSales,
          totalCommissionValue: totalCommission,
          activeUsersCount: activeUsers,
        });
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      }
    };

    fetchStats();
  }, []);

  if (!stats) return <p className="text-center p-4">Loading analytics...</p>;

  if (
    stats.totalSalesValue === 0 &&
    stats.totalCommissionValue === 0 &&
    stats.activeUsersCount === 0
  ) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Analytics & Overview
        </h2>
        <p className="text-center p-6 text-gray-500 bg-gray-100 rounded-lg shadow">
          No analytics data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Analytics & Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value={`₹${stats.totalSalesValue.toLocaleString('en-IN')}`}
          colorClass="bg-blue-200"
        />
        <StatCard
          title="Total Commission Paid"
          value={`₹${stats.totalCommissionValue.toLocaleString('en-IN')}`}
          colorClass="bg-green-200"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsersCount}
          colorClass="bg-yellow-200"
        />
      </div>
    </div>
  );
}
