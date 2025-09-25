// src/app/dashboard/distributor/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
// 1. Import the getHierarchy function
import { getProducts, getDownline, addUser, createSale, getSalesForUser, getHierarchy } from '@/services/apiService';
import DashboardHeader from '@/components/DashboardHeader';
import toast from 'react-hot-toast';
import { ThreeDots } from 'react-loader-spinner';
// 2. Import the reusable HierarchyNode component
import HierarchyNode from '@/components/admin/HierarchyNode';

export default function DistributorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [products, setProducts] = useState([]);
  const [downline, setDownline] = useState([]);
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState({ earnings: 0, teamSize: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState(null); // 3. Add state for hierarchy data

  const [saleProduct, setSaleProduct] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [newDealerName, setNewDealerName] = useState('');

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        // 4. Fetch hierarchy data along with other data
        const [productData, downlineData, salesData, hierarchyData] = await Promise.all([
          getProducts(),
          getDownline(user.userId),
          getSalesForUser(user.userId),
          getHierarchy(user.userId),
        ]);
        setProducts(productData);
        setDownline(downlineData);
        setSales(salesData);
        setHierarchy(hierarchyData); // 5. Set the hierarchy state
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  // All other logic functions (useEffect, handleLogout, handleAddDealer, etc.) remain exactly the same.
  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (user && sales) {
      const totalEarnings = sales.reduce((acc, sale) => {
        if (sale.sellerId === user.id) return acc + sale.sellerCommission;
        if (sale.uplineId === user.id) return acc + sale.uplineCommission;
        return acc;
      }, 0);
      setAnalytics({ earnings: totalEarnings, teamSize: downline.length });
    }
  }, [sales, downline, user]);
  
  const handleLogout = () => { logout(); router.push('/'); };
  useEffect(() => { if (user && user.role !== 'Distributor') router.push('/'); }, [user, router]);

  const handleAddDealer = async (e) => { e.preventDefault(); if (!newDealerName.trim()) return; try { await addUser({ name: newDealerName, role: 'Dealer', uplineId: user.id }); setNewDealerName(''); toast.success(`Dealer "${newDealerName}" added successfully!`); fetchData(); } catch (error) { console.error("Failed to add dealer:", error); } };
  const handleMakeSale = async (e) => { e.preventDefault(); if (!saleProduct || saleQuantity < 1) return; try { await createSale({ sellerId: user.id, productId: saleProduct, quantity: parseInt(saleQuantity) }); toast.success('Sale completed successfully!'); setSaleProduct(''); setSaleQuantity(1); fetchData(); } catch (error) { console.error("Failed to make sale:", error); } };


  if (!user || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-50">
        <ThreeDots color="#166534" height={100} width={100} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader title="Distributor Dashboard" userName={user.name} onLogout={handleLogout} />
      
      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Analytics and Make a Sale sections remain the same */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold tracking-wider uppercase">Total Earnings</h3><p className="text-4xl font-bold text-green-600 mt-2">₹{analytics.earnings.toFixed(2)}</p></div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold tracking-wider uppercase">Team Size</h3><p className="text-4xl font-bold text-teal-600 mt-2">{analytics.teamSize}</p></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Make a Sale</h2>
            <form onSubmit={handleMakeSale} className="flex flex-wrap items-end gap-4">
              <div className="flex-grow min-w-[200px]"><label className="block text-sm font-medium text-gray-600">Product</label><select value={saleProduct} onChange={(e) => setSaleProduct(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"><option value="">Select a Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-600">Quantity</label><input type="number" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} className="w-24 mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" min="1"/></div>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 h-10 transition-colors">Sell</button>
            </form>
          </div>

          {/* 6. NEW: Add the Team Hierarchy section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Team Hierarchy</h2>
            {hierarchy ? (
              <div className="pl-2">
                <HierarchyNode user={hierarchy} />
              </div>
            ) : (
              <p className="text-gray-500">Hierarchy data could not be loaded.</p>
            )}
          </div>
        </div>
        
        {/* The right sidebar remains the same */}
        <div className="flex flex-col gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Dealer</h2>
            <form onSubmit={handleAddDealer}>
              <label className="block text-sm font-medium text-gray-600">Dealer Name</label>
              <input type="text" value={newDealerName} onChange={(e) => setNewDealerName(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter dealer's name"/>
              <button type="submit" className="w-full mt-4 px-6 py-2 bg-teal-600 text-white font-bold rounded-md hover:bg-teal-700 transition-colors">Add Dealer</button>
            </form>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Team (Dealers)</h2>
            <ul className="space-y-2">
              {downline.length > 0 ? downline.map(d => (
                <li key={d.userId} className="p-3 bg-stone-100 border border-stone-200 rounded-md text-stone-700">{d.name} ({d.userId})</li>
              )) : <p className="text-gray-500">You have not recruited any dealers yet.</p>}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}