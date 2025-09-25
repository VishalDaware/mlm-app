'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getProducts, createSale } from '@/services/apiService';
import DashboardHeader from '@/components/DashboardHeader';
import toast from 'react-hot-toast';
import Spinner from '@/components/Spinner';

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Could not load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if(user) fetchProducts();
  }, [user, fetchProducts]);

  useEffect(() => {
    if (user && user.role !== 'Farmer') {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handlePurchase = async (productId, quantity) => {
    if (!user || !user.uplineId) {
      toast.error("Error: Your account is not linked to a dealer.");
      return false;
    }
    if (quantity < 1) {
      toast.error("Please enter a valid quantity.");
      return false;
    }
    try {
      await createSale({ sellerId: user.uplineId, productId, quantity: parseInt(quantity) });
      toast.success('Purchase successful!');
      fetchProducts(); 
      return true;
    } catch (error) {
      console.error("Purchase failed:", error);
      return false;
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-50">
        <Spinner size={100} color="#166534" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader title="Farmer's Store" userName={user.name} onLogout={handleLogout} />
      
      <main className="container mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onPurchase={handlePurchase} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProductCard({ product, onPurchase }) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuyClick = async () => {
    setIsSubmitting(true);
    const success = await onPurchase(product.id, quantity);
    if (success) {
      setQuantity(1);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-stone-200 flex flex-col">
      <div className="p-4 flex-grow">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
             <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">{product.name}</h3>
            <p className="text-sm text-stone-500 mt-1">Stock: {product.stock}</p>
          </div>
        </div>
        <p className="text-2xl text-green-600 font-bold my-4">₹{product.price.toFixed(2)}</p>
      </div>

      <div className="mt-auto p-4 border-t border-stone-200 bg-stone-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            min="1"
            max={product.stock}
            disabled={isSubmitting}
          />
          <button
            onClick={handleBuyClick}
            className="w-full h-10 flex justify-center items-center px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
            disabled={product.stock < 1 || isSubmitting}
          >
            {isSubmitting ? <Spinner size={20} color="#FFF" /> : (product.stock > 0 ? 'Buy Now' : 'Out of Stock')}
          </button>
        </div>
      </div>
    </div>
  );
}