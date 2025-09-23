// src/components/admin/Analytics.jsx
'use client';

// NOTE: We no longer need useState or useEffect from React
import { getSales, getUsers } from '@/services/localStorageService';

const StatCard = ({ title, value, colorClass }) => (
  <div className={`p-6 rounded-lg shadow-md ${colorClass}`}>
    <h3 className="text-sm font-semibold uppercase text-gray-700">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);

// We remove the 'activeTab' prop as it's no longer needed
export default function Analytics() {
  // --- Calculations are now done directly on every render ---
  const allSales = getSales();
  const allUsers = getUsers();

  const totalSalesValue = allSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalCommissionValue = allSales.reduce(
    (acc, sale) => acc + sale.sellerCommission + sale.uplineCommission,
    0
  );
  const activeUsersCount = allUsers.filter(user => user.role !== 'Admin').length;
  // --- End of calculations ---

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