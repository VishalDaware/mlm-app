// src/app/dashboard/distributor/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getProducts, getDownline, addUser, createSale, getSalesForUser } from '@/services/localStorageService';
import DashboardHeader from '@/components/DashboardHeader'; // 1. Import the new header
import toast from 'react-hot-toast';

export default function DistributorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [products, setProducts] = useState([]);
  const [downline, setDownline] = useState([]);
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState({ earnings: 0, teamSize: 0 });
  const [saleProduct, setSaleProduct] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [newDealerName, setNewDealerName] = useState('');

  useEffect(() => {
    if (user) {
      setProducts(getProducts());
      const userDownline = getDownline(user.userId);
      setDownline(userDownline);
      const userSales = getSalesForUser(user.userId);
      setSales(userSales);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const totalEarnings = sales.reduce((acc, sale) => {
        if (sale.sellerId === user.userId) return acc + sale.sellerCommission;
        if (sale.uplineId === user.userId) return acc + sale.uplineCommission;
        return acc;
      }, 0);
      setAnalytics({ earnings: totalEarnings, teamSize: downline.length });
    }
  }, [sales, downline, user]);

  useEffect(() => {
    if (user && user.role !== 'Distributor') {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleAddDealer = (e) => {
    e.preventDefault();
    if (!newDealerName.trim()) return;
    const newDealerData = { name: newDealerName, role: 'Dealer' };
    addUser(newDealerData, user.userId);
    setDownline(getDownline(user.userId));
    setNewDealerName('');
    toast.success(`Dealer "${newDealerName}" added successfully!`);
  };

  const handleMakeSale = (e) => {
    e.preventDefault();
    if (!saleProduct || saleQuantity < 1) return;
    createSale({ sellerId: user.userId, productId: saleProduct, quantity: parseInt(saleQuantity) });
    setSales(getSalesForUser(user.userId));
    setProducts(getProducts());
    toast.success('Sale completed successfully!');
  };

  if (!user) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    // 2. Use the consistent earthy background
    <div className="min-h-screen bg-stone-50">
      {/* 3. Use the new reusable header component */}
      <DashboardHeader title="Distributor Dashboard" userName={user.name} onLogout={handleLogout} />
      
      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* 4. Restyled Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold tracking-wider uppercase">Total Earnings</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">₹{analytics.earnings.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold tracking-wider uppercase">Team Size</h3>
              <p className="text-4xl font-bold text-teal-600 mt-2">{analytics.teamSize}</p>
            </div>
          </div>
          {/* 5. Restyled "Make a Sale" Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Make a Sale</h2>
            <form onSubmit={handleMakeSale} className="flex flex-wrap items-end gap-4">
              <div className="flex-grow min-w-[200px]">
                <label className="block text-sm font-medium text-gray-600">Product</label>
                <select value={saleProduct} onChange={(e) => setSaleProduct(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select a Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Quantity</label>
                <input type="number" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} className="w-24 mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" min="1"/>
              </div>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 h-10 transition-colors">Sell</button>
            </form>
          </div>
        </div>
        
        <div className="flex flex-col gap-8">
          {/* 6. Restyled "Add Dealer" and "My Team" Sections */}
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