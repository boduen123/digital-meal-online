import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  FaSearch, FaFilter, FaDownload, FaArrowUp, FaArrowDown,
  FaCheckCircle, FaTimesCircle, FaClock, FaSpinner, FaExchangeAlt,
  FaMoneyBillWave, FaCreditCard, FaHashtag, FaCalendarAlt
} from 'react-icons/fa';

// Axios instance configuration
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TransactionsTable = ({ isAdminView = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Use admin endpoint if isAdminView prop is true, otherwise use generic user endpoint
      const endpoint = isAdminView ? '/admin/transactions' : '/transactions';
      const response = await api.get(endpoint);
      setTransactions(response.data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      (tx.reference_id && tx.reference_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.method && tx.method.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.username && tx.username.toLowerCase().includes(searchTerm.toLowerCase())); // For admin view

    const matchesType = typeFilter === 'All' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Helper for formatting currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(amount);
  };

  // Helper for formatting date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"><FaCheckCircle /> Completed</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><FaTimesCircle /> Failed</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200"><FaClock /> Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Helper for type icons and styling
  const getTypeConfig = (type) => {
    switch (type) {
      case 'topup':
        return { icon: <FaArrowUp />, color: 'text-green-600', bg: 'bg-green-100', label: 'Top Up' };
      case 'subscription_payment':
        return { icon: <FaArrowDown />, color: 'text-red-600', bg: 'bg-red-100', label: 'Subscription' };
      case 'transfer':
        return { icon: <FaExchangeAlt />, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Transfer' };
      default:
        return { icon: <FaMoneyBillWave />, color: 'text-gray-600', bg: 'bg-gray-100', label: type };
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 text-sm mt-1">View and manage your financial history</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <FaDownload className="text-sm" />
            <span className="text-sm font-medium">Export CSV</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reference, method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap flex items-center gap-1"><FaFilter /> Type:</span>
              {['All', 'topup', 'subscription_payment', 'transfer'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                    typeFilter === type
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap flex items-center gap-1"><FaCheckCircle /> Status:</span>
              {['All', 'completed', 'pending', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
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
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => {
                      const typeConfig = getTypeConfig(tx.type);
                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <FaHashtag className="text-gray-300 text-xs" />
                              <span className="font-mono text-sm text-gray-600">{tx.reference_id || `#${tx.id}`}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bg} ${typeConfig.color}`}>
                                {typeConfig.icon}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{typeConfig.label}</span>
                            </div>
                          </td>
                          <td className={`p-4 text-sm font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-gray-900'}`}>
                            {tx.type === 'topup' ? '+' : '-'}{formatAmount(tx.amount)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 capitalize">
                              <FaCreditCard className="text-gray-400" />
                              {tx.method || 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(tx.status)}
                          </td>
                          <td className="p-4 text-sm text-gray-500 flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-300" />
                            {formatDate(tx.created_at)}
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">No transactions found.</td>
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

export default TransactionsTable;