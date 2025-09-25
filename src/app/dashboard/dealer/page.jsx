'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getProducts, createSale, getSalesForUser } from '@/services/apiService';
import DashboardHeader from '@/components/DashboardHeader';
import toast from 'react-hot-toast';
import Spinner from '@/components/Spinner';

export default function DealerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [saleProduct, setSaleProduct] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        const [productData, salesData] = await Promise.all([
          getProducts(),
          getSalesForUser(user.userId),
        ]);
        setProducts(productData);
        setSales(salesData.filter(s => s.sellerId === user.id));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user) {
      const earnings = sales.reduce((acc, sale) => acc + sale.sellerCommission, 0);
      setTotalEarnings(earnings);
    }
  }, [sales, user]);

  const handleLogout = () => { logout(); router.push('/'); };
  useEffect(() => { if (user && user.role !== 'Dealer') router.push('/'); }, [user, router]);

  const handleMakeSale = async (e) => {
    e.preventDefault();
    if (!saleProduct || saleQuantity < 1) return;
    try {
      await createSale({ sellerId: user.id, productId: saleProduct, quantity: parseInt(saleQuantity) });
      toast.success('Sale completed successfully!');
      setSaleProduct('');
      setSaleQuantity(1);
      fetchData(); 
    } catch (error) {
      console.error("Failed to make sale:", error);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-50">
        <Spinner size={100} color="#166534" />
      </div>
    );
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader title="Dealer Dashboard" userName={user.name} onLogout={handleLogout} />
      
      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold tracking-wider uppercase">Total Earnings</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">₹{totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Sales History</h2>
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                      <th className="p-3 font-semibold">Product</th>
                      <th className="p-3 font-semibold">Qty</th>
                      <th className="p-3 font-semibold">Total</th>
                      <th className="p-3 font-semibold">My Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length > 0 ? sales.map(sale => (
                      <tr key={sale.id} className="border-b border-stone-200 hover:bg-stone-50">
                        <td className="p-3 text-gray-800">{getProductName(sale.productId)}</td>
                        <td className="p-3 text-gray-800">{sale.quantity}</td>
                        <td className="p-3 text-gray-800">₹{sale.totalAmount.toFixed(2)}</td>
                        <td className="p-3 text-green-700 font-semibold">₹{sale.sellerCommission.toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="p-3 text-center text-gray-500">You haven't made any sales yet.</td></tr>
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Make a Sale</h2>
          <form onSubmit={handleMakeSale} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
              <select value={saleProduct} onChange={(e) => setSaleProduct(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select a Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
              <input type="number" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" min="1"/>
            </div>
            <button type="submit" className="w-full mt-2 px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors">Complete Sale</button>
          </form>
        </div>
      </main>
    </div>
  );
}