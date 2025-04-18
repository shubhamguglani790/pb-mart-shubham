import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaStore, FaQuestionCircle, FaComments, FaUser, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const [location, setLocation] = useState('All India');
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showSignInMenu, setShowSignInMenu] = useState(false);
    const signInRef = useRef();

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Search for:', searchQuery);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (signInRef.current && !signInRef.current.contains(e.target)) {
                setShowSignInMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-green-800 text-white p-2 shadow-md relative z-50">
            <div className="flex items-center justify-between flex-wrap md:flex-nowrap">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold flex items-center space-x-1 p-2">
                    <span className="text-red-500">PB</span><span>-Mart</span>
                </Link>

                {/* Hamburger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-white md:hidden text-2xl p-2 focus:outline-none"
                >
                    {isOpen ? <FaTimes /> : <FaBars />}
                </button>

                {/* Search + Action */}
                <div className="hidden md:flex flex-wrap md:flex-nowrap items-center w-full md:w-auto md:ml-4 space-y-2 md:space-y-0 md:space-x-2 mt-2 md:mt-0">
                    <div className="flex items-center space-x-2">
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="p-2 bg-white text-gray-800 rounded focus:outline-none"
                        >
                            <option>All India</option>
                            <option>Delhi</option>
                            <option>Mumbai</option>
                            <option>Bangalore</option>
                        </select>
                        <button className="bg-white text-indigo-800 p-2 rounded hover:bg-gray-200 transition-colors whitespace-nowrap">
                            Get Best Price
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-1 items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter product / service to search"
                            className="p-2 w-full text-gray-800 rounded-l focus:outline-none bg-white"
                        />
                        <button
                            type="submit"
                            className="bg-teal-500 text-white p-2 rounded-r hover:bg-teal-600 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Icons */}
                <div className={`w-full md:w-auto ${isOpen ? 'block' : 'hidden'} md:flex items-center space-x-4 mt-2 md:mt-0 ml-auto`}>
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0 items-start md:items-center p-2 md:p-0">
                        <Link to="/shopping" className="hover:text-gray-300 flex items-center">
                            <FaShoppingCart className="mr-1" /> Shopping
                        </Link>
                        <Link to="/sell" className="hover:text-gray-300 flex items-center">
                            <FaStore className="mr-1" /> Sell
                        </Link>
                        <Link to="/help" className="hover:text-gray-300 flex items-center">
                            <FaQuestionCircle className="mr-1" /> Help
                        </Link>
                        <Link to="/messages" className="hover:text-gray-300 flex items-center">
                            <FaComments className="mr-1" /> Messages
                        </Link>

                        {/* Sign In Dropdown */}
                        <div className="relative" ref={signInRef}>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowSignInMenu(prev => !prev);
                                }}
                                target="_top"
                                rel="nofollow"
                                id="user_sign_in"
                                className="rmv cpo ico-usr Hd_dib text-white hover:text-gray-300 cursor-pointer flex items-center"
                            >
                                <span className="Hd_pr flex items-center">
                                    <FaUser className="mr-1" />
                                    Sign In
                                </span>
                            </a>

                            {showSignInMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded shadow-lg z-50">
                                    <div className="p-4 border-b text-center">
                                        <button className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded w-full">Sign In</button>
                                        <p className="text-sm mt-2">
                                            New to PB-Mart? <Link to="/register" className="text-blue-600 hover:underline">Join Now</Link>
                                        </p>
                                    </div>
                                    <ul className="text-sm divide-y">
                                        <li><Link to="/" className="block px-4 py-2 hover:bg-gray-100">🏠 Home</Link></li>
                                        <li><Link to="/post-requirement" className="block px-4 py-2 hover:bg-gray-100">📝 Post Your Requirement</Link></li>
                                        <li><Link to="/verified-buyer" className="block px-4 py-2 hover:bg-gray-100">✅ Verified Business Buyer</Link></li>
                                        <li><Link to="/directory" className="block px-4 py-2 hover:bg-gray-100">📂 Products/Services Directory</Link></li>
                                        <li><Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">🧾 My Orders</Link></li>
                                        <li><Link to="/recent" className="block px-4 py-2 hover:bg-gray-100">🕒 Recent Activity</Link></li>
                                        <li>
                                            <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100 flex justify-between items-center">
                                                ⚙️ Settings <span className="bg-yellow-300 text-xs text-black px-1 py-0.5 rounded">NEW</span>
                                            </Link>
                                        </li>
                                    </ul>
                                    <div className="p-2 text-xs border-t">
                                        <p className="mb-1">🚚 Ship With PB-Mart</p>
                                        <p className="text-gray-500">Easy booking of transport</p>
                                        <Link to="/download-app" className="block mt-2 text-blue-600 hover:underline">📱 Download App</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
