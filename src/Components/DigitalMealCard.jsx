import React, { useEffect, useState, useMemo } from "react";
import {
  FaBell, FaSearch, FaUtensils, FaWallet, FaGift, FaMoneyBill,
  FaEllipsisH, FaLock, FaFilter, FaMapMarkerAlt,
  FaHeart, FaRegHeart, FaWalking, FaCheckCircle, FaStar, FaShoppingCart,
  FaCreditCard, FaHistory, FaUserCircle, FaTimes, FaChevronRight,
  FaInfoCircle, FaPlus, FaMinus, FaSignOutAlt, FaHeadset, FaCalendar,
  FaCheck, FaCheckSquare, FaExchangeAlt, FaShare, FaPhone, FaEnvelope,
  FaLeaf, FaClock, FaSpinner, FaUnlock, FaExclamationTriangle, FaKey, FaCopy,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import toast from 'react-hot-toast';
//// update meal card
// ==================== AXIOS CONFIG ====================
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

const successAnimation = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: [0, 1.2, 1],
    rotate: [0, 360],
    transition: { duration: 0.6, ease: "easeInOut" }
  }
};

const tapAnimation = { scale: 0.95 };
const hoverScale = { scale: 1.05 };

// ==================== HELPER FUNCTIONS ====================
const formatAmount = (amount) => {
  const n = Number(amount) || 0;
  return n.toLocaleString();
};

const getDaysCount = (planType) => {
  const map = { "Month": 30, "Half-month": 15, "Weekly": 7 };
  return map[planType] || 30;
};

