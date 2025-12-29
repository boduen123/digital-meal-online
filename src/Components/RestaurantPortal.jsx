import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBell, FaSearch, FaUtensils, FaWallet, FaUsers, FaMoneyBill, FaQrcode,
  FaChartLine, FaClipboardList, FaCog, FaSignOutAlt, FaCheck, FaTimes,
  FaEye, FaCalendar, FaClock, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaStar, FaEdit, FaCamera, FaPlus, FaMinus, FaFilter, FaDownload,
  FaChevronRight, FaChevronDown, FaCheckCircle, FaExclamationTriangle,
  FaSpinner, FaUserCircle, FaStore, FaReceipt, FaHistory, FaLock,
  FaUnlock, FaKey, FaBars, FaHome, FaRunning, FaChartBar, FaInfoCircle
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { tapAnimation } from "./Animations"; // Import tapAnimation from the new file
import MealPlanCard from "./MealPlanCard"; // Import MealPlanCard
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

// ==================== HELPER FUNCTIONS ====================
const formatAmount = (amount) => {
  const n = Number(amount) || 0;
  return n.toLocaleString('en-US');
};

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ==================== LOGIN SCREEN ====================
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, token } = response.data;

      if (user.role !== 'restaurant') {
        setError('Access denied. This portal is for restaurant owners only.');
        setLoading(false);
        return;
      }

      onLogin(user, token);

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <FaStore className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Restaurant Portal</h1>
          <p className="text-gray-500">Sign in to manage your restaurant</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Username or Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your restaurant username"
                  className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 pl-11 border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-2 block">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 pl-11 border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <motion.button
              whileTap={tapAnimation}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <FaUnlock /> Sign In
                </>
              )}
            </motion.button>
          </form>

        </div>
      </motion.div>
    </div>
  );
};

// ==================== STAT CARD ====================
const StatCard = ({ icon: Icon, label, value, subValue, color, trend }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="text-xl text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
    {subValue && <div className="text-xs text-gray-600 mt-1">{subValue}</div>}
  </motion.div>
);

// ==================== ORDER CARD ====================
const OrderCard = ({ order, onApprove, onReject, onServe }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    served: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const statusIcons = {
    pending: <FaClock className="text-yellow-400" />,
    approved: <FaCheckCircle className="text-green-400" />,
    rejected: <FaTimes className="text-red-400" />,
    served: <FaUtensils className="text-blue-400" />,
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <FaUserCircle className="text-xl text-gray-400" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">{order.student_name}</h4>
            <p className="text-xs text-gray-500">ID: {order.student_id}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[order.status]}`}>
          {statusIcons[order.status]}
          <span className="capitalize">{order.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 rounded-lg p-3">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{order.plates}</div>
          <div className="text-xs text-gray-500">Plates</div>
        </div>
        <div className="text-center border-x border-gray-200">
          <div className="text-sm font-medium text-gray-800">{formatTime(order.created_at)}</div>
          <div className="text-xs text-gray-500">Time</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-medium text-blue-600">{order.plan_name || 'N/A'}</div>
          <div className="text-xs text-gray-500">Plan</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>Order ID: {order.id}</span>
        <span>{formatDate(order.created_at)}</span>
      </div>

      {order.status === 'pending' && (
        <div className="flex gap-2">
          <motion.button
            whileTap={tapAnimation}
            onClick={() => onReject(order.id)}
            className="flex-1 py-2.5 bg-red-100 text-red-600 rounded-lg font-medium flex items-center justify-center gap-2 border border-red-200 hover:bg-red-200"
          >
            <FaTimes /> Reject
          </motion.button>
          <motion.button
            whileTap={tapAnimation}
            onClick={() => onApprove(order.id)}
            className="flex-[2] py-2.5 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700"
          >
            <FaCheck /> Approve
          </motion.button>
        </div>
      )}

      {order.status === 'approved' && (
        <motion.button
          whileTap={tapAnimation}
          onClick={() => onServe(order.id)}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <FaUtensils /> Mark as Served
        </motion.button>
      )}
    </motion.div>
  );
};

// ==================== SUBSCRIBER CARD ====================
const SubscriberCard = ({ subscriber, onViewDetails }) => {
  const remaining = subscriber.total_plates - subscriber.used_plates;
  const progress = (subscriber.used_plates / subscriber.total_plates) * 100;
  const isExpired = new Date(subscriber.expiry_date) < new Date();
  const isLow = remaining <= 5 && !isExpired;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
            {subscriber.student_name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-gray-800">{subscriber.student_name}</h4>
            <p className="text-xs text-gray-500">{subscriber.student_phone}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          isExpired ? 'bg-red-100 text-red-700' :
          isLow ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {isExpired ? 'Expired' : isLow ? 'Low' : 'Active'}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Plates Used</span>
          <span className="text-gray-800 font-medium">{subscriber.used_plates} / {subscriber.total_plates}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${progress >= 90 ? 'bg-red-500' : progress >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
        <div className="bg-gray-100 rounded-lg p-2">
          <span>Plan:</span>
          <span className="text-gray-800 ml-1 font-medium">{subscriber.plan_name}</span>
        </div>
        <div className="bg-gray-100 rounded-lg p-2">
          <span>Expires:</span>
          <span className={`ml-1 font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
            {formatDate(subscriber.expiry_date)}
          </span>
        </div>
      </div>

      <motion.button
        whileTap={tapAnimation}
        onClick={() => onViewDetails(subscriber)}
        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-200"
      >
        <FaEye /> View Details
      </motion.button>
    </motion.div>
  );
};

