import React, { useContext } from 'react';
import { ProductContext } from '../ContextApi/ProductContext';
import Navbar from '../components/Navbar';

const Checkout = () => {
  const { cart } = useContext(ProductContext);

  const handleCheckout = async () => {
    console.log('Checkout with cart:', cart);
    // Implement API call for checkout
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Checkout</h2>
        <div className="max-w-md">
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input type="text" className="w-full border p-2 rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input type="text" className="w-full border p-2 rounded" />
          </div>
          <button onClick={handleCheckout} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;