const validatePhoneNumber = (phone, provider) => {
  const cleanPhone = phone.replace(/\s/g, '');
  if (cleanPhone.length !== 10) return false;

  if (provider === 'mtn') {
    return cleanPhone.startsWith('078') || cleanPhone.startsWith('079');
  } else if (provider === 'airtel') {
    return cleanPhone.startsWith('073') || cleanPhone.startsWith('072');
  }
  return false;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==================== ERROR BOUNDARY ====================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong.</h2>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==================== MEAL PLAN CARD (NAVY THEME WITH ORDERING) ====================
const MealPlanCard = ({ plan, onUseMeal, onViewDetails, onShare }) => {
  const totalMeals = plan.totalMeals;
  const usedCount = plan.usedMeals.length;
  const remaining = totalMeals - usedCount;
  const plates = plan.plates || 1;
  const days = getDaysCount(plan.planType);

  // Order state
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const handleIncrement = () => {
    if (orderQuantity < remaining) setOrderQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (orderQuantity > 1) setOrderQuantity(prev => prev - 1);
  };

  const handlePlaceOrder = async () => {
    setOrderStatus('pending');
    try {
      const response = await api.post('/student/order', {
        restaurantId: plan.restaurantId, // Use restaurantId from plan
        subscriptionId: plan.id,
        plates: orderQuantity,
      });
      setOrderId(response.data.orderId);
      toast.success("Order sent to restaurant!");
      
      // Simulate restaurant approval for demo purposes
      setTimeout(() => {
        setOrderStatus('approved');
        if (onOrderPlaced) onOrderPlaced();
      }, 3000);

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order.");
      setOrderStatus('rejected');
    }
  };

  const handleNewOrder = () => {
    setOrderStatus(null);
    setOrderId(null);
    setOrderQuantity(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0f172a] rounded-2xl shadow-2xl border border-[#1e293b] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-5 border-b border-[#1e293b]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white">{plan.restaurantName}</h3>
            <p className="text-sm text-gray-400">{plan.planName || plan.planType}</p>
          </div>
          {plan.planTier && (
            <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-bold uppercase border border-blue-500/30">
              {plan.planTier}
            </span>
          )}
        </div>
      </div>

      {/* Numeric Summary Panel */}
      <div className="p-5">
        <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <FaUtensils className="text-blue-400" /> Meal Summary
        </h4>

        {/* Summary Grid */}
        <div className="space-y-3 mb-5">
          {/* Total Plates */}
          <div className="flex items-center justify-between bg-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-600/30 rounded-lg flex items-center justify-center">
                <FaUtensils className="text-gray-400" />
              </div>
              <span className="text-gray-300">Total Plates Purchased</span>
            </div>
            <span className="text-2xl font-bold text-white">{totalMeals}</span>
          </div>

          {/* Plates Used */}
          <div className="flex items-center justify-between bg-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <FaCheck className="text-green-400" />
              </div>
              <span className="text-gray-300">Plates Used</span>
            </div>
            <span className="text-2xl font-bold text-green-400">{usedCount}</span>
          </div>

          {/* Plates Remaining */}
          <div className="flex items-center justify-between bg-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FaClock className="text-blue-400" />
              </div>
              <span className="text-gray-300">Plates Remaining</span>
            </div>
            <span className="text-2xl font-bold text-blue-400">{remaining}</span>
          </div>

          {/* Days Covered */}
          <div className="flex items-center justify-between bg-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FaCalendar className="text-purple-400" />
              </div>
              <span className="text-gray-300">Days Covered</span>
            </div>
            <span className="text-2xl font-bold text-purple-400">{days}</span>
          </div>

          {/* Total Value */}
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500/20 to-orange-600/10 rounded-xl p-4 border border-orange-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <FaMoneyBill className="text-orange-400" />
              </div>
              <span className="text-gray-300">Total Value</span>
            </div>
            <span className="text-2xl font-bold text-orange-400">RWF {formatAmount(plan.price)}</span>
          </div>
        </div>

        {/* Adjust Plate(s) Section */}
        {!orderStatus ? (
          <div className="border-t border-[#1e293b] pt-5">
            <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <FaShoppingCart className="text-blue-400" /> Adjust Plate(s) No.
            </h4>
            
            {/* Quantity Counter */}
            <div className="flex items-center justify-center gap-6 mb-5 bg-[#1e293b] rounded-xl p-4">
              <motion.button
                whileTap={tapAnimation}
                onClick={handleDecrement}
                disabled={orderQuantity <= 1}
                className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl transition-all ${
                  orderQuantity <= 1
                    ? 'bg-[#334155] text-gray-600 cursor-not-allowed'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                }`}
              >
                <FaMinus />
              </motion.button>
              
              <div className="w-24 text-center">
                <div className="text-4xl font-bold text-white">{orderQuantity}</div>
                <div className="text-xs text-gray-400 mt-1">plate{orderQuantity > 1 ? 's' : ''}</div>
              </div>
              
              <motion.button
                whileTap={tapAnimation}
                onClick={handleIncrement}
                disabled={orderQuantity >= remaining}
                className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl transition-all ${
                  orderQuantity >= remaining
                    ? 'bg-[#334155] text-gray-600 cursor-not-allowed'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                }`}
              >
                <FaPlus />
              </motion.button>
            </div>

            {/* Validation Message */}
            {orderQuantity >= remaining && remaining > 0 && (
              <p className="text-xs text-orange-400 text-center mb-4">
                Maximum plates available: {remaining}
              </p>
            )}

            {/* Order Button */}
            <motion.button
              whileTap={tapAnimation}
              onClick={handlePlaceOrder}
              disabled={remaining <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                remaining <= 0
                  ? 'bg-[#334155] text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
              }`}
            >
              <FaShoppingCart /> Order
            </motion.button>
          </div>
        ) : (
          /* Order Status Display */
          <div className="border-t border-[#1e293b] pt-5">
            <div className={`rounded-xl p-5 ${
              orderStatus === 'pending' ? 'bg-yellow-500/10 border border-yellow-500/30' :
              orderStatus === 'approved' ? 'bg-green-500/10 border border-green-500/30' :
              'bg-red-500/10 border border-red-500/30'
            }`}>
              {/* Order ID */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">Order ID</span>
                <span className="text-sm font-mono font-bold text-white bg-[#1e293b] px-3 py-1 rounded-lg">{orderId}</span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-3 mb-3">
                {orderStatus === 'pending' && (
                  <>
                    <FaSpinner className="text-2xl text-yellow-400 animate-spin" />
                    <span className="text-xl font-bold text-yellow-400">Pending</span>
                  </>
                )}
                {orderStatus === 'approved' && (
                  <>
                    <FaCheckCircle className="text-2xl text-green-400" />
                    <span className="text-xl font-bold text-green-400">Approved</span>
                  </>
                )}
                {orderStatus === 'rejected' && (
                  <>
                    <FaTimes className="text-2xl text-red-400" />
                    <span className="text-xl font-bold text-red-400">Rejected</span>
                  </>
                )}
              </div>

              {/* Order Details */}
              <div className="text-center text-sm text-gray-400">
                {orderQuantity} plate{orderQuantity > 1 ? 's' : ''} ordered
              </div>

              {/* New Order Button */}
              {orderStatus !== 'pending' && (
                <motion.button
                  whileTap={tapAnimation}
                  onClick={handleNewOrder}
                  className="w-full mt-4 py-3 bg-[#1e293b] text-gray-300 rounded-xl font-medium hover:bg-[#334155] transition-all"
                >
                  Place New Order
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* Expiry */}
        <div className="text-xs text-gray-500 text-center mt-5 pt-4 border-t border-[#1e293b]">
          Expires: {new Date(plan.expiryDate).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
};


// ==================== IGIFU CARD SCREEN (REDESIGNED) ====================
const DigitalMealCard = ({ selectedCard, wallets, isLocked, onBuyCard, onTopUp, onExchange, onUnlock, purchasedPlans = [], onNavigateToRestaurants, onSelectCard, activeWalletTab, setActiveWalletTab, onOrderPlaced, addNotification }) => {
  const totalBalance = wallets.meal + wallets.flexie;
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(true);
  const [unlockMethod, setUnlockMethod] = useState('fingerprint');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Generate card options from purchased plans (subscribed restaurants)
  const cardOptions = purchasedPlans.map((plan, index) => ({
    id: plan.id.toString(),
    name: `${plan.restaurantName} Card`,
    cardId: `IGF-${new Date(plan.purchaseDate).getFullYear()}-${String(plan.id).slice(-4)}`,
    plan: plan
  }));

  // Set default selected card when plans change
  // The parent component (IgifuDashboardMainApp) should manage `selectedCard` state.
  // This component will just use the `selectedCard` prop.

  const currentCard = useMemo(() => {
    return cardOptions.find(c => c.id === selectedCard) || cardOptions[0];
  }, [cardOptions, selectedCard]);

  // Check if current plan has remaining meals (this is a derived state, good)
  const hasRemainingMeals = currentCard?.plan ? 
    (currentCard.plan.totalMeals - (currentCard.plan.usedMeals?.length || 0)) > 0 : false;

  // Handle unlock with fingerprint (simulated) and call parent's onUnlock
  // Handle unlock with passcode and call parent's onUnlock
  const handlePasscodeUnlock = () => {
    if (passcode === '1234') {
      setPasscodeError('');
      onUnlock(false); // Call parent unlock handler to unlock the card
    } else {
      setPasscodeError('Incorrect passcode. Try 1234');
    }
  };

  const handleFingerprintUnlock = () => {
    // Simulate fingerprint scan delay
    setTimeout(() => {
      onUnlock(false);
    }, 1000);
  };

  // No subscriptions - show no card state
  if (purchasedPlans.length === 0 || selectedCard === "No Card") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-[#1e293b] rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCreditCard className="text-3xl text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Igifu Card</h3>
          <p className="text-sm text-gray-400 mb-6">Subscribe to a restaurant to get your Igifu card</p>
          <motion.button
            whileTap={tapAnimation}
            onClick={onNavigateToRestaurants}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all inline-flex items-center gap-2"
          >
            <FaUtensils /> Browse Restaurants
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Show unlock prompt
  if (isLocked) { // Only show unlock prompt if card is actually locked
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-[#1e293b]">
          <div className="text-center mb-6">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30"
            >
              <FaLock className="text-3xl text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Unlock Your Card</h3>
            <p className="text-sm text-gray-400">Verify your identity to access your Igifu card</p>
          </div>

          {/* Unlock Method Tabs */}
          <div className="flex bg-[#1e293b] rounded-xl p-1 mb-6">
            <button
              onClick={() => setUnlockMethod('fingerprint')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                unlockMethod === 'fingerprint' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔐 Fingerprint
            </button>
            <button
              onClick={() => setUnlockMethod('passcode')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                unlockMethod === 'passcode' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FaKey className="text-xs" /> Passcode
            </button>
          </div>

          {unlockMethod === 'fingerprint' ? (
            <div className="text-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleFingerprintUnlock}
                className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4 hover:border-green-400 transition-all"
              >
                <motion.span 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-4xl"
                >
                  👆
                </motion.span>
              </motion.button>
              <p className="text-sm text-gray-400">Touch to unlock with fingerprint</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Enter 4-digit Passcode</label>
                <input
                  type="password"
                  maxLength={4}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-[#1e293b] text-white text-center text-2xl tracking-[1em] rounded-xl px-4 py-4 border border-[#334155] focus:border-blue-500 focus:outline-none"
                />
                {passcodeError && (
                  <p className="text-red-400 text-xs mt-2">{passcodeError}</p>
                )}
              </div>
              <motion.button
                whileTap={tapAnimation}
                onClick={handlePasscodeUnlock}
                disabled={passcode.length !== 4 || !isLocked} // Disable if not 4 digits or if already unlocked
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                  passcode.length === 4
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-[#334155] text-gray-500 cursor-not-allowed'
                }`}
              >
                <FaUnlock /> Unlock
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Action buttons for navigation
  const actionButtons = useMemo(() => [
    { label: 'Buy', icon: FaShoppingCart, action: onNavigateToRestaurants, enabled: true },
    { label: 'Swap Wallets', icon: FaExchangeAlt, action: onExchange, enabled: !isLocked }, // Disable if locked
    { label: 'History', icon: FaHistory, action: () => {}, enabled: true },
    { label: 'Support', icon: FaHeadset, action: () => {}, enabled: true },
    { label: 'Share Meals', icon: FaShare, action: () => {}, enabled: false, soon: true },
    { label: 'Sell Igifu', icon: FaMoneyBill, action: () => {}, enabled: false, soon: true },
  ], [onNavigateToRestaurants, onExchange, isLocked]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Navigation Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {actionButtons.map((btn, index) => (
          <motion.button
            key={index}
            whileTap={btn.enabled ? tapAnimation : {}}
            onClick={btn.enabled ? btn.action : undefined}
            disabled={!btn.enabled}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              btn.enabled 
                ? 'bg-[#1e293b] text-white hover:bg-[#334155] border border-[#334155]' 
                : 'bg-[#1e293b]/50 text-gray-400 cursor-not-allowed border border-[#1e293b]'
            }`}
          >
            {btn.soon && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-lg z-10">
                Soon
              </span>
            )}
            <btn.icon className="text-sm" />
            <span>{btn.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Card Selector Dropdown - Shows subscribed restaurant cards */}
      {cardOptions.length > 0 && (
        <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#1e293b]">
          <label className="text-xs text-gray-400 mb-2 block">Available Igifu Cards</label>
          <div className="relative">
            <select
              value={selectedCard} // Use selectedCard prop
              onChange={(e) => onSelectCard(e.target.value)} // Call prop function to update parent state
              className="w-full bg-[#1e293b] text-white rounded-xl px-4 py-3 pr-10 appearance-none border border-[#334155] focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {cardOptions.map(card => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
            <FaChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
          </div>
          
          {/* Card ID */}
          {currentCard && (
            <div className="flex items-center justify-between mt-3 bg-[#1e293b]/50 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400">Card ID</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{currentCard.cardId}</span>
                <motion.button whileTap={tapAnimation} className="text-blue-400 hover:text-blue-300">
                  <FaCopy className="text-xs" />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wallet Section */}
      <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#1e293b]">
        <div className="flex bg-[#1e293b] rounded-xl p-1 mb-4">
          <button
            onClick={() => !isLocked && setActiveWalletTab('meal')} // Disable if locked
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeWalletTab === 'meal' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaUtensils className="text-xs" /> Meal Wallet
          </button>
          <button
            onClick={() => !isLocked && setActiveWalletTab('flexie')} // Disable if locked
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeWalletTab === 'flexie' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaWallet className="text-xs" /> Flexie Wallet
          </button>
        </div>

        {/* Wallet Balance Display */}
        <motion.div 
          key={activeWalletTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-5 ${
            activeWalletTab === 'meal'
              ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30' 
              : 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30'
          }`}
        >
          <div className={`text-3xl font-bold ${activeWalletTab === 'meal' ? 'text-green-400' : 'text-blue-400'}`}>
            RWF {formatAmount(activeWalletTab === 'meal' ? wallets.meal : wallets.flexie)}
          </div>
        </motion.div>

        {/* Total Balance */}
        <div className={`mt-3 flex items-center justify-between bg-[#1e293b]/50 rounded-lg px-4 py-3 ${isLocked ? 'opacity-50' : ''}`}>
          <span className="text-gray-400 text-sm">Total Balance</span>
          <span className="text-white font-bold text-lg">RWF {formatAmount(totalBalance)}</span>
        </div>
      </div>

      {/* Meal Plans with Order Functionality */}
      {currentCard && currentCard.plan && (
        <MealPlanOrderCard plan={currentCard.plan} onNavigateToRestaurants={onNavigateToRestaurants} onOrderPlaced={onOrderPlaced} addNotification={addNotification} />
      )} {/* Pass isLocked prop if needed for MealPlanOrderCard */}
    </div>
  );
};

// ==================== MEAL PLAN ORDER CARD ====================
const MealPlanOrderCard = ({ plan, onNavigateToRestaurants, onOrderPlaced, addNotification }) => {
  const totalMeals = plan.totalMeals;
  const usedCount = plan.usedMeals?.length || 0;
  const remaining = totalMeals - usedCount;
  const days = getDaysCount(plan.planType);

  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const handleIncrement = () => {
    if (orderQuantity < remaining) setOrderQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (orderQuantity > 1) setOrderQuantity(prev => prev - 1);
  };

  const handlePlaceOrder = async () => {
    setOrderStatus('pending');
    try {
      const response = await api.post('/student/order', {
        restaurantId: plan.restaurantId, // Use restaurantId from plan
        subscriptionId: plan.id,
        plates: orderQuantity,
      });
      setOrderId(response.data.orderId);
      toast.success("Order sent to restaurant!");
      if (onOrderPlaced) onOrderPlaced();
      
      if (addNotification) {
        addNotification({
          type: 'order',
          title: 'Order Pending',
          message: `Your order for ${orderQuantity} plate(s) at ${plan.restaurantName} is pending approval.`,
          details: {
            restaurant: plan.restaurantName,
            plates: orderQuantity,
            status: 'Pending',
            orderId: response.data.orderId
          }
        });
      }

      // Simulate restaurant approval for demo purposes
      setTimeout(() => {
        setOrderStatus('approved');
        if (addNotification) {
          addNotification({
            type: 'order',
            title: 'Order Approved',
            message: `Your order at ${plan.restaurantName} has been approved!`,
            details: {
              restaurant: plan.restaurantName,
              plates: orderQuantity,
              status: 'Approved',
              orderId: response.data.orderId
            }
          });
        }
      }, 3000);

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order.");
      setOrderStatus('rejected');
    }
  };

  const handleNewOrder = () => {
    setOrderStatus(null);
    setOrderId(null);
    setOrderQuantity(1);
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#1e293b]">
      {/* Plan Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{plan.restaurantName}</h3>
          <p className="text-sm text-gray-400">{plan.planName || plan.planType}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {plan.planTier && (
            <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-bold uppercase border border-blue-500/30">
              {plan.planTier}
            </span>
          )}
          <span className="text-white font-bold text-sm">RWF {formatAmount(plan.price)}</span>
        </div>
      </div>

      {/* Plates Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1e293b] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{totalMeals}</div>
          <div className="text-xs text-gray-400">Total Plates</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{usedCount}</div>
          <div className="text-xs text-gray-400">Used</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{remaining}</div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
      </div>

      {/* Order Section */}
      {remaining <= 0 ? (
        /* All meals used - prompt to subscribe */
        <div className="border-t border-[#1e293b] pt-4">
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-5 border border-orange-500/30 text-center">
            <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaExclamationTriangle className="text-2xl text-orange-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">All Meals Used!</h4>
            <p className="text-sm text-gray-400 mb-4">You've used all your plates. Subscribe again to continue enjoying meals.</p>
            <motion.button
              whileTap={tapAnimation}
              onClick={onNavigateToRestaurants}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/30"
            >
              <FaShoppingCart /> Subscribe Again
            </motion.button>
          </div>
        </div>
      ) : !orderStatus ? (
        <div className="border-t border-[#1e293b] pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <FaShoppingCart className="text-blue-400" /> Adjust Plate(s) No.
          </h4>
          
          {/* Quantity Counter */}
          <div className="flex items-center justify-center gap-6 mb-4 bg-[#1e293b] rounded-xl p-4">
            <motion.button
              whileTap={tapAnimation}
              onClick={handleDecrement}
              disabled={orderQuantity <= 1}
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                orderQuantity <= 1
                  ? 'bg-[#334155] text-gray-600 cursor-not-allowed'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              }`}
            >
              <FaMinus />
            </motion.button>
            
            <div className="w-20 text-center">
              <div className="text-3xl font-bold text-white">{orderQuantity}</div>
              <div className="text-xs text-gray-400">plate{orderQuantity > 1 ? 's' : ''}</div>
            </div>
            
            <motion.button
              whileTap={tapAnimation}
              onClick={handleIncrement}
              disabled={orderQuantity >= remaining}
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                orderQuantity >= remaining
                  ? 'bg-[#334155] text-gray-600 cursor-not-allowed'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
              }`}
            >
              <FaPlus />
            </motion.button>
          </div>

          {/* Order Button */}
          <motion.button
            whileTap={tapAnimation}
            onClick={handlePlaceOrder}
            className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30"
          >
            <FaShoppingCart /> Order
          </motion.button>
        </div>
      ) : (
        /* Order Status Display */
        <div className="border-t border-[#1e293b] pt-4">
          <div className={`rounded-xl p-4 ${
            orderStatus === 'pending' ? 'bg-yellow-500/10 border border-yellow-500/30' :
            orderStatus === 'approved' ? 'bg-green-500/10 border border-green-500/30' :
            'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">Order ID</span>
              <span className="text-sm font-mono font-bold text-white bg-[#1e293b] px-2 py-1 rounded">{orderId}</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              {orderStatus === 'pending' && (
                <>
                  <FaSpinner className="text-xl text-yellow-400 animate-spin" />
                  <span className="text-lg font-bold text-yellow-400">Pending</span>
                </>
              )}
              {orderStatus === 'approved' && (
                <>
                  <FaCheckCircle className="text-xl text-green-400" />
                  <span className="text-lg font-bold text-green-400">Approved</span>
                </>
              )}
              {orderStatus === 'rejected' && (
                <>
                  <FaTimes className="text-xl text-red-400" />
                  <span className="text-lg font-bold text-red-400">Rejected</span>
                </>
              )}
            </div>

            <div className="text-center text-sm text-gray-400">
              {orderQuantity} plate{orderQuantity > 1 ? 's' : ''} ordered
            </div>

            {orderStatus !== 'pending' && (
              <motion.button
                whileTap={tapAnimation}
                onClick={handleNewOrder}
                className="w-full mt-3 py-2 bg-[#1e293b] text-gray-300 rounded-xl font-medium hover:bg-[#334155]"
              >
                Place New Order
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Expiry */}
      <div className="text-xs text-gray-500 text-center mt-4 pt-3 border-t border-[#1e293b]">
        Expires: {new Date(plan.expiryDate).toLocaleDateString()}
      </div>
    </div>
  );
};


// ==================== RESTAURANT DETAILS MODAL ====================
const RestaurantDetailsModal = ({ restaurant, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!restaurant) return null;

  const plans = restaurant.plans || [];
  const groupedByType = plans.reduce((acc, plan) => {
    if (!acc[plan.type]) acc[plan.type] = [];
    acc[plan.type].push(plan);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalMotion}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg lg:max-w-2xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header with Restaurant Image */}
        <div className="relative flex-shrink-0">
          <div className="h-40 sm:h-48 lg:h-56 overflow-hidden">
            <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          <motion.button whileTap={tapAnimation} onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <FaTimes className="text-white text-lg" />
          </motion.button>
          <div className="absolute bottom-4 left-5 right-5">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{restaurant.name}</h3>
            <div className="flex items-center gap-3 text-white/90 text-sm">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                <FaMapMarkerAlt className="text-xs" />
                <span>{restaurant.campus}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                <FaStar className="text-yellow-400 text-xs" />
                <span>{restaurant.rating || 4.5}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                <FaWalking className="text-green-400 text-xs" />
                <span>{restaurant.walkTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 lg:p-8 overflow-y-auto flex-1">
          
          {/* About */}
          <div className="mb-5">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FaInfoCircle className="text-blue-500" />
              About
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {restaurant.fullDescription || restaurant.description}
            </p>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800">
              <span className="text-xl block mb-1">🍽️</span>
              <p className="text-xs font-bold text-gray-800 dark:text-white">Lunch + Dinner</p>
              <p className="text-[10px] text-gray-500">2 meals per day</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-800">
              <span className="text-xl block mb-1">💳</span>
              <p className="text-xs font-bold text-gray-800 dark:text-white">Easy Payment</p>
              <p className="text-[10px] text-gray-500">MoMo & Airtel</p>
            </div>
          </div>

          {/* Available Plans */}
          <div className="mb-5">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FaCalendar className="text-purple-500" />
              Available Plans
              <span className="text-xs text-gray-500 font-normal">(Lunch & Dinner)</span>
            </h4>
            {Object.entries(groupedByType).map(([type, typePlans]) => (
              <div key={type} className="mb-4">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">{type} ({getDaysCount(type)} days)</p>
                <div className="space-y-2">
                  {typePlans.map((plan, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <PlanTierBadge tier={plan.tier} />
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{plan.name} Plan</p>
                          <p className="text-xs text-green-600 mt-0.5">{getDaysCount(plan.type) * 2 * plan.plates} total plates</p>
                        </div>
                        <p className="font-bold text-xl text-blue-600">RWF {formatAmount(plan.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="mb-5">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FaPhone className="text-green-500" />
              Contact & Hours
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <FaPhone className="text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{restaurant.phone || '+250 788 XXX XXX'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <FaClock className="text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mon-Fri: 7AM-9PM • Sat-Sun: 8AM-10PM</span>
              </div>
            </div>
          </div>

          {/* Specialties */}
          {restaurant.specialties && restaurant.specialties.length > 0 && (
            <div className="mb-5">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FaLeaf className="text-orange-500" />
                Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {restaurant.specialties.map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full border border-orange-200 dark:border-orange-700 text-sm text-gray-700 dark:text-gray-300">
                    {item.icon} {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Popular Dishes */}
          {restaurant.popularDishes && restaurant.popularDishes.length > 0 && (
            <div className="mb-5">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                Popular Dishes
              </h4>
              <div className="space-y-2">
                {restaurant.popularDishes.map((dish, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                      {dish.icon || <FaUtensils />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{dish.name}</p>
                      <p className="text-xs text-gray-500 truncate">{dish.description}</p>
                    </div>
                    <span className="font-bold text-orange-600 text-sm">RWF {formatAmount(dish.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {restaurant.features && restaurant.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {restaurant.features.map((feature, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  ✓ {feature}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== WALLET EXCHANGE MODAL (NEW) ====================
const WalletExchangeModal = ({ wallets, onExchange, onClose }) => {
  const [fromWallet, setFromWallet] = useState('meal');
  const [toWallet, setToWallet] = useState('flexie');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleExchange = async () => {
    const exchangeAmount = parseInt(amount);
    if (!exchangeAmount || exchangeAmount <= 0) return;
    if (wallets[fromWallet] < exchangeAmount) return;

    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onExchange(fromWallet, toWallet, exchangeAmount);
    setProcessing(false);
    onClose();
  };

  const switchWallets = () => {
    setFromWallet(toWallet);
    setToWallet(fromWallet);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Exchange Wallets</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">From</label>
            <div className={`p-3 rounded-lg ${fromWallet === 'meal' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-900 dark:text-white">{fromWallet === 'meal' ? 'Meal Wallet' : 'Flexie Wallet'}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">RWF {formatAmount(wallets[fromWallet])}</div>
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button whileTap={tapAnimation} onClick={switchWallets} className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-600">
              <FaExchangeAlt className="transform rotate-90" />
            </motion.button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">To</label>
            <div className={`p-3 rounded-lg ${toWallet === 'meal' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-900 dark:text-white">{toWallet === 'meal' ? 'Meal Wallet' : 'Flexie Wallet'}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">RWF {formatAmount(wallets[toWallet])}</div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Amount (RWF)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            {amount && parseInt(amount) > wallets[fromWallet] && <p className="text-red-500 text-xs mt-1">Insufficient balance</p>}
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={tapAnimation} onClick={onClose} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold">Cancel</motion.button>
            <motion.button whileTap={tapAnimation} onClick={handleExchange} disabled={processing || !amount || parseInt(amount) > wallets[fromWallet]} className="flex-[2] py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? <FaSpinner className="animate-spin" /> : <><FaExchangeAlt /> Exchange</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== SHARE MEAL MODAL ====================
const ShareMealModal = ({ plan, onShare, onClose }) => {
  const [studentId, setStudentId] = useState('');
  const [mealsToShare, setMealsToShare] = useState(1);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const remainingMeals = plan.totalMeals - plan.usedMeals.length;

  const handleShare = async () => {
    if (!studentId || mealsToShare <= 0) return;
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onShare(plan.id, studentId, mealsToShare, message);
    setProcessing(false);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Share Meals</h3>
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sharing from</p>
            <p className="font-bold text-gray-900 dark:text-white">{plan.restaurantName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{remainingMeals} meals remaining</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Friend's Student ID</label>
            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Enter student ID" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Number of Meals</label>
            <div className="flex items-center justify-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <motion.button whileTap={tapAnimation} onClick={() => setMealsToShare(m => Math.max(1, m - 1))} className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center font-bold">
                <FaMinus />
              </motion.button>
              <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">{mealsToShare}</span>
              <motion.button whileTap={tapAnimation} onClick={() => setMealsToShare(m => Math.min(remainingMeals, m + 1))} className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold">
                <FaPlus />
              </motion.button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Message (Optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a message..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={tapAnimation} onClick={onClose} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold">Cancel</motion.button>
            <motion.button whileTap={tapAnimation} onClick={handleShare} disabled={processing || !studentId} className="flex-[2] py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? <FaSpinner className="animate-spin" /> : <><FaShare /> Share {mealsToShare} Meal{mealsToShare > 1 ? 's' : ''}</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== PAYMENT SUCCESS MODAL ====================
const PaymentSuccessModal = ({ amount, walletType = 'meal', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div variants={successAnimation} initial="initial" animate="animate" className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ duration: 1, repeat: 1, repeatType: "reverse" }} className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle className="text-white text-4xl" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">RWF {formatAmount(amount)} added to your {walletType === 'meal' ? 'Meal' : 'Flexie'} Wallet.</p>
        <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} className="h-1 bg-green-500 rounded-full mt-4" />
      </motion.div>
    </motion.div>
  );
};

// ==================== QUICK STATS ====================
const QuickStats = ({ wallets, activePlans, savedAmount }) => {
  const totalBalance = wallets.meal + wallets.flexie;
  const stats = [
    { label: 'Balance', value: `${formatAmount(totalBalance)}`, icon: FaWallet, color: 'purple', unit: 'RWF' },
    { label: 'Active Plans', value: activePlans, icon: FaUtensils, color: 'green', unit: '' },
    { label: 'Saved', value: `${formatAmount(savedAmount)}`, icon: FaMoneyBill, color: 'orange', unit: 'RWF' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {stats.map((stat, index) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.05 }} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
            <stat.icon className="text-base sm:text-lg text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">{stat.value}</div>
          <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
            {stat.unit && <span className="text-[9px] sm:text-[10px]">{stat.unit} </span>}{stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ==================== FILTER BAR ====================
const FilterBar = ({ filterState, setFilterState, resultsCount, campuses }) => {
  const [showMore, setShowMore] = useState(false);

  const priceOptions = [
    { value: 'all', label: 'All Prices', min: 0, max: 999999 },
    { value: 'under25k', label: '< 25,000', min: 0, max: 25000 },
    { value: '25k-50k', label: '25K - 50K', min: 25000, max: 50000 },
    { value: '50k-100k', label: '50K - 100K', min: 50000, max: 100000 },
    { value: 'over100k', label: '> 100,000', min: 100000, max: 999999 },
  ];

  const activeFiltersCount = [
    filterState.name ? 1 : 0,
    filterState.campus !== 'All Campuses' ? 1 : 0,
    filterState.priceRange !== 'all' ? 1 : 0,
    filterState.favorites ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  const styles = {
    container: {
      backgroundColor: '#0d0d14',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: isMobile ? '12px' : '16px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    },
    topRow: {
      display: 'flex',
      gap: isMobile ? '8px' : '12px',
      flexWrap: 'wrap',
      marginBottom: '12px',
    },
    searchWrapper: {
      flex: isMobile ? '1 1 100%' : '1 1 200px',
      position: 'relative',
      minWidth: isMobile ? '100%' : '150px',
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      fontSize: isMobile ? '12px' : '14px',
    },
    searchInput: {
      width: '100%',
      padding: isMobile ? '10px 10px 10px 34px' : '12px 12px 12px 38px',
      backgroundColor: '#1a1a24',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: isMobile ? '10px' : '12px',
      color: '#fff',
      fontSize: isMobile ? '13px' : '14px',
      outline: 'none',
    },
    selectWrapper: {
      flex: isMobile ? '1 1 calc(50% - 4px)' : '0 1 180px',
      position: 'relative',
      minWidth: isMobile ? 'calc(50% - 4px)' : '140px',
    },
    selectIcon: {
      position: 'absolute',
      left: isMobile ? '10px' : '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      fontSize: isMobile ? '12px' : '14px',
      pointerEvents: 'none',
    },
    select: {
      width: '100%',
      padding: isMobile ? '10px 10px 10px 32px' : '12px 12px 12px 38px',
      backgroundColor: '#1a1a24',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: isMobile ? '10px' : '12px',
      color: '#fff',
      fontSize: isMobile ? '12px' : '14px',
      outline: 'none',
      appearance: 'none',
      cursor: 'pointer',
    },
    selectArrow: {
      position: 'absolute',
      right: isMobile ? '8px' : '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      fontSize: isMobile ? '10px' : '12px',
      pointerEvents: 'none',
    },
    bottomRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
    },
    filtersLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '6px' : '10px',
      flexWrap: 'wrap',
    },
    filtersLabel: {
      color: '#9ca3af',
      fontSize: isMobile ? '11px' : '13px',
      fontWeight: '500',
    },
    badge: {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      color: '#60a5fa',
      padding: isMobile ? '3px 8px' : '4px 10px',
      borderRadius: '20px',
      fontSize: isMobile ? '10px' : '12px',
      fontWeight: '600',
    },
    activeBadge: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: '#4ade80',
      padding: isMobile ? '3px 8px' : '4px 10px',
      borderRadius: '20px',
      fontSize: isMobile ? '10px' : '12px',
      fontWeight: '600',
    },
    moreBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: '#60a5fa',
      fontSize: isMobile ? '11px' : '13px',
      fontWeight: '600',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: isMobile ? '4px 8px' : '6px 12px',
      borderRadius: '8px',
      transition: 'background 0.2s',
    },
    morePanel: {
      marginTop: '12px',
      padding: isMobile ? '10px' : '12px',
      backgroundColor: '#1a1a24',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    moreRow: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '12px',
      flexWrap: 'wrap',
    },
    favBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: isMobile ? '8px 12px' : '10px 16px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontSize: isMobile ? '11px' : '13px',
      fontWeight: '500',
      transition: 'all 0.2s',
      flex: isMobile ? '1 1 auto' : 'none',
    },
    sortSelect: {
      padding: isMobile ? '8px 10px' : '10px 14px',
      backgroundColor: '#252532',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '10px',
      color: '#fff',
      fontSize: isMobile ? '11px' : '13px',
      outline: 'none',
      cursor: 'pointer',
      flex: isMobile ? '1 1 auto' : 'none',
    },
  };

  return (
    <div style={styles.container}>
      {/* Top Row: Search, Campus, Price */}
      <div style={styles.topRow}>
        {/* Search Input */}
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by name..."
            value={filterState.name}
            onChange={(e) => setFilterState(prev => ({ ...prev, name: e.target.value }))}
            style={styles.searchInput}
          />
        </div>

        {/* Campus Dropdown */}
        <div style={styles.selectWrapper}>
          <span style={styles.selectIcon}>📍</span>
          <select
            value={filterState.campus}
            onChange={(e) => setFilterState(prev => ({ ...prev, campus: e.target.value }))}
            style={styles.select}
          >
            <option value="All Campuses">All Campuses</option>
            {campuses.map(campus => (
              <option key={campus} value={campus}>{campus.replace(' Campus', '')}</option>
            ))}
          </select>
          <span style={styles.selectArrow}>▼</span>
        </div>

        {/* Price Dropdown */}
        <div style={styles.selectWrapper}>
          <span style={styles.selectIcon}>💰</span>
          <select
            value={filterState.priceRange}
            onChange={(e) => {
              const option = priceOptions.find(o => o.value === e.target.value);
              setFilterState(prev => ({
                ...prev,
                priceRange: e.target.value,
                priceMin: option?.min || 0,
                priceMax: option?.max || 999999
              }));
            }}
            style={styles.select}
          >
            {priceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span style={styles.selectArrow}>▼</span>
        </div>
      </div>

      {/* Bottom Row: Filters label + Badge + More button */}
      <div style={styles.bottomRow}>
        <div style={styles.filtersLeft}>
          <span style={styles.filtersLabel}>Filters</span>
          <span style={styles.badge}>{resultsCount} Results</span>
          {activeFiltersCount > 0 && (
            <span style={styles.activeBadge}>{activeFiltersCount} active</span>
          )}
        </div>
        <button
          style={{
            ...styles.moreBtn,
            backgroundColor: showMore ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
          }}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Less' : 'More'} {showMore ? '▲' : '▶'}
        </button>
      </div>

      {/* More Panel */}
      {showMore && (
        <div style={styles.morePanel}>
          <div style={styles.moreRow}>
            <button
              style={{
                ...styles.favBtn,
                backgroundColor: filterState.favorites ? '#ef4444' : '#252532',
                color: filterState.favorites ? '#fff' : '#9ca3af',
              }}
              onClick={() => setFilterState(prev => ({ ...prev, favorites: !prev.favorites }))}
            >
              ❤️ Favorites Only
            </button>
            <select
              style={styles.sortSelect}
              value={filterState.priceSort}
              onChange={(e) => setFilterState(prev => ({ ...prev, priceSort: e.target.value }))}
            >
              <option value="None">Sort by...</option>
              <option value="Low to High">Price: Low → High</option>
              <option value="High to Low">Price: High → Low</option>
              <option value="Rating">⭐ Top Rated</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== PLAN TIER BADGE ====================
const PlanTierBadge = ({ tier }) => {
  const tierConfig = {
    budget: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', label: 'Budget', icon: '💰' },
    basic: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Basic', icon: '📦' },
    standard: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', label: 'Standard', icon: '⭐' },
    premier: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', label: 'Premier', icon: '💎' },
    exclusive: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: 'Exclusive', icon: '🔥' },
    vip: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', label: 'VIP', icon: '👑' },
  };
  const config = tierConfig[tier] || tierConfig.basic;
  return (
    <span className={`${config.bg} ${config.text} px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 whitespace-nowrap`}>
      <span className="text-[10px] sm:text-xs">{config.icon}</span> {config.label}
    </span>
  );
};

// ==================== RESTAURANT CARD ====================
const RestaurantCard = ({ restaurant, index, onToggleFav, onOrder }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const plans = restaurant.plans || [];
  const lowestPrice = plans.length > 0 ? Math.min(...plans.map(p => p.price)) : 0;
  const highestTier = plans.reduce((acc, p) => {
    const tierOrder = { budget: 1, basic: 2, standard: 3, premier: 4, exclusive: 5, vip: 6 };
    return tierOrder[p.tier] > tierOrder[acc] ? p.tier : acc;
  }, 'budget');
  const rating = restaurant.rating || 4.5;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        whileHover={{ y: -4, transition: { duration: 0.2 } }} 
        transition={{ delay: index * 0.04 }} 
        className="bg-white dark:bg-gray-900/80 rounded-2xl shadow-sm hover:shadow-md border border-gray-200/80 dark:border-gray-700/50 overflow-hidden group relative transition-all duration-300"
      >
        {/* Favorite Button */}
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => onToggleFav(restaurant.id)} 
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          {restaurant.isFav ? (
            <FaHeart className="text-rose-400 text-sm" />
          ) : (
            <FaRegHeart className="text-gray-400 dark:text-gray-500 text-sm hover:text-rose-400 transition-colors" />
          )}
        </motion.button>

        {/* Image Section */}
        <div className="relative h-32 sm:h-36 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}
          <img 
            src={restaurant.image} 
            alt={restaurant.name} 
            className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`} 
            onLoad={() => setImageLoaded(true)} 
            loading="lazy" 
          />

          {/* Bottom Info Pills */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <FaWalking className="text-emerald-500 text-xs" />
              <span className="text-gray-700 dark:text-gray-200 font-medium text-xs">{restaurant.walkTime}</span>
            </div>
            <div className="bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
              <span className="text-white font-medium text-xs">{plans.length} Plans</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Restaurant Name & Location */}
          <div className="mb-2">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1">{restaurant.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <FaMapMarkerAlt className="text-emerald-500 text-[10px] flex-shrink-0" />
              <span className="truncate">{restaurant.campus}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
            {restaurant.description}
          </p>

          {/* Price Box - Soft Colors */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-3 border border-gray-100 dark:border-gray-700/50">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">From</div>
                <div className="font-bold text-lg text-gray-800 dark:text-white">RWF {formatAmount(lowestPrice)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Includes</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Lunch + Dinner</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button 
              whileTap={{ scale: 0.97 }} 
              onClick={() => setShowDetails(true)} 
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              <FaInfoCircle className="text-xs" /> Details
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.97 }} 
              onClick={() => onOrder(restaurant)} 
              className="flex-[1.5] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              <FaShoppingCart className="text-xs" /> Subscribe
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && <RestaurantDetailsModal restaurant={restaurant} onClose={() => setShowDetails(false)} />}
      </AnimatePresence>
    </>
  );
};

// ==================== ENHANCED PAYMENT MODAL (IMPROVED) ====================
const EnhancedPaymentModal = ({ defaultAmount = 10000, onPay, onClose, processing, setProcessing, activeWalletTab }) => {
  const [paymentMethod, setPaymentMethod] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState(defaultAmount);
  const [feeOption, setFeeOption] = useState('no-fee');
  const [phoneError, setPhoneError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sentOTP, setSentOTP] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showUSSD, setShowUSSD] = useState(false);

  const fees = useMemo(() => ({
    'no-fee': 0,
    'half-month': Math.ceil(amount * 0.01),
    'monthly': Math.ceil(amount * 0.02),
  }), [amount]);

  const totalAmount = amount + fees[feeOption];

  const validatePhone = useCallback(() => {
    const isValid = validatePhoneNumber(phoneNumber, paymentMethod);
    if (!isValid) {
      const provider = paymentMethod === 'mtn' ? 'MTN (078/079)' : 'Airtel (072/073)';
      setPhoneError(`Please enter a valid ${provider} number`);
      return false;
    }
    setPhoneError('');
    return true;
  }, [phoneNumber, paymentMethod]);

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10 || !amount || amount <= 0) return;
    if (!validatePhone()) return;

    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const otp = generateOTP();
    setSentOTP(otp);
    setProcessing(false);
    setShowOTP(true);
    // console.log('📱 Demo OTP Code:', otp); // Keep this for dev, remove for prod
  };

  const handleOTPVerification = async () => {
    if (otpCode !== sentOTP) {
      setOtpError('Invalid OTP code. Please try again.');
      return;
    }

    setOtpError('');
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    onPay(paymentMethod, phoneNumber, totalAmount, activeWalletTab); // Pass activeWalletTab
  };

  const handleShowUSSD = () => {
    setShowUSSD(true);
  };

  const ussdCode = paymentMethod === 'mtn' ? '*182*8*1#' : '*500#';

  if (showOTP) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaKey className="text-white text-2xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter OTP Code</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We sent a 6-digit code to <strong>{phoneNumber}</strong>
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Demo OTP: {sentOTP}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className="w-full h-14 text-center text-2xl font-mono tracking-widest bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 text-gray-900 dark:text-white"
                autoFocus
              />
              {otpError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-2 text-center">
                  {otpError}
                </motion.p>
              )}
            </div>

            <motion.button
              whileTap={tapAnimation}
              onClick={handleOTPVerification}
              disabled={processing || otpCode.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <FaSpinner className="animate-spin" /> : <><FaCheckCircle /> Verify & Pay</>}
            </motion.button>

            <div className="text-center">
              <button
                onClick={handleShowUSSD}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Didn't receive code? Use USSD
              </button>
            </div>

            {showUSSD && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4"
              >
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <FaPhone className="text-yellow-600" />
                  Alternative: Dial USSD Code
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Dial this code on your phone to approve the payment:
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-gray-300 dark:border-gray-600">
                  <code className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ussdCode}</code>
                  <motion.button
                    whileTap={tapAnimation}
                    onClick={() => {
                      navigator.clipboard.writeText(ussdCode);
                      alert('USSD code copied!');
                    }}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold flex items-center gap-1"
                  >
                    <FaCopy /> Copy
                  </motion.button>
                </div>
              </motion.div>
            )}

            <motion.button
              whileTap={tapAnimation}
              onClick={() => {
                setShowOTP(false);
                setOtpCode('');
                setSentOTP('');
                setOtpError('');
                setShowUSSD(false);
              }}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold"
            >
              Back
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Add Money to {activeWalletTab === 'meal' ? 'Meal' : 'Flexie'} Wallet</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Amount (RWF)</label>
            <input 
              type="number" 
              min="500" 
              value={amount} 
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)} 
              placeholder="Enter amount e.g., 10000" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 block">Processing Fee Options</label>
            <div className="space-y-2">
              {[
                { key: 'no-fee', label: 'No Fee', desc: 'Standard processing', fee: fees['no-fee'] },
                { key: 'half-month', label: 'Half Month Fee', desc: 'Slightly faster', fee: fees['half-month'] },
                { key: 'monthly', label: 'Monthly Fee', desc: 'Priority processing', fee: fees['monthly'] },
              ].map(option => (
                <motion.button
                  key={option.key}
                  whileTap={tapAnimation}
                  onClick={() => setFeeOption(option.key)}
                  className={`w-full p-3 rounded-xl border-2 transition-all flex justify-between items-center ${feeOption === option.key
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600'
                    }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{option.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{option.desc}</div>
                  </div>
                  <div className="text-sm font-bold text-blue-600">+RWF {formatAmount(option.fee)}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 block">Select Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileTap={tapAnimation} onClick={() => { setPaymentMethod('mtn'); setPhoneError(''); }} className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'mtn' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-black">MTN</span>
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">MTN MoMo</p>
                <p className="text-[10px] text-gray-500 text-center mt-1">078/079</p>
              </motion.button>

              <motion.button whileTap={tapAnimation} onClick={() => { setPaymentMethod('airtel'); setPhoneError(''); }} className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'airtel' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-white">airtel</span>
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">Airtel Money</p>
                <p className="text-[10px] text-gray-500 text-center mt-1">072/073</p>
              </motion.button>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setPhoneError('');
              }}
              onBlur={validatePhone}
              placeholder={paymentMethod === 'mtn' ? '078XXXXXXX' : '072XXXXXXX'}
              className={`w-full px-4 py-3 rounded-xl border ${phoneError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
            />
            {phoneError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-1">
                {phoneError}
              </motion.p>
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">Amount</span>
              <span className="font-bold text-gray-900 dark:text-white">RWF {formatAmount(amount)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">Fee</span>
              <span className="font-bold text-gray-900 dark:text-white">RWF {formatAmount(fees[feeOption])}</span>
            </div>
            <div className="border-t border-blue-200 dark:border-blue-700 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-xl font-bold text-blue-600">RWF {formatAmount(totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={tapAnimation} onClick={onClose} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold" disabled={processing}>Cancel</motion.button>
            <motion.button whileTap={tapAnimation} onClick={handlePayment} disabled={processing || !phoneNumber || amount <= 0 || phoneError} className={`flex-[2] py-3 ${paymentMethod === 'mtn' ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white'} rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2`}>
              {processing ? <FaSpinner className="animate-spin" /> : <>Continue</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== UNLOCK CARD MODAL ====================
const UnlockCardModal = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [processing, setProcessing] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(''); // Local error state for PIN

  const handleUnlock = async () => {
    if (pin.length < 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setProcessing(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));

    if (pin === '1234') {
      onSuccess(false); // Pass false to indicate unlock
    } else {
      setAttempts(a => a + 1);
      setError('Wrong PIN. Try again.');
      setPin('');
    } 
    setProcessing(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
        <motion.div animate={error ? shakeAnimation : {}} className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <FaLock className="text-2xl sm:text-3xl text-white" />
        </motion.div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Unlock Your Card</h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
          Enter your 4-digit PIN to unlock (Use 1234 for demo)
        </p>
        <input
          type="password"
          value={pin}
          onChange={e => {
            setError('');
            setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
          }}
          maxLength={4}
          className="w-full h-14 sm:h-16 text-center text-2xl sm:text-3xl font-mono tracking-widest bg-gray-100 dark:bg-gray-800 rounded-xl sm:rounded-2xl mb-2 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500"
          placeholder="••••"
          autoFocus
        />
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs sm:text-sm mb-4">
            {error} {attempts > 0 && `(${3 - attempts} attempts remaining)`}
          </motion.p>
        )}
        <div className="flex gap-3 mt-6">
          {onCancel && (
            <motion.button whileTap={tapAnimation} onClick={onCancel} className="flex-1 py-3 sm:py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base">
              Cancel
            </motion.button>
          )}
          <motion.button whileTap={tapAnimation} onClick={handleUnlock} disabled={processing || pin.length < 4} className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2">
            {processing ? <><FaSpinner className="animate-spin" /> Unlocking...</> : <><FaUnlock /> Unlock</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== ANDROID APP PROMPT MODAL ====================
const AndroidPromptModal = ({ onDownload, onContinue }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaAndroid className="text-white text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get the Android App</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          For the best experience, download our Android app. You can also continue with the web version.
        </p>
        <div className="flex gap-3">
          <motion.button whileTap={tapAnimation} onClick={onContinue} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold">
            Continue on Web
          </motion.button>
          <motion.a whileTap={tapAnimation} href="https://example.com/igifu.apk" onClick={onDownload} className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold text-center">
            Download App
          </motion.a>
        </div>
        <p className="text-[11px] text-gray-500 mt-3">You can download later from settings too.</p>
      </motion.div>
    </motion.div>
  );
};

// ==================== RESTAURANTS PAGE ====================
const RestozPage = ({ showToast, onOrder }) => {
  const [filterState, setFilterState] = useState({
    name: "",
    campus: "All Campuses",
    priceRange: "all",
    priceSort: "None",
    favorites: false,
    priceMin: 0,
    priceMax: 999999,
  });

  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const campuses = useMemo(() => {
    const unique = [...new Set(restaurants.map(r => r.campus))];
    return unique.sort();
  }, [restaurants]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants');
        const mappedData = response.data.map(r => ({
          id: r.id,
          name: r.name,
          campus: r.campus || "Main Campus",
          description: r.description || "No description available",
          fullDescription: r.description || "No description available",
          plans: (r.plans || []).filter(p => p.is_active !== 0).map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            price: Number(p.price),
            plates: Math.max(1, Math.round(p.total_plates / ((p.duration_days || 30) * 2))),
            totalMeals: p.total_plates,
            tier: p.tier || 'basic',
            duration_days: p.duration_days
          })),
          walkTime: r.walk_time || "N/A",
          selfService: true,
          isFav: false,
          rating: Number(r.rating) || 4.5,
          image: r.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
          features: ["WiFi", "Takeaway"],
          specialties: [],
          popularDishes: [],
          phone: r.contact_phone,
          email: r.contact_email
        }));
        setRestaurants(mappedData);
        setFilteredRestaurants(mappedData);
      } catch (error) {
        console.error("Failed to fetch restaurants", error);
        toast.error("Could not load restaurants");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    let temp = [...restaurants];

    if (filterState.name) {
      temp = temp.filter(r => r.name.toLowerCase().includes(filterState.name.toLowerCase()));
    }
    if (filterState.favorites) {
      temp = temp.filter(r => r.isFav);
    }
    if (filterState.campus && filterState.campus !== "All Campuses") {
      temp = temp.filter(r => r.campus === filterState.campus);
    }
    
    temp = temp.filter(r => {
      const minPlan = r.plans?.length > 0 ? Math.min(...r.plans.map(p => p.price)) : 0;
      return minPlan >= filterState.priceMin && minPlan <= filterState.priceMax;
    });

    if (filterState.priceSort && filterState.priceSort !== "None") {
      temp.sort((a, b) => {
        const getPrice = (r) => r.plans?.length > 0 ? Math.min(...r.plans.map(p => p.price)) : 0;
        const pa = getPrice(a);
        const pb = getPrice(b);
        if (filterState.priceSort === "Low to High") return pa - pb;
        if (filterState.priceSort === "High to Low") return pb - pa;
        if (filterState.priceSort === "Rating") return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
    }

    setFilteredRestaurants(temp);
  }, [restaurants, filterState]);

  const toggleFav = (id) => {
    setRestaurants(prev => prev.map(r => (r.id === id ? { ...r, isFav: !r.isFav } : r)));
    showToast("Favorite updated", "info");
  };

  return (
    <motion.section {...pageMotion} className="pb-28 min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-4 sm:py-6">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Find Your Perfect Meal Plan</h1>
          <p className="text-blue-100 text-xs sm:text-sm md:text-base">Subscribe to campus restaurants • Lunch & Dinner included</p>
        </div>
      </div>

      <FilterBar filterState={filterState} setFilterState={setFilterState} resultsCount={filteredRestaurants.length} campuses={campuses} />

      <div className="p-3 sm:p-4">
        <div className="mx-auto w-full max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <FaSpinner className="text-4xl text-blue-500 animate-spin" />
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <FaSearch className="text-4xl sm:text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">No restaurants found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your filters</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRestaurants.map((restaurant, index) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} onToggleFav={toggleFav} onOrder={onOrder} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

// ==================== SUBSCRIPTION PAYMENT MODAL ====================
const SubscriptionPaymentModal = ({ restaurant, onClose, onSuccess, wallets }) => {
  const plans = restaurant.plans || [];

  // Determine default plan (prefer Month > Half-month > Weekly)
  const getInitialState = () => {
    const types = [...new Set(plans.map(p => p.type))];
    const preferredType = ['Month', 'Half-month', 'Weekly'].find(t => types.includes(t)) || types[0] || 'Month';
    const index = plans.findIndex(p => p.type === preferredType);
    return { type: preferredType, index: index !== -1 ? index : 0 };
  };

  const initialState = getInitialState();
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(initialState.index);
  const [paymentMethod, setPaymentMethod] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('plan'); // 'plan' | 'payment' | 'ussd'
  const [otpCode, setOtpCode] = useState('');
  const [sentOTP, setSentOTP] = useState('');
  const [otpError, setOtpError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  const selectedPlan = plans[selectedPlanIndex] || {};
  const basePrice = selectedPlan.price || 0;
  const totalAmount = basePrice * quantity;
  const plates = selectedPlan.plates || 1;
  const days = getDaysCount(selectedPlan.type);
  const mealsPerDay = 2; // Lunch + Dinner
  const totalMeals = days * mealsPerDay * plates * quantity;
  const totalPlates = plates * quantity;
  const serviceFee = 0; // No service fee

  const validatePhone = () => {
    const isValid = validatePhoneNumber(phoneNumber, paymentMethod);
    if (!isValid) {
      const provider = paymentMethod === 'mtn' ? 'MTN (078/079)' : 'Airtel (072/073)';
      setPhoneError(`Please enter a valid ${provider} number`);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleContinueToPayment = () => {
    if (plans.length === 0) return;
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    if (!validatePhone()) return;

    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setProcessing(false);
    setStep('ussd'); // Go to USSD confirmation step
  };

  const handleUSSDConfirm = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSuccess(restaurant, selectedPlan, totalAmount, totalMeals, paymentMethod, phoneNumber);
  };

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  // Get unique plan types for tabs
  const planTypes = [...new Set(plans.map(p => p.type))];
  const [activePlanType, setActivePlanType] = useState(initialState.type);
  const filteredPlans = plans.filter(p => p.type === activePlanType);

  // Step 1: Plan Selection - New Design with custom colors
  if (step === 'plan') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-50 flex items-center justify-center p-4" 
        style={{ backgroundColor: 'rgba(12, 18, 32, 0.9)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div 
          variants={modalMotion} 
          initial="initial" 
          animate="animate" 
          exit="exit" 
          onClick={e => e.stopPropagation()} 
          className="w-full max-w-md rounded-t-[2rem] rounded-b-2xl overflow-hidden shadow-2xl" 
          style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#121C2E' }}
        >
          {/* Header with Restaurant Image */}
          <div className="relative flex-shrink-0">
            <div className="h-36 sm:h-44 overflow-hidden">
              <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0C1220 0%, rgba(12,18,32,0.6) 50%, rgba(12,18,32,0.2) 100%)' }} />
            </div>
            <motion.button 
              whileTap={tapAnimation} 
              onClick={onClose} 
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <FaTimes className="text-white text-lg" />
            </motion.button>
            <div className="absolute bottom-4 left-5 right-5">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{restaurant.name}</h3>
              <div className="flex items-center gap-3 text-sm" style={{ color: '#9AA2B1' }}>
                <div className="flex items-center gap-1">
                  <FaMapMarkerAlt className="text-xs" />
                  <span>{restaurant.campus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto flex-1" style={{ backgroundColor: '#0F1729' }}>
            {/* Select Plan Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-white">Choose Your Plan</h4>
              {/* Duration Tabs */}
              <div className="flex rounded-lg p-1" style={{ backgroundColor: '#121C2E' }}>
                {planTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setActivePlanType(type);
                      const firstPlanOfType = plans.findIndex(p => p.type === type);
                      if (firstPlanOfType !== -1) setSelectedPlanIndex(firstPlanOfType);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
                    style={{ 
                      backgroundColor: activePlanType === type ? '#0F1729' : 'transparent',
                      color: activePlanType === type ? '#FFFFFF' : '#9AA2B1'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Cards - Two Column Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {filteredPlans.map((plan, idx) => {
                const actualIndex = plans.findIndex(p => p === plan);
                const isSelected = selectedPlanIndex === actualIndex;
                const planDays = getDaysCount(plan.type);
                
                return (
                  <motion.button
                    key={actualIndex}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlanIndex(actualIndex)}
                    className="relative p-4 rounded-2xl border-2 transition-all text-left"
                    style={{ 
                      borderColor: isSelected ? '#9DFF00' : 'rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? 'rgba(157,255,0,0.1)' : '#121C2E'
                    }}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#9DFF00' }}>
                        <FaCheck className="text-xs" style={{ color: '#0C1220' }} />
                      </div>
                    )}
                    
                    <div className="font-bold text-white text-sm mb-1">{plan.name}</div>
                    <div className="text-xs mb-2" style={{ color: '#9AA2B1' }}>
                      {plan.plates} plate{plan.plates > 1 ? 's' : ''}/serving
                    </div>
                    <div className="text-xs mb-2" style={{ color: '#C7C7C7' }}>
                      {planDays} days
                    </div>
                    <div className="font-bold text-lg text-white">
                      RWF {formatAmount(plan.price)}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Quantity Selector */}
            <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: '#121C2E', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-white text-sm">How Many?</h5>
                  <p className="text-xs" style={{ color: '#9AA2B1' }}>Select quantity</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                  >
                    <FaMinus className="text-sm" />
                  </motion.button>
                  <span className="w-8 text-center font-bold text-xl text-white">{quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={incrementQuantity}
                    disabled={quantity >= 10}
                    className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#9DFF00', color: '#0C1220' }}
                  >
                    <FaPlus className="text-sm" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#0C1220', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h5 className="text-sm font-medium mb-4 uppercase tracking-wide" style={{ color: '#9AA2B1' }}>Summary</h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#C7C7C7' }}>Plan</span>
                  <span className="font-medium text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#C7C7C7' }}>Duration</span>
                  <span className="font-medium text-white">{days} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#C7C7C7' }}>Total plates</span>
                  <span className="font-medium" style={{ color: '#9DFF00' }}>{totalMeals}</span>
                </div>
                
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-white">Total</span>
                    <span className="font-bold text-2xl" style={{ color: '#9DFF00' }}>RWF {formatAmount(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueToPayment}
              disabled={plans.length === 0}
              className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ backgroundColor: '#9DFF00', color: '#0C1220' }}
            >
              Continue to Payment <FaChevronRight />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Step 2: Payment Method & Phone - New Design with custom colors
  if (step === 'payment') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-50 flex items-center justify-center p-4" 
        style={{ backgroundColor: 'rgba(12, 18, 32, 0.9)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div 
          variants={modalMotion} 
          initial="initial" 
          animate="animate" 
          exit="exit" 
          onClick={e => e.stopPropagation()} 
          className="w-full max-w-md rounded-t-[2rem] rounded-b-2xl overflow-hidden shadow-2xl" 
          style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#121C2E' }}
        >
          {/* Header */}
          <div className="p-5 flex-shrink-0" style={{ backgroundColor: '#0C1220' }}>
            <div className="flex items-center gap-3 mb-4">
              <motion.button 
                whileTap={tapAnimation} 
                onClick={() => setStep('plan')} 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <FaChevronRight className="rotate-180 text-white" />
              </motion.button>
              <h3 className="text-xl font-bold text-white">Payment</h3>
            </div>
            
            {/* Order Summary Mini */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">{restaurant.name}</div>
                  <div className="text-sm" style={{ color: '#9AA2B1' }}>{selectedPlan.name} × {quantity}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: '#9DFF00' }}>RWF {formatAmount(totalAmount)}</div>
                  <div className="text-xs" style={{ color: '#9AA2B1' }}>{totalMeals} servings</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto flex-1" style={{ backgroundColor: '#0F1729' }}>
            {/* Pay With Dropdown */}
            <div className="mb-5">
              <h4 className="font-bold text-white mb-3 text-sm">Pay With</h4>
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                  className="w-full p-4 rounded-2xl flex items-center justify-between"
                  style={{ backgroundColor: '#121C2E', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: paymentMethod === 'mtn' ? '#FFCC00' : '#FF6B3D' }}
                    >
                      <span className="font-bold text-sm" style={{ color: paymentMethod === 'mtn' ? '#0C1220' : '#FFFFFF' }}>
                        {paymentMethod === 'mtn' ? 'MTN' : 'airtel'}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">
                        {paymentMethod === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}
                      </div>
                      <div className="text-xs" style={{ color: '#9AA2B1' }}>
                        {paymentMethod === 'mtn' ? '078 / 079' : '072 / 073'}
                      </div>
                    </div>
                  </div>
                  <FaChevronRight className={`transition-transform ${showPaymentDropdown ? 'rotate-90' : ''}`} style={{ color: '#9AA2B1' }} />
                </motion.button>
                
                {/* Dropdown Options */}
                <AnimatePresence>
                  {showPaymentDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-xl z-10"
                      style={{ backgroundColor: '#121C2E', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <button
                        onClick={() => { setPaymentMethod('mtn'); setShowPaymentDropdown(false); setPhoneError(''); }}
                        className="w-full p-4 flex items-center gap-3 transition-colors"
                        style={{ backgroundColor: paymentMethod === 'mtn' ? 'rgba(255,204,0,0.1)' : 'transparent' }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFCC00' }}>
                          <span className="font-bold text-xs" style={{ color: '#0C1220' }}>MTN</span>
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-white text-sm">MTN Mobile Money</div>
                          <div className="text-xs" style={{ color: '#9AA2B1' }}>078 / 079</div>
                        </div>
                        {paymentMethod === 'mtn' && <FaCheck style={{ color: '#9DFF00' }} />}
                      </button>
                      <button
                        onClick={() => { setPaymentMethod('airtel'); setShowPaymentDropdown(false); setPhoneError(''); }}
                        className="w-full p-4 flex items-center gap-3 transition-colors"
                        style={{ backgroundColor: paymentMethod === 'airtel' ? 'rgba(255,107,61,0.1)' : 'transparent', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF6B3D' }}>
                          <span className="font-bold text-white text-xs">airtel</span>
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-white text-sm">Airtel Money</div>
                          <div className="text-xs" style={{ color: '#9AA2B1' }}>072 / 073</div>
                        </div>
                        {paymentMethod === 'airtel' && <FaCheck style={{ color: '#9DFF00' }} />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="mb-5">
              <label className="font-bold text-white mb-3 block text-sm">Phone Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: paymentMethod === 'mtn' ? '#FFCC00' : '#FF6B3D' }}
                  >
                    <FaPhone className="text-xs" style={{ color: paymentMethod === 'mtn' ? '#0C1220' : '#FFFFFF' }} />
                  </div>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setPhoneError('');
                  }}
                  onBlur={validatePhone}
                  placeholder={paymentMethod === 'mtn' ? '078XXXXXXX' : '072XXXXXXX'}
                  className="w-full pl-16 pr-4 py-4 rounded-2xl text-lg font-medium text-white focus:outline-none transition-colors"
                  style={{ 
                    backgroundColor: '#121C2E', 
                    border: phoneError ? '2px solid #FF6B3D' : '1px solid rgba(255,255,255,0.1)'
                  }}
                />
              </div>
              {phoneError && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-sm mt-2 flex items-center gap-1"
                  style={{ color: '#FF6B3D' }}
                >
                  <FaExclamationTriangle className="text-xs" />
                  {phoneError}
                </motion.p>
              )}
            </div>

            {/* Info Box */}
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'rgba(100,70,200,0.15)', border: '1px solid rgba(100,70,200,0.35)' }}>
              <div className="flex items-start gap-3">
                <FaInfoCircle style={{ color: '#9DFF00' }} className="mt-0.5" />
                <p className="text-sm" style={{ color: '#C7C7C7' }}>
                  A payment prompt will be sent to your phone. Enter your PIN to confirm.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={processing || !phoneNumber || phoneNumber.length < 10}
                className="w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                style={{ 
                  backgroundColor: paymentMethod === 'mtn' ? '#FFCC00' : '#FF6B3D',
                  color: paymentMethod === 'mtn' ? '#0C1220' : '#FFFFFF'
                }}
              >
                {processing ? <FaSpinner className="animate-spin" /> : <>Pay RWF {formatAmount(totalAmount)}</>}
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('plan')}
                className="w-full py-3 rounded-2xl font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#C7C7C7' }}
              >
                Back
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Step 3: USSD Confirmation - Updated Design with custom colors
  const ussdCode = paymentMethod === 'mtn' ? '*182*7*1#' : '*131*1*1#';
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ backgroundColor: 'rgba(12, 18, 32, 0.9)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div 
        variants={modalMotion} 
        initial="initial" 
        animate="animate" 
        exit="exit" 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-md rounded-t-[2rem] rounded-b-2xl overflow-hidden shadow-2xl" 
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#121C2E' }}
      >
        <div className="p-8 text-center flex-shrink-0" style={{ backgroundColor: paymentMethod === 'mtn' ? '#FFCC00' : '#FF6B3D' }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <FaPhone className="text-3xl" style={{ color: paymentMethod === 'mtn' ? '#0C1220' : '#FFFFFF' }} />
          </motion.div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: paymentMethod === 'mtn' ? '#0C1220' : '#FFFFFF' }}>
            Payment Request Sent!
          </h3>
          <p className="text-sm" style={{ color: paymentMethod === 'mtn' ? 'rgba(12,18,32,0.7)' : 'rgba(255,255,255,0.8)' }}>
            Check your phone <strong>{phoneNumber}</strong> and approve
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1" style={{ backgroundColor: '#0F1729' }}>
          {/* Payment Summary */}
          <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: '#121C2E', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: '#9AA2B1' }}>Restaurant</span>
              <span className="font-semibold text-white text-sm">{restaurant.name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: '#9AA2B1' }}>Plan</span>
              <span className="font-semibold text-white text-sm">{selectedPlan.name} × {quantity}</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-2xl" style={{ color: '#9DFF00' }}>RWF {formatAmount(totalAmount)}</span>
            </div>
          </div>

          {/* Waiting Animation */}
          <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: 'rgba(100,70,200,0.15)', border: '1px solid rgba(100,70,200,0.35)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2ECC71' }}>
                <FaSpinner className="text-white text-xl animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-white">Waiting for confirmation...</p>
                <p className="text-xs" style={{ color: '#9AA2B1' }}>Open your phone and enter your PIN</p>
              </div>
            </div>
          </div>

          {/* Manual USSD Option */}
          <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: '#121C2E', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
              <FaPhone style={{ color: '#FFCC00' }} />
              Didn't receive the prompt?
            </h4>
            <p className="text-xs mb-3" style={{ color: '#9AA2B1' }}>
              Dial this code to approve pending payments:
            </p>
            <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#0C1220', border: '1px solid rgba(255,255,255,0.1)' }}>
              <code className="text-2xl font-bold" style={{ color: '#9DFF00' }}>{ussdCode}</code>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigator.clipboard.writeText(ussdCode)}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5"
                style={{ backgroundColor: 'rgba(157,255,0,0.2)', color: '#9DFF00' }}
              >
                <FaCopy /> Copy
              </motion.button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleUSSDConfirm}
              disabled={processing}
              className="w-full py-4 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              style={{ 
                backgroundColor: paymentMethod === 'mtn' ? '#FFCC00' : '#FF6B3D',
                color: paymentMethod === 'mtn' ? '#0C1220' : '#FFFFFF'
              }}
            >
              {processing ? <FaSpinner className="animate-spin" /> : <><FaCheckCircle /> I've Confirmed Payment</>}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep('payment')}
              disabled={processing}
              className="w-full py-3 rounded-2xl font-semibold"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#C7C7C7' }}
            >
              Change Number
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={processing}
              className="w-full py-3 font-medium text-sm"
              style={{ color: '#9AA2B1' }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== PLAN DETAILS MODAL ====================
const PlanDetailsModal = ({ plan, onClose, onUseMeal }) => {
  if (!plan) return null;

  const usedCount = plan.usedMeals.length;
  const remaining = plan.totalMeals - usedCount;
  const nextMealIndex = Array.from({ length: plan.totalMeals }).findIndex((_, i) => !plan.usedMeals.includes(i));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white relative">
          <motion.button whileTap={tapAnimation} onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
            <FaTimes className="text-xl" />
          </motion.button>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 pr-12">{plan.restaurantName}</h2>
          <p className="text-blue-100 text-sm sm:text-base">{plan.planType} Meal Plan</p>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1">{plan.totalMeals}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Meals</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1">{usedCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Used</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-1">{remaining}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Remaining</div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Meal Tracker</h3>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 mb-6">
            {Array.from({ length: plan.totalMeals }).map((_, index) => {
              const isUsed = plan.usedMeals.includes(index);
              return (
                <motion.button key={index} whileHover={{ scale: isUsed ? 1 : 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => !isUsed && onUseMeal(plan.id, index)} className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${isUsed ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 border-2 border-dashed border-gray-300 dark:border-gray-600'}`} disabled={isUsed}>
                  {isUsed ? <FaCheckSquare className="text-xl sm:text-2xl" /> : <><FaUtensils className="text-base sm:text-lg mb-1" /><span className="text-[10px] font-bold">{index + 1}</span></>}
                </motion.button>
              );
            })}
          </div>

          {nextMealIndex !== -1 && (
            <motion.button whileTap={tapAnimation} whileHover={{ scale: 1.02 }} onClick={() => onUseMeal(plan.id, nextMealIndex)} className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg">
              <FaCheckCircle /> Use Next Meal (Meal {nextMealIndex + 1})
            </motion.button>
          )}

          {remaining === 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-center">
              <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Plan Completed!</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">You've used all meals in this plan. Purchase a new one to continue.</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Purchase Date</span>
            <span className="font-semibold text-gray-900 dark:text-white">{new Date(plan.purchaseDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Expiry Date</span>
            <span className="font-semibold text-gray-900 dark:text-white">{new Date(plan.expiryDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
            <span className="font-bold text-lg text-blue-600">RWF {formatAmount(plan.price)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== NOTIFICATION COMPONENTS ====================
const NotificationList = ({ notifications, onClose, onSelect }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-16 right-4 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><FaTimes /></button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <FaBell className="mx-auto text-2xl mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} onClick={() => onSelect(notif)} className={`p-4 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
              <div className="flex gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{notif.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                  <span className="text-[10px] text-gray-400 mt-2 block">{notif.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const NotificationDetailModal = ({ notification, onClose }) => {
  if (!notification) return null;
  const { details } = notification;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div variants={modalMotion} initial="initial" animate="animate" exit="exit" onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaInfoCircle className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{notification.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 mb-6">
          {details.restaurant && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Restaurant</span><span className="font-medium text-gray-900 dark:text-white">{details.restaurant}</span></div>}
          {details.plates && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Plates</span><span className="font-medium text-gray-900 dark:text-white">{details.plates}</span></div>}
          {details.amount !== undefined && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Amount Paid</span><span className="font-bold text-gray-900 dark:text-white">RWF {formatAmount(details.amount)}</span></div>}
          {details.balance !== undefined && <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2"><span className="text-gray-500 dark:text-gray-400">Remaining Balance</span><span className="font-bold text-green-600 dark:text-green-400">RWF {formatAmount(details.balance)}</span></div>}
          {details.status && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Status</span><span className={`font-bold ${details.status === 'Approved' ? 'text-green-500' : details.status === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{details.status}</span></div>}
        </div>
        <motion.button whileTap={tapAnimation} onClick={onClose} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Close</motion.button>
      </motion.div>
    </motion.div>
  );
};

// ==================== MAIN APP COMPONENT ====================
function IgifuDashboardMainApp() {
  const [selectedCard, setSelectedCard] = useState(() => localStorage.getItem("selectedCard") || "No Card");
  const [isCardLocked, setIsCardLocked] = useState(() => localStorage.getItem("cardLocked") === "true");
  const [activePage, setActivePage] = useState("Restoz");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [activeWalletTab, setActiveWalletTab] = useState('meal');
  const [greeting, setGreeting] = useState("Hello");
  const [notification, setNotification] = useState(null);

  const [wallets, setWallets] = useState(() => {
    const saved = localStorage.getItem("wallets");
    return saved ? JSON.parse(saved) : { meal: 0, flexie: 0 };
  });

  const [purchasedPlans, setPurchasedPlans] = useState(() => {
    const saved = localStorage.getItem("purchasedPlans");
    return saved ? JSON.parse(saved) : [];
  });

  const [showEnhancedPayment, setShowEnhancedPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentDefaultAmount, setPaymentDefaultAmount] = useState(10000);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0); // For EnhancedPaymentModal
  const [lastPaymentWallet, setLastPaymentWallet] = useState('meal');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedSharePlan, setSelectedSharePlan] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [refreshDataTrigger, setRefreshDataTrigger] = useState(0); // To trigger data refetch
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const addNotification = (data) => {
    const newNotif = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...data
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good Morning ☀️");
    else if (hours < 18) setGreeting("Good Afternoon 🌤️");
    else setGreeting("Good Evening 🌙");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    // This effect should ideally only save non-sensitive UI preferences.
    // Core data like wallets, plans, and card lock status should be fetched from the backend.
    localStorage.setItem("selectedCard", selectedCard); // This might be a UI preference
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [selectedCard, darkMode]);

  // Fetch all student data from backend on component mount or when triggered
  const fetchAllData = async () => {
    try {
      const response = await api.get('/student/dashboard-data');
      const { profile, subscriptions } = response.data;

      // Update wallets and card lock status from profile
      setWallets({
        meal: profile.meal_wallet_balance,
        flexie: profile.flexie_wallet_balance,
      });
      setIsCardLocked(profile.card_locked);

      // Map backend subscriptions to frontend purchasedPlans format
      const mappedPlans = subscriptions.map(sub => ({
        id: sub.id,
        restaurantId: sub.restaurant_id,
        restaurantName: sub.restaurantName,
        planName: sub.planName,
        planType: sub.planType,
        planTier: sub.planTier,
        price: sub.price_paid, // Price paid for this specific subscription
        totalMeals: sub.total_plates, // Total plates for this subscription
        usedMeals: sub.usedMeals, // Array of used meal indices
        purchaseDate: sub.start_date,
        expiryDate: sub.expiry_date,
      }));

      // Sort plans by purchase date (newest first) so the latest one is auto-selected
      mappedPlans.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

      setPurchasedPlans(mappedPlans);
    } catch (error) {      let errorMessage = "An unexpected error occurred while fetching data.";
      if (error && error.response) {
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else {
          const data = error.response.data;
          // Use data.message first, then fallback to other properties or a generic message
          errorMessage = (data && (data.message || data.error)) || "Failed to fetch dashboard data.";
        }
      } else if (error && error.request) {
        errorMessage = "Could not connect to the server. Please check your network.";
      } else {
        errorMessage = (error && error.message) || "An unknown error occurred.";
      }
      toast.error(errorMessage);
      console.error("Error fetching dashboard data:", (error && error.response) || error);
    }
  };

  useEffect(() => { // Initial data fetch
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      toast.error("You are not logged in. Please log in to view your data.");
      return; // Do not fetch data if there's no token
    }
    fetchAllData();
    const isAndroid = /Android/i.test(navigator.userAgent || "");
    const dismissed = localStorage.getItem("androidPromptDismissed") === "1";
    if (isAndroid && !dismissed) setShowAndroidPrompt(true);
  }, []);

  // Automatically select the first plan if one exists and none is selected
  useEffect(() => {
    if (purchasedPlans.length > 0) {
      const isCurrentCardValid = purchasedPlans.some(p => p.id.toString() === selectedCard);
      // If the current selection is "No Card" or the selected card is no longer in the list of purchased plans
      if (selectedCard === "No Card" || !isCurrentCardValid) {
        // Automatically select the first available plan
        setSelectedCard(purchasedPlans[0].id.toString());
      }
    }
  }, [purchasedPlans, selectedCard]); // Rerun when plans are loaded or selection changes

  const showToast = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBuyCardClick = () => {
    setPaymentDefaultAmount(10000);
    setShowEnhancedPayment(true);
  };

  const handleTopUp = () => {
    if (isCardLocked) {
      showToast("Please unlock your card first", "warn");
      setShowUnlockModal(true);
      return;
    }
    setPaymentDefaultAmount(10000);
    setShowEnhancedPayment(true);
  };

  const handlePaymentComplete = async (method, phone, amount, walletType = 'meal') => {
    try {
      // Optimistic update to immediately display the new balance
      setWallets(prev => ({
        ...prev,
        [walletType]: (Number(prev[walletType]) || 0) + Number(amount)
      }));
      setActiveWalletTab(walletType); // Switch to the wallet that was topped up
      setLastPaymentWallet(walletType);

      await api.post('/student/topup-wallet', { amount, walletType, paymentMethod: method, paymentPhone: phone });
      setLastPaymentAmount(amount);
      setShowEnhancedPayment(false);
      setPaymentProcessing(false);
      await fetchAllData(); // Refresh data after successful top-up
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to top up wallet.");
      setPaymentProcessing(false);
    }
    setShowPaymentSuccess(true);
    showToast(`RWF ${formatAmount(amount)} has been added to your ${walletType === 'meal' ? 'Meal' : 'Flexie'} wallet.`, "success");
    addNotification({
      type: 'payment',
      title: 'Payment Completed',
      message: `Top-up of RWF ${formatAmount(amount)} successful.`,
      details: {
        amount: amount,
        balance: (Number(wallets[walletType]) || 0) + Number(amount),
        status: 'Completed'
      }
    });
  };

  const handlePaymentSuccessClose = () => {
    setShowPaymentSuccess(false);
    if (selectedCard === "No Card") {
      setSelectedCard("Meal Card");
      setIsCardLocked(true); // Lock the card on first purchase for security demo
      showToast("Card purchased! Please unlock it to use.", "info");
      setTimeout(() => setShowUnlockModal(true), 500); // Prompt unlock
    }
  };

  const handleUnlockSuccess = async (lockStatus) => {
    try {
      await api.patch('/student/card-lock-status', { isLocked: lockStatus });
      setIsCardLocked(lockStatus); // Update local state based on backend response
      setShowUnlockModal(false);
      showToast(`Card ${lockStatus ? 'locked' : 'unlocked'} successfully! 🎉`, "success");
      await fetchAllData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update card lock status.");
    }
  };

  const handleUnlockCancel = async () => {
    setShowUnlockModal(false); // Just close the modal, no state change if cancelled
    // If the card was locked and user cancelled unlock, keep it locked
    // If the card was unlocked and user cancelled lock, keep it unlocked
    // No backend call needed here unless we want to explicitly revert a pending state.
  };

  // This function is called from DigitalMealCard component's internal unlock logic
  const handleUpdateCardLockStatus = async (lockStatus) => {
    await handleUnlockSuccess(lockStatus);
  }

  const handleManualUnlock = () => {
    setShowUnlockModal(true);
  };

  const handleWalletExchange = async (from, to, amount) => {
    if (isCardLocked) {
      showToast("Please unlock your card first", "warn");
      setShowUnlockModal(true);
      return;
    }
    try {
      await api.post('/student/exchange-wallets', { fromWallet: from, toWallet: to, amount });
      showToast(`Exchanged RWF ${formatAmount(amount)} from ${from} to ${to}`, "success");
      setShowExchangeModal(false);
      await fetchAllData(); // Refresh data after successful exchange
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to exchange wallets.");
    }
  };

  const handleShareMeal = async (planId, studentId, meals, message) => {
    try {
      await api.post('/student/subscriptions/share', {
        subscriptionId: planId,
        recipientId: studentId, // The backend expects recipientId
        mealsToShare: meals,
      });
      showToast(`Shared ${meals} meal${meals > 1 ? 's' : ''} with student ${studentId}!`, "success");
      fetchAllData(); // Refetch data to show updated plan state
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to share meals.");
    }
  };

  const handleOrder = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowOrderModal(true);
  };

  const handleSubscriptionSuccess = async (restaurant, plan, totalAmount, totalMeals, paymentMethod, phoneNumber) => {
    try {
      await api.post('/student/subscribe', {
        planId: plan.id,
        restaurantId: restaurant.id,
        pricePaid: totalAmount,
        totalPlates: totalMeals,
        durationDays: getDaysCount(plan.type),
        paymentMethod,
        paymentPhone: phoneNumber,
      });
      // If successful, show success toast and proceed
      toast.success(`🎉 ${plan.name} Plan subscribed! ${totalMeals} meals via ${paymentMethod.toUpperCase()}`);
      setShowOrderModal(false);
      setSelectedRestaurant(null);
      await fetchAllData(); // Refresh data after successful subscription
      setTimeout(() => setActivePage("MyIgifu"), 500);
      addNotification({
        type: 'subscription',
        title: 'Subscription Purchased',
        message: `You purchased ${plan.name} at ${restaurant.name}.`,
        details: {
          restaurant: restaurant.name,
          plates: totalMeals,
          amount: totalAmount,
          balance: (wallets.meal + wallets.flexie) - totalAmount
        }
      });
    } catch (error) {
      let errorMessage = "An unexpected error occurred during subscription.";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else {
          const data = error.response.data;
          errorMessage = (data && data.message) || "An unknown server error occurred during subscription.";
        }
      } else if (error.request) {
        errorMessage = "Could not connect to the server. Please check your network.";
      } else {
        errorMessage = error.message;
      }
      toast.error(String(errorMessage)); // Ensure errorMessage is always a string
      return; // Stop execution if subscription fails
    }
  };

  const handleUseMeal = async (planId, mealIndex) => {
    const plan = purchasedPlans.find(p => p.id === planId);
    if (!plan) return;

    try {
      await api.post('/student/subscriptions/use-meal', {
        subscriptionId: planId,
        restaurantId: plan.restaurantId, // The backend needs the restaurantId
      });
      toast.success(`Meal used successfully!`);
      fetchAllData(); // Refresh data from the backend
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to use meal.");
    }
  };

  const handleDownloadApp = () => {
    localStorage.setItem("androidPromptDismissed", "1");
    setShowAndroidPrompt(false);
  };

  const handleContinueWeb = () => {
    localStorage.setItem("androidPromptDismissed", "1");
    setShowAndroidPrompt(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setSelectedCard("No Card");
    setIsCardLocked(false);
    setWallets({ meal: 0, flexie: 0 });
    setPurchasedPlans([]);
    showToast('Logged out successfully', 'info');
    setTimeout(() => window.location.href = '/login', 1000);
  };

  // ==================== PAGES ====================
  const MyIgifuPage = () => {
    return (
      <motion.section {...pageMotion} className="px-3 sm:px-4 py-4 sm:py-6 pb-28" style={{ backgroundColor: '#0a0e1a' }}>
        <div className="mx-auto w-full max-w-6xl">
          
          {/* Igifu Card Section */}
          <DigitalMealCard
            selectedCard={selectedCard}
            wallets={wallets}
            isLocked={isCardLocked}
            onBuyCard={handleBuyCardClick}
            onTopUp={handleTopUp}
            onExchange={() => {
              if (isCardLocked) {
                showToast("Please unlock your card first", "warn");
                setShowUnlockModal(true);
                return;
              }
              setShowExchangeModal(true);
            }}
            onUnlock={handleManualUnlock}
            purchasedPlans={purchasedPlans}
            onNavigateToRestaurants={() => setActivePage("Restoz")}
            onSelectCard={setSelectedCard} // Pass setSelectedCard to DigitalMealCard
            activeWalletTab={activeWalletTab}
            setActiveWalletTab={setActiveWalletTab}
            onOrderPlaced={fetchAllData}
            addNotification={addNotification}
          />
        </div>
      </motion.section>
    );
  };

  const EarnPage = () => (
    <motion.section {...pageMotion} className="px-3 sm:px-4 py-4 sm:py-6 pb-28">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Earn Rewards</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-white mb-6 shadow-xl text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FaGift className="text-4xl sm:text-5xl" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Coming Soon!</h3>
          <p className="text-base sm:text-lg text-white/90 mb-2">Exciting rewards program is on the way</p>
          <p className="text-sm sm:text-base text-white/80">Earn points with every meal purchase and redeem for amazing rewards, free meals, and exclusive discounts.</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4"><div className="text-3xl mb-2">🎁</div><p className="text-sm font-bold">Free Meals</p></div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4"><div className="text-3xl mb-2">💰</div><p className="text-sm font-bold">Discounts</p></div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4"><div className="text-3xl mb-2">⭐</div><p className="text-sm font-bold">Exclusive Perks</p></div>
          </div>
        </motion.div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 dark:text-blue-400 text-xl flex-shrink-0 mt-1" />
            <div><h4 className="font-bold text-gray-900 dark:text-white mb-2">Stay Tuned!</h4><p className="text-sm text-gray-600 dark:text-gray-400">We're working hard to bring you an amazing rewards experience.</p></div>
          </div>
        </div>
      </div>
    </motion.section>
  );

  const LoansPage = () => (
    <motion.section {...pageMotion} className="px-3 sm:px-4 py-4 sm:py-6 pb-28">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Student Loans</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-white mb-6 shadow-xl text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FaMoneyBill className="text-4xl sm:text-5xl" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Coming Soon!</h3>
          <p className="text-base sm:text-lg text-white/90 mb-2">Quick and easy student meal loans</p>
          <p className="text-sm sm:text-base text-white/80">Get instant access to meals when you need them most. Interest-free options available for students.</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4"><div className="text-3xl mb-2">⚡</div><p className="text-sm font-bold">Instant Approval</p></div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4"><div className="text-3xl mb-2">🆓</div><p className="text-sm font-bold">0% Interest</p></div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4"><div className="text-3xl mb-2">📅</div><p className="text-sm font-bold">Flexible Repayment</p></div>
          </div>
        </motion.div>
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-green-600 dark:text-green-400 text-xl flex-shrink-0 mt-1" />
            <div><h4 className="font-bold text-gray-900 dark:text-white mb-2">Financial Support for Students</h4><p className="text-sm text-gray-600 dark:text-gray-400">We understand student life can be challenging. Check back soon for launch details!</p></div>
          </div>
        </div>
      </div>
    </motion.section>
  );

  const MorePage = () => (
    <motion.section {...pageMotion} className="px-3 sm:px-4 py-4 sm:py-6 pb-28">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Settings & More</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"><FaUserCircle className="text-4xl" /></div>
            <div><h3 className="text-xl font-bold">Student Name</h3><p className="text-blue-100 text-sm">ID: STU2024001</p><p className="text-blue-100 text-sm">Campus: Huye</p></div>
          </div>
        </motion.div>

        <div className="space-y-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={tapAnimation} onClick={() => showToast('Profile settings coming soon!', 'info')} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3"><FaUserCircle className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400" /><span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">Edit Profile</span></div>
            <FaChevronRight className="text-gray-400" />
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="text-xl sm:text-2xl">🌙</div><span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">Dark Mode</span></div>
            <motion.button whileTap={tapAnimation} onClick={() => setDarkMode(!darkMode)} className={`w-12 h-7 rounded-full p-1 transition-colors ${darkMode ? "bg-blue-600" : "bg-gray-300"}`}>
              <motion.div layout className="w-5 h-5 bg-white rounded-full shadow-sm" style={{ marginLeft: darkMode ? '20px' : '0px' }} />
            </motion.button>
          </motion.div>

          {purchasedPlans.length > 0 && ( // Only show lock/unlock if there are actual cards/plans
            <motion.div whileHover={{ scale: 1.02 }} whileTap={tapAnimation} onClick={isCardLocked ? handleManualUnlock : () => setIsCardLocked(true)} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">{isCardLocked ? <FaLock className="text-xl sm:text-2xl text-red-600 dark:text-red-400" /> : <FaUnlock className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />}<span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">Card {isCardLocked ? 'Locked' : 'Unlocked'}</span></div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${isCardLocked ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>{isCardLocked ? 'Tap to Unlock' : 'Tap to Lock'}</span>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={tapAnimation} onClick={() => setShowAndroidPrompt(true)} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3"><FaAndroid className="text-xl sm:text-2xl text-green-600 dark:text-green-400" /><span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">Download Android App</span></div>
            <FaChevronRight className="text-gray-400" />
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={tapAnimation} onClick={() => showToast('Help & Support coming soon!', 'info')} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3"><FaHeadset className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400" /><span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">Help & Support</span></div>
            <FaChevronRight className="text-gray-400" />
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={tapAnimation} onClick={handleLogout} className="bg-red-50 dark:bg-red-900/20 rounded-xl sm:rounded-2xl p-4 border border-red-200 dark:border-red-700 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3"><FaSignOutAlt className="text-xl sm:text-2xl text-red-600 dark:text-red-400" /><span className="font-medium text-red-600 dark:text-red-400 text-sm sm:text-base">Sign Out</span></div>
            <FaChevronRight className="text-red-400" />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
  // ==================== RETURN MAIN RENDER ====================
  return (
    <ErrorBoundary>
    <div className="min-h-screen font-sans flex flex-col bg-gray-50 dark:bg-[#0b0b12] transition-colors duration-300">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div whileTap={tapAnimation} className="text-2xl sm:text-3xl bg-white/20 backdrop-blur-md p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-lg">🍽️</motion.div>
            <div><div className="text-[10px] sm:text-xs opacity-90">{greeting}</div><div className="text-sm sm:text-base font-bold">Welcome, Student</div></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button whileTap={tapAnimation} whileHover={hoverScale} onClick={() => setActivePage("Restoz")} className="p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all"><FaSearch className="text-sm sm:text-lg" /></motion.button>
            <motion.button whileTap={tapAnimation} whileHover={hoverScale} onClick={() => setShowNotifications(!showNotifications)} className="p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all relative">
              <FaBell className="text-sm sm:text-lg" />
              {notifications.some(n => !n.read) && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
            </motion.button>
            <AnimatePresence>
              {showNotifications && (
                <NotificationList 
                  notifications={notifications} 
                  onClose={() => setShowNotifications(false)}
                  onSelect={(n) => { setSelectedNotification(n); setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); setShowNotifications(false); }}
                />
              )}
            </AnimatePresence>
            <motion.button whileTap={tapAnimation} whileHover={hoverScale} onClick={() => setActivePage("More")} className="p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all"><FaUserCircle className="text-sm sm:text-lg" /></motion.button>
            <motion.button whileTap={tapAnimation} whileHover={hoverScale} onClick={handleLogout} className="p-2 sm:p-2.5 rounded-full bg-red-500/20 backdrop-blur-md hover:bg-red-500/30 transition-all border border-red-400/30" title="Sign Out">
              <FaSignOutAlt className="text-sm sm:text-lg text-white" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Info Ticker */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 sm:px-4 py-2 sm:py-2.5 shadow-md">
        <div className="mx-auto w-full max-w-6xl flex items-center gap-2 sm:gap-3">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-black animate-pulse shrink-0" />
          <span className="font-bold text-xs sm:text-sm truncate">🎉 New payment options! Enjoy no-fee top-ups and instant card unlocking. Share meals with friends!</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activePage === "MyIgifu" && <MyIgifuPage key="home" />}
          {activePage === "Restoz" && <RestozPage key="restoz" showToast={showToast} onOrder={handleOrder} />}
          {activePage === "Earn" && <EarnPage key="earn" />}
          {activePage === "Loans" && <LoansPage key="loans" />}
          {activePage === "More" && <MorePage key="more" />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] border-t border-gray-200/50 dark:border-white/10 py-2 z-40">
        <div className="mx-auto w-full max-w-6xl flex justify-around">
          {[
            { n: "Restoz", i: <FaUtensils />, label: "Restaurants" },
            { n: "Earn", i: <FaGift />, label: "Rewards" },
              { n: "MyIgifu", i: <FaWallet />, label: "Card" },
            { n: "Loans", i: <FaMoneyBill />, label: "Loans" },
            { n: "More", i: <FaEllipsisH />, label: "More" }
          ].map(t => {
            const isActive = activePage === t.n;
            return (
              <motion.button key={t.n} onClick={() => setActivePage(t.n)} whileTap={tapAnimation} className={`flex flex-col items-center p-2 relative transition-all ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
                <motion.div animate={{ scale: isActive ? 1.1 : 1 }} className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{t.i}</motion.div>
                <span className="text-[9px] sm:text-[10px] font-bold">{t.label}</span>
                {isActive && <motion.div layoutId="nav_indicator" className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showAndroidPrompt && <AndroidPromptModal onDownload={handleDownloadApp} onContinue={handleContinueWeb} />}
        {showEnhancedPayment && <EnhancedPaymentModal defaultAmount={paymentDefaultAmount} onPay={handlePaymentComplete} onClose={() => { setShowEnhancedPayment(false); setPaymentProcessing(false); }} processing={paymentProcessing} setProcessing={setPaymentProcessing} activeWalletTab={activeWalletTab} />} {/* Pass activeWalletTab */}
        {showPaymentSuccess && <PaymentSuccessModal amount={lastPaymentAmount} walletType={lastPaymentWallet} onClose={handlePaymentSuccessClose} />}
        {showUnlockModal && <UnlockCardModal onSuccess={handleUpdateCardLockStatus} onCancel={handleUnlockCancel} />} {/* onCancel just closes the modal */}
        {showExchangeModal && <WalletExchangeModal wallets={wallets} onExchange={handleWalletExchange} onClose={() => setShowExchangeModal(false)} />}
        {showShareModal && selectedSharePlan && <ShareMealModal plan={selectedSharePlan} onShare={handleShareMeal} onClose={() => { setShowShareModal(false); setSelectedSharePlan(null); }} />}
        {showPlanDetails && selectedPlanDetails && <PlanDetailsModal plan={selectedPlanDetails} onClose={() => { setShowPlanDetails(false); setSelectedPlanDetails(null); }} onUseMeal={handleUseMeal} />}
        {selectedNotification && <NotificationDetailModal notification={selectedNotification} onClose={() => setSelectedNotification(null)} />}

        {/* Subscription Payment Modal */}
        {showOrderModal && selectedRestaurant && (
          <SubscriptionPaymentModal
            restaurant={selectedRestaurant}
            onClose={() => { setShowOrderModal(false); setSelectedRestaurant(null); }}
            onSuccess={handleSubscriptionSuccess}
            wallets={wallets}
          />
        )}
      </AnimatePresence>
      {/* Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ y: 100, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.9 }} className={`fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl font-bold text-white flex items-center gap-2 sm:gap-3 max-w-[90%] sm:max-w-md ${notification.tone === 'warn' ? 'bg-gradient-to-r from-red-500 to-red-600' : notification.tone === 'info' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
            <span className="text-base sm:text-lg">{notification.tone === 'warn' ? '⚠️' : notification.tone === 'info' ? 'ℹ️' : '✅'}</span>
            <span className="text-xs sm:text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}

export default IgifuDashboardMainApp;