// ==================== DASHBOARD PAGE ====================
const DashboardPage = ({ restaurant, orders, subscribers, onApproveOrder, onRejectOrder, onServeOrder }) => {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayServed = orders.filter(o => o.status === 'served' && new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const activeSubscribers = subscribers.filter(s => new Date(s.expiry_date) > new Date());
  
  // Calculate approximate revenue for the month (simplified mock)
  const currentMonth = new Date().getMonth();
  const monthlyRevenue = subscribers.filter(s => new Date(s.start_date).getMonth() === currentMonth)
    .reduce((acc, s) => acc + (s.price_paid || 0), 0);

  return (
    <motion.div {...pageMotion} className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {restaurant.name}!</h1>
        <p className="text-blue-100">Here's what's happening with your restaurant today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={FaUtensils} 
          label="Meals Served Today" 
          value={todayServed}
          color="bg-blue-500"
          subValue={`${todayOrders.length} total orders`}
        />
        <StatCard 
          icon={FaClipboardList} 
          label="Pending Orders" 
          value={pendingOrders.length}
          color="bg-yellow-500"
          subValue="Needs immediate attention"
        />
        <StatCard 
          icon={FaUsers} 
          label="Active Subscribers" 
          value={activeSubscribers.length}
          color="bg-green-500"
          subValue={`of ${subscribers.length} total`}
        />
        <StatCard 
          icon={FaMoneyBill} 
          label="Revenue (Month)" 
          value={`RWF ${formatAmount(monthlyRevenue)}`}
          color="bg-purple-500"
          trend={8}
        />
      </div>

      {/* Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaClock className="text-yellow-400" />
              Pending Orders
              <span className="ml-2 px-2.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                {pendingOrders.length}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.slice(0, 6).map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onApprove={onApproveOrder}
                onReject={onRejectOrder}
                onServe={onServeOrder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FaHistory className="text-blue-400" />
          Recent Activity
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {orders.slice(0, 5).map((order, index) => (
            <div key={order.id} className={`flex items-center justify-between p-4 ${index !== 4 ? 'border-b border-gray-200' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaReceipt className="text-sm text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{order.student_name}</p>
                  <p className="text-xs text-gray-500">{order.plates} plates • {order.plan_name || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'approved' ? 'bg-green-100 text-green-700' :
                  order.status === 'served' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {order.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">{formatTime(order.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ==================== ORDERS PAGE ====================
const OrdersPage = ({ orders, onApproveOrder, onRejectOrder, onServeOrder }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    served: orders.filter(o => o.status === 'served').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full sm:w-64 bg-white text-gray-800 rounded-xl px-4 py-2.5 pl-10 border border-gray-300 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'served', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 px-1.5 py-0.5 bg-black/10 rounded-full text-xs">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onApprove={onApproveOrder}
              onReject={onRejectOrder}
              onServe={onServeOrder}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaClipboardList className="text-5xl text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">No orders found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      )}
    </motion.div>
  );
};

// ==================== SUBSCRIBERS PAGE ====================
const SubscribersPage = ({ subscribers, onUseMeal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);

  // This is a placeholder. In a real app, you'd have a proper way
  // to map a student to their meal plan. Here we just format it.
  const formatSubscriberToPlan = (sub) => ({
    ...sub,
    totalMeals: sub.total_plates,
    usedMeals: Array.from({length: sub.used_plates}, (_, i) => i), // Mocking used meals array
    canUsePlate: sub.used_plates < sub.total_plates && new Date(sub.expiry_date) > new Date(),
  });

  const filteredSubscribers = subscribers.filter(sub => {
    const isExpired = new Date(sub.expiry_date) < new Date();
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && !isExpired) ||
                         (filterStatus === 'expired' && isExpired);
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sub.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Subscribers</h1>
        
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscribers..."
            className="w-full sm:w-64 bg-white text-gray-800 rounded-xl px-4 py-2.5 pl-10 border border-gray-300 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'active', 'expired'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Subscribers Grid */}
      {filteredSubscribers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscribers.map(sub => (
            <MealPlanCard
              key={sub.id}
              plan={formatSubscriberToPlan(sub)}
              onUseMeal={(planId, mealIndex) => onUseMeal(sub.id, mealIndex)}
              onViewDetails={() => setSelectedSubscriber(sub)}
              // onShare is not needed for the portal, but kept for MealPlanCard compatibility
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaUsers className="text-5xl text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">No subscribers found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Subscriber Details Modal */}
      <AnimatePresence>
        {selectedSubscriber && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedSubscriber(null)}
          >
            <motion.div
              variants={modalMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl p-6 border border-gray-200 shadow-xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                    {selectedSubscriber.student_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedSubscriber.student_name}</h3>
                    <p className="text-sm text-gray-500">{selectedSubscriber.id}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={tapAnimation}
                  onClick={() => setSelectedSubscriber(null)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800"
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <FaPhone className="text-blue-400 mb-2" />
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-gray-800 font-medium">{selectedSubscriber.student_phone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <FaEnvelope className="text-green-400 mb-2" />
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-800 font-medium text-sm truncate">{selectedSubscriber.student_email}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Subscription Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan</span>
                      <span className="text-gray-800 font-medium">{selectedSubscriber.plan_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plates Used</span>
                      <span className="text-gray-800 font-medium">{selectedSubscriber.used_plates} / {selectedSubscriber.total_plates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining</span>
                      <span className="text-green-400 font-medium">{selectedSubscriber.total_plates - selectedSubscriber.used_plates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date</span>
                      <span className="text-gray-800 font-medium">{formatDate(selectedSubscriber.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiry Date</span>
                      <span className={`font-medium ${new Date(selectedSubscriber.expiry_date) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                        {formatDate(selectedSubscriber.expiry_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(selectedSubscriber.used_plates / selectedSubscriber.total_plates) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== MEAL USAGE PAGE ====================
const MealUsagePage = ({ subscribers, onUseMeal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundSubscriber, setFoundSubscriber] = useState(null);
  const [error, setError] = useState('');
  const [mealUsed, setMealUsed] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setFoundSubscriber(null);
    if (!searchQuery) {
      setError('Please enter a student ID or phone number.');
      return;
    }

    try {
      // Use the backend search endpoint
      const response = await api.post('/restaurant/subscribers/search', { searchQuery });
      const subscriber = response.data;

      // Perform frontend validation based on the fetched subscriber data
      if (new Date(subscriber.expiry_date) < new Date()) {
        setError(`Subscription for ${subscriber.student_name} expired on ${formatDate(subscriber.expiry_date)}.`);
        setFoundSubscriber(null); // Clear previous result
        return;
      }
      if (subscriber.used_plates >= subscriber.total_plates) {
        setError(`Subscription for ${subscriber.student_name} has no plates remaining.`);
        setFoundSubscriber(null); // Clear previous result
        return;
      }

      setFoundSubscriber(subscriber);
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || 'Error searching for subscriber.');
      setFoundSubscriber(null); // Clear previous result on error
    }
  };

  const handleUseMealClick = async (subscriptionId, mealIndex) => { // mealIndex is received from MealPlanCard but not used for backend call
    // Call the parent's onUseMeal, which will trigger the API call
    // The parent's onUseMeal should handle the actual backend interaction
    // and then refetch data.
    await onUseMeal(subscriptionId); // Pass the subscription ID to the parent handler
    setMealUsed(true);
    // Update the local state to show immediate feedback
    setFoundSubscriber(prev => {
      if (!prev) return null; // Should not happen if foundSubscriber is set
      return { ...prev, used_plates: prev.used_plates + 1 }; // Optimistic update
    });
    setTimeout(() => {
      setMealUsed(false);
      // Clear search result after successful usage
      setFoundSubscriber(null);
      setSearchQuery('');
    }, 1500); // Reset animation state
  };

  const formatSubscriberToPlan = (sub) => ({
    ...sub,
    totalMeals: sub.total_plates,
    usedMeals: Array.from({length: sub.used_plates}, (_, i) => i), // Mocking used meals array for display
    canUsePlate: sub.used_plates < sub.total_plates && new Date(sub.expiry_date) > new Date(), // Pass status check
  });

  return (
    <motion.div {...pageMotion} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Meal Usage Panel</h1>
        <p className="text-gray-500">Quickly find a student and record their meal usage.</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Student ID or Phone..."
            className="w-full bg-white text-gray-800 rounded-xl px-4 py-3 pl-11 border border-gray-300 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <motion.button
          whileTap={tapAnimation}
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <FaRunning /> Find
        </motion.button>
      </form>

      {/* Result */}
      <AnimatePresence>
        {error && <motion.p {...pageMotion} className="text-red-600 text-center bg-red-100 p-3 rounded-xl border border-red-200">{error}</motion.p>}
        
        {foundSubscriber && (
          <motion.div {...pageMotion} className="relative">
            <AnimatePresence>
              {mealUsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2, transition: { duration: 0.4, ease: 'backOut' } }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  <FaCheckCircle className="text-8xl text-green-500 bg-green-100/50 rounded-full p-2 backdrop-blur-sm" />
                </motion.div>
              )}
            </AnimatePresence> 
            <MealPlanCard plan={formatSubscriberToPlan(foundSubscriber)} onUseMeal={handleUseMealClick} showUseButton={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// ==================== MEAL PLAN MANAGEMENT COMPONENTS (NEW) ====================
// ==================== PLAN MODAL (for Adding/Editing) ====================
const PlanModal = ({ plan, onClose, onSave }) => {
  const [name, setName] = useState(plan?.name || '');
  const [type, setType] = useState(plan?.type || 'Month');
  const [plates, setPlates] = useState(plan?.total_plates || 60);
  const [price, setPrice] = useState(plan?.price || 30000);
  const [duration, setDuration] = useState(plan?.duration_days || 30);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: plan?.id,
      name,
      type,
      total_plates: Number(plates),
      price: Number(price),
      duration_days: Number(duration),
      is_active: plan ? plan.is_active : true,
    });
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalMotion}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl p-6 border border-gray-200 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">{plan ? 'Edit Meal Plan' : 'New Meal Plan'}</h3>
          <motion.button
            whileTap={tapAnimation}
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800"
          >
            <FaTimes />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Plan Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Plan Type (Tier)</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none appearance-none"
              >
                <option>Month</option>
                <option>Half-month</option>
                <option>Weekly</option>
                <option>Trial</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Plates Included</label>
              <input
                type="number"
                value={plates}
                onChange={(e) => setPlates(e.target.value)}
                required
                min="1"
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Price (RWF)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Duration (Days)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                min="1"
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          
          <motion.button
            whileTap={tapAnimation}
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
          >
            <FaCheck /> {plan ? 'Save Changes' : 'Create Plan'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
};

// ==================== MEAL PLAN CARD (Reusable) ====================
const PlanManagementCard = ({ plan, onToggleActive, onEdit }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-xl p-5 border ${plan.is_active ? 'border-green-200' : 'border-red-200'} space-y-3 shadow-sm`}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold text-gray-800 truncate">{plan.name}</h3>
      <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
        plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {plan.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>

    <p className="text-3xl font-extrabold text-blue-600">
      RWF {formatAmount(plan.price)}
    </p>

    <div className="grid grid-cols-2 gap-3 text-sm border-t border-b border-gray-200 py-3">
      <div className="flex items-center gap-2">
        <FaUtensils className="text-gray-400" />
        <span className="text-gray-600">{plan.total_plates} Plates</span>
      </div>
      <div className="flex items-center gap-2">
        <FaCalendar className="text-gray-400" />
        <span className="text-gray-600">{plan.duration_days} Days</span>
      </div>
    </div>
    
    <div className="flex gap-2">
      <motion.button
        whileTap={tapAnimation}
        onClick={() => onEdit(plan)}
        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-200"
      >
        <FaEdit /> Edit
      </motion.button>
      <motion.button
        whileTap={tapAnimation}
        onClick={() => onToggleActive(plan)}
        className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-xs ${
          plan.is_active 
            ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200'
            : 'bg-green-100 text-green-600 border border-green-200 hover:bg-green-200'
        }`}
      >
        {plan.is_active ? <FaLock /> : <FaUnlock />}
        {plan.is_active ? 'Deactivate' : 'Activate'}
      </motion.button>
    </div>
  </motion.div>
);

// ==================== MEAL PLANS PAGE ====================
const MealPlansPage = ({ initialPlans, onUpdatePlans }) => {
  const [plans, setPlans] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  // Group plans by type for tabs, similar to DigitalMealCard
  const planTypes = useMemo(() => {
    const types = [...new Set(plans.map(p => p.type))];
    return types.length > 0 ? types : ['Month'];
  }, [plans]);

  const [activePlanType, setActivePlanType] = useState(planTypes[0] || 'Month');
  
  // Filter plans based on active tab
  const filteredPlans = plans.filter(p => p.type === activePlanType);

  const handleToggleActive = (planToToggle) => {
    const updatedPlan = { ...planToToggle, is_active: !planToToggle.is_active };
    onUpdatePlans(updatedPlan); // Let parent handle the API call and state update
  };
  
  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  // Ensure activePlanType is valid when plans change
  useEffect(() => {
    if (planTypes.length > 0 && !planTypes.includes(activePlanType)) {
      setActivePlanType(planTypes[0]);
    }
  }, [planTypes, activePlanType]);

  const handleSavePlan = (planData) => {
    // Pass the single plan object to the parent handler
    // The parent handles the API call (POST/PUT) and refreshing data
    onUpdatePlans(planData);
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Meal Plans Management</h1>
        
        <div className="flex items-center gap-3">
          {/* Plan Type Tabs - Moved to header to match dashboard style */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {planTypes.map(type => (
              <button
                key={type}
                onClick={() => setActivePlanType(type)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                  activePlanType === type
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={tapAnimation}
            onClick={() => { setIsModalOpen(true); setEditingPlan(null); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"
          >
            <FaPlus /> New Plan
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPlans.map(plan => (
          <PlanManagementCard 
            key={plan.id} 
            plan={plan} 
            onToggleActive={handleToggleActive}
            onEdit={openEditModal}
          />
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <PlanModal 
            plan={editingPlan} 
            onClose={() => { setIsModalOpen(false); setEditingPlan(null); }} 
            onSave={handleSavePlan} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// ==================== ANALYTICS PAGE (NEW) ====================
const AnalyticsPage = ({ orders }) => {
  const servedOrders = orders.filter(o => o.status === 'served');
  const todayServed = servedOrders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString()).length;
  const totalPlatesServed = servedOrders.reduce((acc, o) => acc + o.plates, 0);
  const totalRevenue = totalPlatesServed * 500; // Simplified Est.
  
  // Placeholder for simple visualization
  const dailyMealsData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    meals: Math.floor(Math.random() * 50) + 15
  }));

  // Mock calculation for most active student
  const studentMeals = orders.reduce((acc, order) => {
    acc[order.student_id] = (acc[order.student_id] || { count: 0, name: order.student_name })
    acc[order.student_id].count += order.plates;
    return acc;
  }, {});
  
  const mostActiveStudent = Object.values(studentMeals).sort((a, b) => b.count - a.count)[0] || { name: 'N/A', count: 0 };


  return (
    <motion.div {...pageMotion} className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Analytics & Performance</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={FaUtensils} 
          label="Total Plates Served" 
          value={totalPlatesServed}
          color="bg-blue-500"
        />
        <StatCard 
          icon={FaChartBar} 
          label="Meals Served Today" 
          value={todayServed}
          color="bg-purple-500"
          trend={3}
        />
        <StatCard 
          icon={FaUsers} 
          label="Most Active Student" 
          value={mostActiveStudent.name}
          color="bg-orange-500"
          subValue={`${mostActiveStudent.count} Plates Consumed`}
        />
        <StatCard 
          icon={FaMoneyBill} 
          label="Est. Lifetime Revenue" 
          value={`RWF ${formatAmount(totalRevenue)}`}
          color="bg-green-500"
          subValue="Based on served plates"
        />
      </div>

      {/* Meals Served Chart (Placeholder) */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Plates Served Last 7 Days</h2>
        <div className="flex items-end justify-around h-40 pt-4">
          {dailyMealsData.map((data) => (
            <div key={data.day} className="flex flex-col items-center h-full justify-end">
              <div 
                className="w-8 rounded-t-lg bg-orange-500 transition-all duration-300 hover:bg-red-500" 
                style={{ height: `${(data.meals / 65) * 100}%`, maxHeight: '100%' }}
              />
              <span className="text-xs text-gray-500 mt-1">{data.day}</span>
              <span className="text-xs text-gray-800 font-medium">{data.meals}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};


// ==================== SETTINGS PAGE ====================
const SettingsPage = ({ restaurant, onLogout, onUpdate }) => {
  // Initialize state with all available fields from the restaurant prop
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    phone: restaurant.phone || '', // This is often the login/owner phone
    contact_phone: restaurant.contact_phone || '', // Public contact phone
    description: restaurant.description || '',
    campus: restaurant.campus || '',
    location_sector: restaurant.location_sector || '',
    location_district: restaurant.location_district || '',
    category: restaurant.category || '',
    walk_time: restaurant.walk_time || '',
    logo_url: restaurant.logo_url || '',
    image_url: restaurant.image_url || '',
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, logo_url: previewUrl }));

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploading(true);
    try {
      const response = await api.post('/restaurant/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, logo_url: response.data.url }));
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
      // Keep the local preview if upload fails, but warn user
      toast.error("Upload failed. Using local preview.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Connect to backend to update profile
      const response = await api.put('/restaurant/profile', formData);
      
      setSaved(true);
      toast.success("Profile updated successfully!");
      
      // Update parent component state if callback provided
      if (onUpdate) {
        onUpdate();
      }

      // Update local storage to reflect changes immediately
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...formData }));
      }

      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Update failed", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div {...pageMotion} className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* Restaurant Profile */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Restaurant Profile</h2>
          {/* Display Status and Rating (Read Only) */}
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
              restaurant.status === 'Approved' ? 'bg-green-100 text-green-700' : 
              restaurant.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {restaurant.status || 'Pending'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 flex items-center gap-1">
              <FaStar className="text-yellow-400" /> {restaurant.rating || 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
            <img 
              src={formData.logo_url || formData.image_url || restaurant.image_url} 
              alt="Logo" 
              className="w-full h-full object-cover" 
              onError={(e) => {e.target.onerror = null; e.target.src="https://placehold.co/150?text=No+Img"}}
            />
          </div>
          <div className="flex-1">
             <label className="text-xs text-gray-500 mb-1 block">Logo Image</label>
             <div className="relative">
                <FaCamera className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-2 pl-10 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
             </div>
             {uploading && <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><FaSpinner className="animate-spin" /> Uploading...</p>}
          </div>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Restaurant Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Fast Food, Buffet"
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="h-px bg-gray-200 my-4" />
          <h3 className="text-sm font-bold text-gray-700">Location & Operations</h3>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Campus</label>
              <input
                type="text"
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
             <div>
              <label className="text-xs text-gray-500 mb-2 block">Est. Walk Time</label>
              <input
                type="text"
                name="walk_time"
                value={formData.walk_time}
                onChange={handleChange}
                placeholder="e.g. 5-10 min"
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Sector</label>
              <input
                type="text"
                name="location_sector"
                value={formData.location_sector}
                onChange={handleChange}
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">District</label>
              <input
                type="text"
                name="location_district"
                value={formData.location_district}
                onChange={handleChange}
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="h-px bg-gray-200 my-4" />
          <h3 className="text-sm font-bold text-gray-700">Contact Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Owner Phone (Login)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Public Contact Phone</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="+250..."
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

           <div>
              <label className="text-xs text-gray-500 mb-2 block">Cover Image URL</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full bg-gray-100 text-gray-800 rounded-xl px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

          <motion.button
            whileTap={tapAnimation}
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-blue-700 disabled:opacity-70"
          >
             {loading ? <FaSpinner className="animate-spin" /> : (saved ? <><FaCheck /> Saved!</> : 'Save Changes')}
          </motion.button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Security</h2>
        
        <motion.button
          whileTap={tapAnimation}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 mb-3"
        >
          <FaKey /> Change Password
        </motion.button>
      </div>

      {/* Logout */}
      <motion.button
        whileTap={tapAnimation}
        onClick={onLogout}
        className="w-full py-4 bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200"
      >
        <FaSignOutAlt /> Sign Out
      </motion.button>
    </motion.div>
  );
};

// ==================== MAIN APP COMPONENT ====================
function RestaurantPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [mealPlans, setMealPlans] = useState([]); 
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await api.get('/restaurant/dashboard-data');
      const { orders, subscribers, mealPlans } = response.data;
      setOrders(orders);
      setSubscribers(subscribers);
        setIsProfileComplete(true);
      setMealPlans(mealPlans);
      
      // Also update local restaurant user data if endpoint supports it, otherwise rely on local storage
      // For this example, we assume dashboard-data might return updated user info too, or we assume
      // the SettingsPage update handles the local storage sync.
    } catch (error) {
      toast.error("Failed to load restaurant data.");
      console.error("Data fetch error:", error);
      if (error.response?.status === 401) {
        handleLogout(); // If token is invalid, log out
      }
    }
  };

  useEffect(() => {
    // Check for saved session
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (user && token && user.role === 'restaurant') {
      setIsLoggedIn(true);
      setRestaurant(user);
      fetchData();

      // Check if the restaurant profile is complete. If not, navigate to settings.
      const isProfileComplete = user.description && user.campus && user.location_sector && user.location_district && user.category;
      if (!isProfileComplete) {
        setActivePage('settings');
      }
    } else {
      // If no valid session, ensure the user is logged out.
      setIsLoggedIn(false);
      setRestaurant(null);
    }
  }, []);

  const handleLogin = (userData, token, needsProfileCompletion = false) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
      setRestaurant(userData);
    setIsLoggedIn(true);
    if (needsProfileCompletion) {
      setActivePage('settings');
      }
    localStorage.setItem('token', token);
    if (!userData.description || !userData.campus || !userData.location_sector || !userData.location_district || !userData.category) {
      // Redirect to complete profile if details are missing
      setIsProfileComplete(false);
        setRestaurant(userData);
        setActivePage('settings');
    } else {
      setIsProfileComplete(true);
        setRestaurant(userData);
        }
    fetchData();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRestaurant(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/restaurant/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}.`);
      fetchData(); // Re-fetch all data to ensure consistency
    } catch (error) {
      toast.error(`Failed to update order status.`);
    }
  };

  const handleUseMeal = async (subscriptionId) => { // Only subscriptionId is needed for backend
    try {
      await api.post('/restaurant/subscribers/use-meal', {
        subscriptionId: subscriptionId,
        // The backend calculates meal_index automatically based on used_plates
        // restaurantId is automatically added by the isRestaurantOwner middleware
      });
      toast.success(`Meal used for subscriber ${subscriptionId}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to record meal usage.");
    }
  };

  // Handler for updating meal plans from the management page
  const handleUpdatePlans = async (planData) => {
    try {
      if (planData.id) {
        await api.put(`/restaurant/meal-plans/${planData.id}`, planData);
        toast.success("Meal plan updated!");
      } else {
        await api.post('/restaurant/meal-plans', planData);
        toast.success("New meal plan created!");
      }
      fetchData();
    } catch (error) {
      toast.error("Failed to save meal plan.");
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome },
    { id: 'usage', label: 'Use Meal', icon: FaQrcode },
    { id: 'orders', label: 'Orders', icon: FaClipboardList, badge: orders.filter(o => o.status === 'pending').length },
    { id: 'subscribers', label: 'Subscribers', icon: FaUsers },
    { id: 'plans', label: 'Meal Plans', icon: FaWallet },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine },
    { id: 'settings', label: 'Settings', icon: FaCog },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Toaster position="top-center" />
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <FaStore className="text-white" />
          </div>
          <div>
            <h1 className="text-gray-800 font-bold truncate">{restaurant?.username}</h1>
            <p className="text-xs text-gray-500">Management Portal</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <motion.button
              key={item.id}
              whileTap={tapAnimation}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
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

        {/* Restaurant Info */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200">
              <img src={restaurant.image_url || `https://picsum.photos/seed/${restaurant.id}/200`} alt={restaurant.username} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-medium truncate">{restaurant.username}</p>
              <p className="text-xs text-gray-500 truncate">{restaurant.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 p-4 lg:hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <FaStore className="text-white" />
                </div>
                <h1 className="text-gray-800 font-bold">Igifu</h1>
              </div>
              <motion.button
                whileTap={tapAnimation}
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
              >
                <FaTimes />
              </motion.button>
            </div>

            <nav className="space-y-2">
              {navItems.map(item => (
                <motion.button
                  key={item.id}
                  whileTap={tapAnimation}
                  onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={tapAnimation}
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500"
            >
              <FaBars />
            </motion.button>
            <h1 className="text-xl font-bold text-gray-800 capitalize">{activePage}</h1>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileTap={tapAnimation}
              className="relative w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800"
            >
              <FaBell />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                3
              </span>
            </motion.button>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200">
              <img src={restaurant.image_url || `https://picsum.photos/seed/${restaurant.id}/200`} alt={restaurant.username} className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {activePage === 'dashboard' && (
              <DashboardPage 
                key="dashboard"
                restaurant={restaurant}
                orders={orders}
                subscribers={subscribers}
                onApproveOrder={(id) => handleUpdateOrderStatus(id, 'approved')}
                onRejectOrder={(id) => handleUpdateOrderStatus(id, 'rejected')}
                onServeOrder={(id) => handleUpdateOrderStatus(id, 'served')}
              />
            )}
            {activePage === 'orders' && (
              <OrdersPage 
                key="orders"
                orders={orders}
                onApproveOrder={(id) => handleUpdateOrderStatus(id, 'approved')}
                onRejectOrder={(id) => handleUpdateOrderStatus(id, 'rejected')}
                onServeOrder={(id) => handleUpdateOrderStatus(id, 'served')}
              />
            )}
            {activePage === 'usage' && (
              <MealUsagePage
                key="usage"
                onMealUsed={fetchData}
              />
            )}
            {activePage === 'subscribers' && (
              <SubscribersPage 
                key="subscribers"
                subscribers={subscribers}
                onUseMeal={handleUseMeal}
              />
            )}
            {activePage === 'plans' && (
              <MealPlansPage 
                key="plans"
                initialPlans={mealPlans}
                onUpdatePlans={handleUpdatePlans}
              />
            )}
            {activePage === 'analytics' && (
              <AnalyticsPage 
                key="analytics"
                orders={orders}
              />
            )}
            {activePage === 'settings' && (
              <SettingsPage 
                key="settings"
                restaurant={restaurant}
                onLogout={handleLogout}
                onUpdate={fetchData} // Pass callback to refresh data
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default RestaurantPortal;