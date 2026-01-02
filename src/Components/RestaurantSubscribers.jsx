import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FaSearch, FaFilter, FaDownload, FaUser, FaPhone, 
  FaCreditCard, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaSpinner 
} from 'react-icons/fa';

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const RestaurantSubscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await api.get('/restaurant/subscribers');
      setSubscribers(response.data);
    } catch (error) {
      console.error("Failed to fetch subscribers", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.payment_phone?.includes(searchTerm) ||
      sub.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'Depleted': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your meal plan subscriptions</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <FaDownload className="text-sm" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {['All', 'Active', 'Expired', 'Depleted'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    statusFilter === status 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <FaSpinner className="animate-spin text-3xl text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider"># ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plates Usage</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price Paid</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Info</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map((sub) => (
                      <motion.tr 
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4 text-sm font-mono text-gray-500">#{sub.id}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {sub.student_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{sub.student_name}</div>
                              <div className="text-xs text-gray-500">{sub.student_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {sub.plan_name}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(sub.used_plates / sub.total_plates) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {sub.used_plates}/{sub.total_plates}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-900">
                          RWF {Number(sub.price_paid).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-700">
                              <FaCreditCard className="text-gray-400" />
                              <span className="capitalize">{sub.payment_method}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <FaPhone className="text-gray-400" />
                              <span>{sub.payment_phone || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(sub.expiry_date)}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500">No subscribers found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantSubscribers;