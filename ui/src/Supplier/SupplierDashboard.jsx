import React, { useContext } from 'react';
import { ProductContext } from '../ContextApi/ProductContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const SupplierDashboard = () => {
  const { products } = useContext(ProductContext);

  const addProduct = async (productData) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/add-product`, productData);
      // Refresh products (implement as needed)
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Supplier Dashboard</h2>
        <button
          onClick={() => addProduct({ name: 'New Product', price: 100 })}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
        >
          Add Product
        </button>
        <div className="mt-4">
          {products.map(product => (
            <div key={product.id} className="border p-2 mb-2">{product.name}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;