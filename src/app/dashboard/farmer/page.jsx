'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getProducts, createSale } from '@/services/apiService';
import DashboardHeader from '@/components/DashboardHeader';
import toast from 'react-hot-toast';
import { ThreeDots } from 'react-loader-spinner';

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetches all products available in the system
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

  // This function now creates a transaction
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
      // THE KEY CHANGE:
      // We create a transaction where the Farmer is the buyer
      // and their assigned Dealer (upline) is the seller.
      await createSale({ 
        buyerId: user.id,
        sellerId: user.uplineId, 
        productId, 
        quantity: parseInt(quantity) 
      });
      toast.success('Purchase successful!');
      fetchProducts(); // Re-fetch to show updated stock (if any)
      return true;
    } catch (error) {
      console.error("Purchase failed:", error);
      // The apiService already shows a toast on failure
      return false;
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-50">
        <ThreeDots color="#166534" height={100} width={100} />
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

// Updated ProductCard component
function ProductCard({ product, onPurchase }) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuyClick = async () => {
    setIsSubmitting(true);
    const success = await onPurchase(product.id, quantity);
    if (success) {
      setQuantity(1); // Reset quantity only on successful purchase
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
             {/* Note: This shows total system stock, not the dealer's specific stock.
                 The backend will prevent a sale if the dealer is out of stock. */}
          </div>
        </div>
        {/* THE KEY CHANGE: Displaying the correct farmerPrice */}
        <p className="text-2xl text-green-600 font-bold my-4">₹{product.farmerPrice.toFixed(2)}</p>
      </div>

      <div className="mt-auto p-4 border-t border-stone-200 bg-stone-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 p-2 border border-gray-300 rounded-md"
            min="1"
            disabled={isSubmitting}
          />
          <button
            onClick={handleBuyClick}
            className="w-full h-10 flex justify-center items-center px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? <ThreeDots color="#FFF" height={20} width={40} /> : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
