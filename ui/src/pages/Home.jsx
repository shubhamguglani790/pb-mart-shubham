import React from 'react';
import bannerImage from '../assets/images/homebanner.png';
import Categories from './Categories'; // Import the Categories component
import ProductList from './ProductList';

const HomePage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Banner Section */}
      <div className="flex justify-center mb-8">
        <div className="w-11/12 sm:w-4/5 lg:w-2/3 rounded-lg overflow-hidden shadow-md mt-6">
          <img
            src={bannerImage}
            alt="Banner"
            className="w-full h-auto object-cover rounded-lg"
          />
        </div>
      </div>

      {/* Categories Section */}
      <Categories /> {/* Use the Categories component here */}
      <ProductList/>
    </div>
  );
};

export default HomePage;
