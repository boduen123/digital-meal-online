import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBell, FaSearch, FaUtensils, FaWallet, FaUsers, FaMoneyBill, FaBuilding,
  FaChartLine, FaClipboardList, FaCog, FaSignOutAlt, FaCheck, FaTimes,
  FaEye, FaCalendar, FaClock, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaStar, FaEdit, FaCamera, FaPlus, FaMinus, FaFilter, FaDownload,
  FaChevronRight, FaChevronDown, FaCheckCircle, FaExclamationTriangle,
  FaSpinner, FaUserCircle, FaStore, FaReceipt, FaHistory, FaLock,
  FaUnlock, FaKey, FaBars, FaHome, FaRunning, FaChartBar, FaFileContract, FaChartPie
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ==================== AXIOS CONFIG ====================
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== ANIMATION VARIANTS ====================
const pageMotion = {
  initial: { opacity: 0, y: 15, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.2 } },
};

const modalMotion = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const tapAnimation = { scale: 0.95 };

// ==================== HELPER FUNCTIONS ====================
const formatAmount = (amount) => {
  const n = Number(amount) || 0;
  return n.toLocaleString('en-US');
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// ==================== STAT CARD ====================
const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="text-xl text-white" />
    </div>
    <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </motion.div>
);

// ==================== RESTAURANT CARD (GRID VIEW) ====================
const RestaurantGridCard = ({ restaurant, onView }) => {
  const isOpen = restaurant.status === 'Approved';

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group cursor-pointer"
      onClick={() => onView(restaurant)}
    >
      <div className="relative h-36">
        <img src={restaurant.logo_url || `https://picsum.photos/seed/${restaurant.id}/400`} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
          Partner
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <p className="text-white font-bold text-lg truncate">{restaurant.name}</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-2">{restaurant.category}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <FaMapMarkerAlt className="text-gray-400" />
          <span>{restaurant.location_sector}, {restaurant.location_district}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== RESTAURANT PROFILE MODAL ====================
const RestaurantProfileModal = ({ restaurant, onClose }) => {
  if (!restaurant) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalMotion} initial="initial" animate="animate" exit="exit"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="relative h-48">
          <img src={restaurant.logo_url || `https://picsum.photos/seed/${restaurant.id}/400`} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <h2 className="absolute bottom-4 left-5 text-3xl font-bold text-white">{restaurant.name}</h2>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-gray-600">{restaurant.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Owner</p>
              <p className="font-medium text-gray-800">{restaurant.owner_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Category</p>
              <p className="font-medium text-gray-800">{restaurant.category}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-gray-800">{`${restaurant.location_sector}, ${restaurant.location_district}`}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Partner Since</p>
              <p className="font-medium text-gray-800">{formatDate(restaurant.created_at)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
              <p className="text-xs text-gray-500">Contact</p>
              <p className="font-medium text-gray-800">{restaurant.contact_email} / {restaurant.contact_phone}</p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <motion.button whileTap={tapAnimation} onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium">
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== EDIT RESTAURANT MODAL ====================
const EditRestaurantModal = ({ restaurant, onClose, onSave }) => {
  const [formData, setFormData] = useState(restaurant);

  useEffect(() => {
    setFormData(restaurant);
  }, [restaurant]);

  if (!restaurant) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData.id, formData);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalMotion} initial="initial" animate="animate" exit="exit"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit {restaurant.name}</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Restaurant Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Campus</label>
                <input type="text" name="campus" value={formData.campus} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1" rows="3"></textarea>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1" />
              </div>
            </div>
            {/* Add more fields here as needed */}
          </div>
          <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 gap-3">
            <motion.button whileTap={tapAnimation} onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">
              Cancel
            </motion.button>
            <motion.button whileTap={tapAnimation} onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Save Changes
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== APPLICATION FORM ====================
const RestaurantApplicationForm = ({ onApply }) => {
  const [formData, setFormData] = useState({
    username: '', email: '', phone: '',
    password: '', confirmPassword: '',
    // These fields are for the user account. Restaurant details are managed after creation.
    // The backend will create a basic restaurant profile.
    role: 'restaurant',
    terms: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('location.')) {
      const locField = name.split('.')[1];
      setFormData(prev => ({ ...prev, location: { ...prev.location, [locField]: value } }));    } else {      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.terms) {
      alert('You must agree to the terms and conditions.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }
    onApply(formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div {...pageMotion} className="text-center max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created Successfully!</h2>
        <p className="text-gray-600 mb-6">The new restaurant account has been created and is now active.</p>
        <motion.button whileTap={tapAnimation} onClick={() => setSubmitted(false)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">
          Create Another Account
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageMotion} className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Restaurant Account</h1>
      <p className="text-gray-500 mb-8">Fill out the form below to manually register a new restaurant partner.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Restaurant Name</label>
            <input type="text" name="username" placeholder="This will be the restaurant name and login username" onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Contact Email</label>
            <input type="email" name="email" placeholder="Owner's contact email" onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Contact Phone</label>
            <input type="tel" name="phone" onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="terms" name="terms" checked={formData.terms} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I agree to the <a href="#" className="font-medium text-blue-600 hover:underline">Terms and Conditions</a>
          </label>
        </div>
        <motion.button whileTap={tapAnimation} type="submit" className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg">
          Create Account
        </motion.button>
      </form>
    </motion.div>
  );
};

// ==================== PARTNERSHIP DASHBOARD ====================
const PartnershipDashboard = ({ restaurants, onNavigate }) => {
  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.status === 'Approved').length,
    pending: restaurants.filter(r => r.status === 'Pending').length,
    suspended: restaurants.filter(r => r.status === 'Suspended').length,
  };

  const categoryDistribution = restaurants.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const topRestaurants = [...restaurants]
    .filter(r => r.status === 'Approved')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating instead of mock revenue
    .slice(0, 3);

  const PlaceholderContent = ({ title }) => (
    <motion.div {...pageMotion} className="flex flex-col items-center justify-center h-full text-center bg-white p-8 rounded-2xl shadow-lg">
      <FaChartPie className="text-6xl text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
      <p className="text-gray-500 mt-2">
        This section is under construction.
      </p>
      <p className="text-gray-500">
        Functionality for {title.toLowerCase()} will be implemented here.
      </p>
    </motion.div>
  );

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Partnership Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FaBuilding} label="Total Restaurants" value={stats.total} color="bg-blue-500" />
        <StatCard icon={FaCheckCircle} label="Active Partners" value={stats.active} color="bg-green-500" />
        <StatCard icon={FaClock} label="Pending Requests" value={stats.pending} color="bg-yellow-500" />
        <StatCard icon={FaTimes} label="Suspended Partners" value={stats.suspended} color="bg-red-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Applications</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.slice(0, 5).map(r => (
                  <tr key={r.id} className="border-b border-gray-200">
                    <td className="p-3 font-medium text-gray-800">{r.name}</td>
                    <td className="p-3 text-gray-600">{r.owner_name || 'N/A'}</td>
                    <td className="p-3 text-gray-600">{formatDate(r.created_at)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        r.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        r.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top Performing Restaurants (by Revenue)</h2>
          <div className="space-y-4">
            {topRestaurants.map((r, index) => (
              <div key={r.id} className="flex items-center gap-4">
                <span className="font-bold text-lg text-gray-400 w-4">{index + 1}</span>
                <img src={r.logo} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{formatAmount(r.revenue)} RWF</p>
                  <p className="text-xs text-gray-500">Total Sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Category Distribution</h2>
          <div className="space-y-3 flex-1">
            {Object.entries(categoryDistribution).map(([category, count]) => (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{category}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== MANAGE RESTAURANTS PAGE ====================
const ManageRestaurantsPage = ({ restaurants, onUpdateStatus, onViewDetails, onEdit }) => {
  const [filter, setFilter] = useState('All');

  const filteredRestaurants = restaurants.filter(r => filter === 'All' || r.status === filter);

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Manage Partner Restaurants</h1>
      <div className="flex gap-2">
        {['All', 'Pending', 'Approved', 'Rejected', 'Suspended'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="p-3">Logo</th>
                <th className="p-3 text-left">Restaurant Name</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.map(r => (
                <tr key={r.id} className="border-b border-gray-200">
                  <td className="p-3">
                    <img src={r.logo_url || `https://picsum.photos/seed/${r.id}/200`} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
                  </td>
                  <td className="p-3 font-medium text-gray-800">{r.name}</td>
                  <td className="p-3 text-gray-600">{r.owner_name || 'N/A'}</td>
                  <td className="p-3 text-gray-600">{r.location_district}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      r.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      r.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'Suspended' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <motion.button whileTap={tapAnimation} onClick={() => onViewDetails(r)} className="p-2 rounded-full hover:bg-gray-100"><FaEye className="text-gray-500" /></motion.button>
                      <motion.button whileTap={tapAnimation} onClick={() => onEdit(r)} className="p-2 rounded-full hover:bg-gray-100"><FaEdit className="text-gray-500" /></motion.button>
                      {r.status === 'Pending' && (
                        <>
                          <motion.button whileTap={tapAnimation} onClick={() => onUpdateStatus(r.id, 'Approved')} className="p-2 rounded-full hover:bg-green-100"><FaCheck className="text-green-500" /></motion.button>
                          <motion.button whileTap={tapAnimation} onClick={() => onUpdateStatus(r.id, 'Rejected')} className="p-2 rounded-full hover:bg-red-100"><FaTimes className="text-red-500" /></motion.button>
                        </>
                      )}
                      {r.status === 'Approved' && (
                        <motion.button whileTap={tapAnimation} onClick={() => onUpdateStatus(r.id, 'Suspended')} className="p-2 rounded-full hover:bg-orange-100"><FaLock className="text-orange-500" /></motion.button>
                      )}
                       {r.status === 'Suspended' && (
                        <motion.button whileTap={tapAnimation} onClick={() => onUpdateStatus(r.id, 'Approved')} className="p-2 rounded-full hover:bg-green-100"><FaUnlock className="text-green-500" /></motion.button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== BROWSE RESTAURANTS PAGE ====================
const BrowseRestaurantsPage = ({ restaurants, onApply }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const approvedRestaurants = restaurants.filter(r => r.status === 'Approved');

  const filteredRestaurants = useMemo(() => 
    approvedRestaurants.filter(r => 
      r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.category.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), 
  [approvedRestaurants, debouncedSearch]);

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Partner Restaurants</h1>
        <p className="text-gray-500 mt-2">Browse our network of approved restaurants.</p>
      </div>
      <div className="flex justify-center gap-4">
        <div className="relative w-full max-w-lg">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRestaurants.map(r => (
          <RestaurantGridCard key={r.id} restaurant={r} onView={setSelectedRestaurant} />
        ))}
      </div>
      <AnimatePresence>
        {selectedRestaurant && (
          <RestaurantProfileModal restaurant={selectedRestaurant} onClose={() => setSelectedRestaurant(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== NOTIFICATION BELL ====================
const NotificationBell = ({ count, onOpen }) => (
  <motion.button
    whileTap={tapAnimation}
    onClick={onOpen}
    className="relative w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800"
  >
    <FaBell />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-white">
        {count}
      </span>
    )}
  </motion.button>
);

// ==================== TRANSACTION OVERSIGHT PAGE ====================
const TransactionOversightPage = ({ transactions, restaurants }) => {
  const [filter, setFilter] = useState({ restaurant: 'All', method: 'All' });

  const stats = useMemo(() => {
    const totalVolume = transactions.reduce((sum, t) => t.status === 'Completed' ? sum + t.amount : sum, 0);
    const subscriptionVolume = transactions.reduce((sum, t) => t.type === 'subscription_payment' && t.status === 'Completed' ? sum + t.amount : sum, 0);
    const failedCount = transactions.filter(t => t.status === 'Failed').length;
    return { totalVolume, subscriptionVolume, failedCount };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filter.restaurant === 'All' || t.restaurantId === filter.restaurant)
      .filter(t => filter.method === 'All' || t.paymentMethod === filter.method)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, filter]);

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Transaction Oversight</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={FaMoneyBill} label="Total Volume (Completed)" value={`${formatAmount(stats.totalVolume)} RWF`} color="bg-blue-500" />
        <StatCard icon={FaWallet} label="Subscription Volume" value={`${formatAmount(stats.subscriptionVolume)} RWF`} color="bg-green-500" />
        <StatCard icon={FaExclamationTriangle} label="Failed Transactions" value={stats.failedCount} color="bg-red-500" />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-800">All Transactions</h2>
          <div className="flex-grow" />
          {/* Filters */}
          <select 
            value={filter.restaurant}
            onChange={e => setFilter(prev => ({ ...prev, restaurant: e.target.value }))}
            className="p-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="All">All Restaurants</option>
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select 
            value={filter.method}
            onChange={e => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="p-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="All">All Methods</option>
            <option value="topup">Top-up</option>
            <option value="subscription_payment">Subscription</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="p-3 text-left">Transaction ID</th>
                <th className="p-3 text-left">Restaurant</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 50).map(t => ( // Show latest 50
                <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-gray-500">{t.id.split('-')[1]}</td>
                  <td className="p-3 font-medium text-gray-800">{t.username}</td>
                  <td className="p-3 text-gray-700">{formatAmount(t.amount)} RWF</td>
                  <td className="p-3 text-gray-600">{t.type}</td>
                  <td className="p-3 text-gray-600">{formatDate(t.created_at)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      t.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      t.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== LANDING PAGE ====================
const LandingPage = () => {
  // This component simulates a landing page that would be part of your main routing.
  // It uses hash-based navigation for this demonstration.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white p-6 rounded-full shadow-md inline-block mb-6">
          <FaUtensils className="text-blue-600 text-5xl" />
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Welcome to Igifu</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Your one-stop solution for connecting students with the best restaurants around campus.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.a
            href="#signup" // Use hash to navigate to signup
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg"
          >
            Get Started
          </motion.a>
          <motion.a
            href="#login" // Use hash to navigate to login
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg shadow-lg"
          >
            Login
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== ADMIN LOGIN PAGE (INTEGRATED) ====================
const AdminLoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, token } = response.data;

      if (user.role !== 'admin') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }
      onLogin(user, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <FaKey className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Super Admin Portal</h1>
          <p className="text-gray-400">Sign in to access the dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Username</label>
              <div className="relative">
                <FaUserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" className="w-full bg-gray-900/70 text-white rounded-xl px-4 py-3 pl-11 border border-gray-700 focus:border-purple-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-900/70 text-white rounded-xl px-4 py-3 pl-11 border border-gray-700 focus:border-purple-500 focus:outline-none" />
              </div>
            </div>
            {error && <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
            <motion.button whileTap={tapAnimation} type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50">
              {loading ? <><FaSpinner className="animate-spin" /> Signing in...</> : <><FaUnlock /> Sign In</>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== MAIN SUPER ADMIN PORTAL ====================
function SuperAdminPortal() {
  const [currentUser, setCurrentUser] = useState(null); // Manages login state
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [restaurants, setRestaurants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [restaurantsRes, transactionsRes] = await Promise.all([
        api.get('/admin/restaurants'),
        api.get('/admin/transactions')
      ]);
      setRestaurants(restaurantsRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast.error("Failed to fetch admin data. Please check your connection.");
      console.error("Data fetch error:", error);
    }
  }, []);

  useEffect(() => {
    // Check for an existing session when the component loads
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (user && token && user.role === 'admin') {
      setCurrentUser({ ...user, type: user.role });
      fetchAllData();
    }
  }, [fetchAllData]);

  const handleApplication = async (applicationData) => {
    try {
      await api.post('/auth/register', applicationData);
      toast.success('Restaurant account created successfully!');
      fetchAllData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/restaurants/${id}/status`, { status });
      toast.success(`Restaurant status updated to ${status}.`);
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const handleSaveRestaurantDetails = async (id, details) => {
    try {
      await api.put(`/admin/restaurants/${id}`, details);
      toast.success('Restaurant details saved!');
      fetchAllData(); // Refresh all data to ensure consistency
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save details.');
    }
  };

  const handleLogin = (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setCurrentUser({ ...user, type: user.role });
    fetchAllData();
  };

  const navigateToPage = (page) => {
    setActivePage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    navigate('/'); // Redirect to the main landing page
  };

  const pendingCount = useMemo(() => restaurants.filter(r => r.status === 'Pending').length, [restaurants]);

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome },
    { id: 'manage', label: 'Manage', icon: FaBuilding, badge: pendingCount },
    { id: 'menus', label: 'Menus & Pricing', icon: FaClipboardList },
    { id: 'transactions', label: 'Transactions', icon: FaReceipt },
    { id: 'users', label: 'Users & Cards', icon: FaUsers },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar },
    { id: 'apply', label: 'Create Account', icon: FaPlus },
    { id: 'browse', label: 'Public View', icon: FaEye },
  ];

  const PlaceholderContent = ({ title }) => (
    <motion.div {...pageMotion} className="flex flex-col items-center justify-center h-full text-center bg-white p-8 rounded-2xl shadow-lg">
      <FaChartPie className="text-6xl text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
      <p className="text-gray-500 mt-2">This section is under construction.</p>
      <p className="text-gray-500">Functionality for {title.toLowerCase()} will be implemented here.</p>
    </motion.div>
  );

  const renderAdminPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <PartnershipDashboard restaurants={restaurants} onNavigate={navigateToPage} />;
      case 'manage':
        return <ManageRestaurantsPage restaurants={restaurants} onUpdateStatus={handleUpdateStatus} onViewDetails={setSelectedRestaurant} onEdit={setEditingRestaurant} />;
      case 'apply':
        return <RestaurantApplicationForm onApply={handleApplication} />;
      case 'menus':
        return <PlaceholderContent title="Menus & Pricing" />;
      case 'browse':
        return <BrowseRestaurantsPage restaurants={restaurants} onApply={() => setActivePage('apply')} />;
      case 'transactions':
        return <TransactionOversightPage transactions={transactions} restaurants={restaurants} />;
      case 'users':
        return <PlaceholderContent title="User & Card Management" />;
      case 'analytics':
        return <PlaceholderContent title="Advanced Analytics" />;
      default:
        return <PartnershipDashboard restaurants={restaurants} onNavigate={navigateToPage} />;
    }
  };

  // If no user is logged in, show the admin login page.
  if (!currentUser) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  // If a non-admin user somehow gets here, show a placeholder.
  if (currentUser.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <PlaceholderContent title={`Welcome, ${currentUser.username}`} />
      </div>
    );
  }

  // Default view for Super Admin
  return (
    <div className="min-h-screen flex bg-gray-100" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Sidebar */}
      <Toaster position="top-center" />
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <FaStar className="text-white" />
          </div>
          <div>
            <h1 className="text-gray-800 font-bold">Super Admin</h1>
            <p className="text-xs text-gray-500">Partnerships</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {adminNavItems.map(item => (
            <motion.button
              key={item.id}
              whileTap={tapAnimation}
              onClick={() => navigateToPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
                activePage === item.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                  {item.badge}
                </span>
              )}
            </motion.button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-3">
            <FaUserCircle className="text-3xl text-gray-400" />
            <div>
              <p className="text-gray-800 font-medium">{currentUser.username}</p>
              <p className="text-xs text-gray-500">Super Administrator</p>
            </div>
          </div>
          <motion.button whileTap={tapAnimation} onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600">
            <FaSignOutAlt />
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-xl font-bold text-gray-800 capitalize">{activePage}</h1>
          <div className="flex items-center gap-3">
            <NotificationBell count={pendingCount} onOpen={() => setActivePage('manage')} />
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">
              <FaSignOutAlt size={20} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {renderAdminPage()}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedRestaurant && (
          <RestaurantProfileModal restaurant={selectedRestaurant} onClose={() => setSelectedRestaurant(null)} />
        )}
        {editingRestaurant && (
          <EditRestaurantModal 
            restaurant={editingRestaurant} 
            onClose={() => setEditingRestaurant(null)} 
            onSave={handleSaveRestaurantDetails} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default SuperAdminPortal;