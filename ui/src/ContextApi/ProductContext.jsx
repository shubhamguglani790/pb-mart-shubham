import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-all-categories`);
      // Ensure the response data is an array, or extract the array if nested
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set to empty array on error to avoid undefined
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-allproducts`);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Set to empty array on error
    }
  };

  const registerUser = async (userData) => {
    try {
      const response = await axios.post(`${apiUrl}/register-user`, userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const loginUser = async (credentials) => {
    try {
      const response = await axios.post(`${apiUrl}/login-user`, credentials);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ categories, products, cart, user, addToCart, registerUser, loginUser }}>
      {children}
    </ProductContext.Provider>
  );
};