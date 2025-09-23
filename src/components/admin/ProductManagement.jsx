// src/components/admin/ProductManagement.jsx
'use client';

import { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/services/localStorageService';
import ProductModal from '@/components/ProductModal';
import { ThreeDots } from 'react-loader-spinner';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a network delay for a better UX with the spinner
    setTimeout(() => {
      setProducts(getProducts());
      setIsLoading(false);
    }, 700); 
  }, []);

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      const updatedProducts = updateProduct(editingProduct.id, productData);
      setProducts(updatedProducts);
    } else {
      const updatedProducts = addProduct(productData);
      setProducts(updatedProducts);
    }
    handleCloseModal();
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = deleteProduct(productId);
      setProducts(updatedProducts);
    }
  };


  return (
    <>
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
        />
      )}
      <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Product Management</h2>
          {/* Ensured button color consistency */}
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add New Product
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ThreeDots color="#166534" height={80} width={80} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                {/* Updated table header style */}
                <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold">Price</th>
                  <th className="p-3 font-semibold">Stock</th>
                  <th className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-stone-200 hover:bg-stone-50">
                    <td className="p-3 text-gray-800">{product.name}</td>
                    <td className="p-3 text-gray-800">₹{product.price.toFixed(2)}</td>
                    <td className="p-3 text-gray-800">{product.stock}</td>
                    <td className="p-3">
                      {/* Updated action link colors */}
                      <button onClick={() => handleOpenModal(product)} className="font-medium text-teal-600 hover:text-teal-800 mr-4">Edit</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="font-medium text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}