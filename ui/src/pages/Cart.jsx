import React, { useContext } from 'react';
import { ProductContext } from '../ContextApi/ProductContext';
import Navbar from '../components/Navbar';

const Cart = () => {
  const { cart } = useContext(ProductContext);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between border-b py-2">
                <span>{item.name}</span>
                <span>${item.price}</span>
              </div>
            ))}
            <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;