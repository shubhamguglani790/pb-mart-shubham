import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3003/categories', {
          params: { limit: 300 },
        });
        setCategories(response.data.categories || []);

      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-7 py-7 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-6">Categories You May Like</h2>

      {/* Loading */}
      {loading && (
        <div className="text-center">
          <p>Loading categories...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-6 rounded">
          {error}
        </div>
      )}

      {/* No Categories */}
      {!loading && !error && categories.length === 0 && (
        <p className="text-center">No categories available.</p>
      )}

      {/* Categories Grid */}
      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center text-center shadow-2xl hover:shadow-md transition duration-100"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-28 object-contain mb-4"
                onError={(e) => (e.target.src = '/placeholder.jpg')}
              />
              <div className="mb- w-full min-h-11">
                <p className="font-medium text-sm">{category.name}</p>
              </div>
              <div className="w-full">
                <button className="bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium py-2 px-4 rounded">
                  Get Quotes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
