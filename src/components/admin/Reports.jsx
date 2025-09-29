'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSalesReport } from '@/services/apiService';
import toast from 'react-hot-toast';

// Reusable Loader Component
const Loader = () => (
    <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

// Stat Card for Summary Data
const StatCard = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
);

export default function ReportsView() {
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for the filters
    const [activeTab, setActiveTab] = useState('total'); // 'total', 'monthly', 'halfYearly'
    const [roleFilter, setRoleFilter] = useState('All'); // 'All', 'Franchise', etc.

    const roles = ['All', 'Franchise', 'Distributor', 'SubDistributor', 'Dealer'];

    // Function to fetch data based on current filters
    const fetchReportData = useCallback(async () => {
        setIsLoading(true);
        try {
            const timePeriod = activeTab === 'total' ? null : activeTab;
            const data = await getSalesReport(timePeriod, roleFilter);
            setReportData(data);
        } catch (error) {
            toast.error("Could not load report data.");
            console.error("Failed to fetch report:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, roleFilter]);

    // Re-fetch data whenever a filter changes
    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    // Calculate summary stats from the report data
    const summaryStats = useMemo(() => {
        const totalRevenue = reportData.reduce((acc, sale) => acc + sale.totalAmount, 0);
        const totalUnitsSold = reportData.reduce((acc, sale) => acc + sale.quantity, 0);
        return { totalRevenue, totalUnitsSold };
    }, [reportData]);
    
    // Helper to format date strings
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sales Reports</h2>
            
            {/* --- Filter Controls --- */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                {/* Time Period Tabs */}
                <div className="flex border-b">
                    <button onClick={() => setActiveTab('total')} className={`px-4 py-2 font-semibold ${activeTab === 'total' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>Total Sales</button>
                    <button onClick={() => setActiveTab('monthly')} className={`px-4 py-2 font-semibold ${activeTab === 'monthly' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>Last Month</button>
                    <button onClick={() => setActiveTab('halfYearly')} className={`px-4 py-2 font-semibold ${activeTab === 'halfYearly' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>Last 6 Months</button>
                </div>
                {/* Role Filter Dropdown */}
                <div>
                    <label className="text-sm font-medium mr-2">Filter by Role:</label>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="p-2 border rounded-md">
                        {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
            </div>

            {/* --- Summary Stats --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <StatCard title="Total Revenue" value={`₹${summaryStats.totalRevenue.toLocaleString('en-IN')}`} />
                <StatCard title="Total Units Sold" value={summaryStats.totalUnitsSold.toLocaleString('en-IN')} />
            </div>

            {/* --- Data Table --- */}
            {isLoading ? (
                <Loader />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                                <th className="p-3">Date</th>
                                <th className="p-3">Product</th>
                                <th className="p-3">Seller</th>
                                <th className="p-3">Buyer</th>
                                <th className="p-3 text-center">Quantity</th>
                                <th className="p-3 text-right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? reportData.map(sale => (
                                <tr key={sale.id} className="border-b hover:bg-stone-50">
                                    <td className="p-3">{formatDate(sale.createdAt)}</td>
                                    <td className="p-3 font-medium">{sale.product.name}</td>
                                    <td className="p-3">{sale.seller.name} ({sale.seller.role})</td>
                                    <td className="p-3">{sale.buyer.name} ({sale.buyer.role})</td>
                                    <td className="p-3 text-center">{sale.quantity}</td>
                                    <td className="p-3 text-right font-semibold">₹{sale.totalAmount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No sales data found for the selected filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

