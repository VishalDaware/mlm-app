'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { 
  getDownline, 
  addUser, 
  createSale, 
  getPendingPayoutForUser,
  getUserInventory,
  getHierarchy
} from '../../../services/apiService';
import DashboardHeader from '../../../components/DashboardHeader';
import HierarchyNode from '../../../components/admin/HierarchyNode';
import toast from 'react-hot-toast';

// Simple inline SVG loader
const Loader = () => (
    <div className="flex justify-center items-center h-screen">
        <svg width="80" height="80" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#166534">
            <g fill="none" fillRule="evenodd"><g transform="translate(1 1)" strokeWidth="2"><circle strokeOpacity=".5" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g>
        </svg>
    </div>
);


export default function DistributorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [inventory, setInventory] = useState([]);
  const [downline, setDownline] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [analytics, setAnalytics] = useState({ pending: 0, teamSize: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [sellProductId, setSellProductId] = useState('');
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellTo, setSellTo] = useState('');
  const [newSubDistributorName, setNewSubDistributorName] = useState('');
  
  const selectedProductInStock = inventory.find(item => item.productId === sellProductId)?.quantity || 0;

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        setIsLoading(true);
        const [inventoryData, downlineData, payoutData, hierarchyData] = await Promise.all([
          getUserInventory(),
          getDownline(user.userId),
          getPendingPayoutForUser(user.userId),
          getHierarchy(user.userId)
        ]);
        setInventory(inventoryData);
        setDownline(downlineData);
        setAnalytics({ pending: payoutData.pendingBalance, teamSize: downlineData.length });
        setHierarchy(hierarchyData);
      } catch (error) {
        toast.error("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if(user) fetchData();
  }, [user, fetchData]);

  const handleLogout = () => { logout(); router.push('/'); };
  useEffect(() => { if (user && user.role !== 'Distributor') router.push('/'); }, [user, router]);
  
  const handleSell = async (e) => {
    e.preventDefault();
    if (!sellProductId || !sellTo || sellQuantity < 1) return toast.error("Please fill all fields.");
    if (parseInt(sellQuantity) > selectedProductInStock) return toast.error(`Not enough stock.`);
    try {
      await createSale({ buyerId: sellTo, productId: sellProductId, quantity: parseInt(sellQuantity) });
      toast.success('Sale recorded successfully!');
      setSellProductId('');
      setSellQuantity(1);
      setSellTo('');
      fetchData();
    } catch (error) {
        const errorMessage = error.response?.data?.error || "Failed to complete sale.";
        toast.error(errorMessage);
    }
  };
  
  const handleAddSubDistributor = async (e) => {
    e.preventDefault();
    if (!newSubDistributorName.trim()) return;
    try {
      await addUser({ name: newSubDistributorName, role: 'SubDistributor', uplineId: user.id });
      setNewSubDistributorName('');
      toast.success(`Sub-Distributor added!`);
      fetchData();
    } catch (error) { toast.error('Failed to add sub-distributor.'); }
  };

  if (!user || isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader title="Distributor Dashboard" userName={user.name} onLogout={handleLogout} />
      <main className="container mx-auto p-6 space-y-8">
        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold uppercase">Pending Payout</h3><p className="text-4xl font-bold text-red-600 mt-2">₹{analytics.pending.toFixed(2)}</p></div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold uppercase">Team Size (Sub-Distributors)</h3><p className="text-4xl font-bold text-teal-600 mt-2">{analytics.teamSize}</p></div>
        </div>

        {/* Main Content Area - 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left Column: Forms */}
          <div className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sell to Sub-Distributor</h2>
              <form onSubmit={handleSell} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Product</label>
                  <select value={sellProductId} onChange={(e) => setSellProductId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                    <option value="">Select Product</option>
                    {inventory.map(item => <option key={item.id} value={item.productId}>{item.product.name} (In Stock: {item.quantity})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Quantity</label>
                  <input type="number" value={sellQuantity} onChange={(e) => setSellQuantity(e.target.value)} className="w-full mt-1 p-2 border rounded-md" min="1" max={selectedProductInStock} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Sell To</label>
                  <select value={sellTo} onChange={(e) => setSellTo(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                    <option value="">Select Sub-Distributor</option>
                    {downline.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full mt-2 py-3 bg-green-600 text-white font-bold rounded-md">Complete Sale</button>
              </form>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recruit Sub-Distributor</h2>
              <form onSubmit={handleAddSubDistributor}>
                <label className="block text-sm font-medium">Sub-Distributor Name</label>
                <input type="text" value={newSubDistributorName} onChange={(e) => setNewSubDistributorName(e.target.value)} className="w-full mt-1 p-2 border rounded-md" />
                <button type="submit" className="w-full mt-4 py-2 bg-teal-600 text-white font-bold rounded-md">Add Sub-Distributor</button>
              </form>
            </div>
          </div>

          {/* Right Column: Information Displays */}
          <div className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Inventory</h2>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead><tr className="bg-stone-100 text-stone-600 uppercase text-sm sticky top-0"><th className="p-3">Product Name</th><th className="p-3">Your Stock</th></tr></thead>
                  <tbody>
                    {inventory.length > 0 ? inventory.map(item => (
                      <tr key={item.id} className="border-b"><td className="p-3">{item.product.name}</td><td className="p-3 font-medium">{item.quantity} Units</td></tr>
                    )) : <tr><td colSpan="2" className="p-3 text-center">Your inventory is empty.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Team Hierarchy</h2>
              <div className="overflow-y-auto max-h-96 pl-2 border-l-2 border-stone-200">
                {hierarchy ? (
                  <HierarchyNode user={hierarchy} />
                ) : (
                  <p className="text-gray-500 text-center">No downline hierarchy to display.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

