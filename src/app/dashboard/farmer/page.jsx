// src/app/dashboard/farmer/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getProducts, createSale } from '@/services/localStorageService';
import DashboardHeader from '@/components/DashboardHeader';
import toast from 'react-hot-toast';

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (user) {
      setProducts(getProducts());
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'Farmer') {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handlePurchase = (productId, quantity) => {
    if (!user || !user.upline) {
      toast.error("Error: Your account is not linked to a dealer.");
      return;
    }
    if (quantity < 1) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    createSale({ sellerId: user.upline, productId, quantity: parseInt(quantity) });
    setProducts(getProducts());
    toast.success('Purchase successful!');
  };

  if (!user) {
    return <p className="text-center mt-10">Loading...</p>;
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

// --- Redesigned ProductCard Component ---
function ProductCard({ product, onPurchase }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-stone-200 flex flex-col">
      {/* Product Info Section */}
      <div className="p-4 flex-grow">
        <div className="flex items-start gap-3">
          {/* A generic icon for agriculture products */}
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">{product.name}</h3>
            <p className="text-sm text-stone-500 mt-1">Stock: {product.stock}</p>
          </div>
        </div>
        <p className="text-2xl text-green-600 font-bold my-4">₹{product.price.toFixed(2)}</p>
      </div>

      {/* Action Section pushed to the bottom */}
      <div className="mt-auto p-4 border-t border-stone-200 bg-stone-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            min="1"
            max={product.stock}
          />
          <button
            onClick={() => onPurchase(product.id, quantity)}
            // Changed button color to be consistent
            className="flex-grow px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={product.stock < 1}
          >
            {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}