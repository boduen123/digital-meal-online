import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

// ==================== AXIOS CONFIG ====================
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});


// Icon Renderer Function - MOVED OUTSIDE of the component for performance
const renderIcon = (iconType) => {
  const iconProps = {
    className: 'w-6 h-6 text-white',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
  };

  switch (iconType) {
    case 'card':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'close':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'gift':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    default:
      return <svg {...iconProps} />;
  }
};

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // FIX: Changed initial state from 0 to null so no FAQ is open on load for better UX.
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    mealsServed: '12,400+',
    activeStudents: '3,200+',
    partneredRestaurants: '28',
  });
  const navigate = useNavigate();

  // Loading animation
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/public/stats');
        setStats({
          mealsServed: `${response.data.totalMealsServed.toLocaleString()}+`,
          activeStudents: `${response.data.activeStudents.toLocaleString()}+`,
          partneredRestaurants: response.data.totalRestaurants.toLocaleString(),
        });
      } catch (error) {
        console.error("Could not fetch public stats", error);
      }
    };

    fetchStats();
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Navigation Links
  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Reviews', href: '#reviews' },
  ];

  // Features Data
  const features = [
    {
      id: 1,
      title: 'Hassleless Payment',
      description: 'Pay using Mobile Money or Bank Transfer inside the app wherever you are!',
      icon: 'card',
      gradient: 'from-orange-500 to-yellow-500',
    },
    {
      id: 2,
      title: 'No Paper Cards',
      description: 'Forget Igifu Paper Cards prone to theft and being lost! Here is the change.',
      icon: 'close',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      id: 3,
      title: 'Pay What\'s Consumed!',
      description: 'Flexi Wallet in your card enables payment of undiscounted goods at the actual price.',
      icon: 'settings',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      id: 4,
      title: 'Bank Level Security',
      description: 'Your money is protected with military-grade encryption and fraud detection.',
      icon: 'shield',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      id: 5,
      title: 'Pay with Confidence!',
      description: 'Up-to-date, clear & detailed info on restaurants helps choose your favorites ones. No hidden fees!',
      icon: 'check',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      id: 6,
      title: 'Share Meals',
      description: 'Gift meals to friends with one tap. Spread the love and help each other out.',
      icon: 'gift',
      gradient: 'from-purple-500 to-pink-500',
      badge: 'Coming Soon',
    },
  ];

  // How It Works Steps
  const steps = [
    { step: '1', title: 'Download App', desc: 'Get the Igifu app from your app store' },
    { step: '2', title: 'Sign Up', desc: 'Register using your student email' },
    { step: '3', title: 'Load Wallet', desc: 'Top up via Mobile Money or Bank Transfer' },
    { step: '4', title: 'Start Dining', desc: 'Use your card at partner restaurants' },
  ];

  // Testimonials Data
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Mutoni',
      role: 'Year 2, Computer Science',
      text: 'Igifu made dining on campus so much easier. No more carrying cash or losing cards!',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      rating: 5,
    },
    {
      id: 2,
      name: 'Jean Paul',
      role: 'Year 3, Business',
      text: 'The instant card activation was a game changer. Started using it the same day!',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
      rating: 5,
    },
    {
      id: 3,
      name: 'Grace Uwase',
      role: 'Year 1, Engineering',
      text: 'Love how simple and secure it is. My friends and I use it every single day.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace',
      rating: 5,
    },
  ];

  // FAQ Data
  const faqItems = [
    {
      question: 'How do I get started with Igifu?',
      answer: 'Simply download the app, sign up with your student email, complete verification, and get your digital card instantly. No paperwork needed!',
    },
    {
      question: 'Is there a fee to create an account?',
      answer: 'Nope! Creating an account and getting your digital card is completely free. We only charge a small transaction fee when you top up your wallet.',
    },
    {
      question: 'What if I lose my phone?',
      answer: 'Your card is secured on our servers. Just log into the app on a new device and your balance will be there. We recommend enabling two-factor authentication for extra security.',
    },
    {
      question: 'Which restaurants accept Igifu?',
      answer: 'We partner with 28+ restaurants on campus. Check the app to see all participating locations and their menus.',
    },
  ];

  // Theme Colors
  const textColor = isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const bgColor = isDarkMode ? 'bg-[#1a2332]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700/50' : 'border-gray-200';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50' : 'bg-gradient-to-br from-gray-100 to-gray-200';
  const featureCardBg = isDarkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/50 hover:border-gray-600/50' : 'bg-white border-gray-200 hover:border-gray-400';
  const bgSection = isDarkMode ? 'bg-gradient-to-b from-transparent to-gray-900/20' : 'bg-gray-50';

  // Loading Screen
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-[#0f1621] via-[#1a2332] to-[#0f1621] flex items-center justify-center z-50"
      >
        <div className="text-center">
          {/* Animated Logo */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6"
          >
            <span className="text-5xl font-bold text-white relative inline-block">
              Igif
              <span className="relative inline-block">
                u
                {/* Animated WiFi waves */}
                <motion.svg 
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-10 h-6" 
                  viewBox="0 0 24 16" 
                  fill="none"
                >
                  <motion.path 
                    d="M6 6 A8 8 0 0 1 18 6" 
                    stroke="#FBBF24" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    fill="none"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  />
                  <motion.path 
                    d="M8 9 A5 5 0 0 1 16 9" 
                    stroke="#FBBF24" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    fill="none"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.path 
                    d="M10 12 A2.5 2.5 0 0 1 14 12" 
                    stroke="#FBBF24" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    fill="none"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                </motion.svg>
              </span>
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-400 text-lg mb-6"
          >
            Redefining Campus Dining
          </motion.p>

          {/* Loading dots */}
          <motion.div className="flex space-x-2 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`${isDarkMode ? 'bg-gradient-to-br from-[#0f1621] via-[#1a2332] to-[#0f1621] text-white' : 'bg-white text-gray-900'} min-h-screen transition-colors duration-300`}
    >
      {/* ==================== HEADER ==================== */}
      <header className={`border-b ${borderColor} sticky top-0 z-50 backdrop-blur-md ${isDarkMode ? '' : 'bg-white/95'}`}>
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold text-white relative">
              Igif
              <span className="relative inline-block">
                u
                {/* WiFi / Radio Wave Arcs above "u" */}
                <svg className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-6 h-4" viewBox="0 0 24 16" fill="none">
                  <path d="M6 6 A8 8 0 0 1 18 6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <path d="M8 9 A5 5 0 0 1 16 9" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <path d="M10 12 A2.5 2.5 0 0 1 14 12" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`${textColor} transition`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-yellow-600'}`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className={`${textColor} transition`}>
                Log In
              </Link>
              <Link to="/signup" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={`md:hidden border-t ${borderColor} ${bgColor} p-4`}>
            <div className="space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block py-2 hover:text-orange-500 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to="/login" className={`w-full py-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} block text-center`}>
                Log In
              </Link>
              <Link to="/signup" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition block text-center">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        {/* Announcement Banner */}
        <div className="flex items-center space-x-2 mb-8 justify-center">
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          <span className="text-orange-500 font-medium text-center">
            <span className="font-bold">New:</span> Instant card activation (With 0 fees!)
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Redefining Campus <br />
              <span className={textSecondary}>Dining Life</span>
            </h1>

            <p className={`${textSecondary} text-lg mb-8 max-w-lg`}>
              Skip the lines & No more lost Igifu cards! Just fast, secure & cashless payments for every restaurant subscription
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link to="/signup" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:opacity-90 transition flex items-center space-x-2 shadow-lg">
                <span>Get your Free Card</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/login" className={`border ${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-400 hover:border-gray-600'} px-8 py-3 rounded-lg transition`}>
                Log In
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                {[
                  'from-blue-400 to-purple-500',
                  'from-orange-400 to-pink-500',
                  'from-green-400 to-cyan-500',
                  'from-yellow-400 to-orange-500',
                ].map((gradient, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} border-2 ${isDarkMode ? 'border-gray-800' : 'border-white'}`}
                  />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold">3,200+ students</p>
                <p className={textSecondary}>waiting room daily</p>
              </div>
            </div>
          </div>

          {/* Right Content - Card Display */}
          <div className="relative group">
            <div className={`${cardBg} backdrop-blur-lg rounded-3xl p-8 border shadow-xl transition transform group-hover:scale-105 ${borderColor}`}>
              <div className="flex justify-between items-start mb-8">
                {/* Igifu Logo on Card */}
                <span className="text-xl font-bold text-white relative">
                  Igif
                  <span className="relative inline-block">
                    u
                    <svg className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 h-3" viewBox="0 0 24 16" fill="none">
                      <path d="M6 6 A8 8 0 0 1 18 6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M8 9 A5 5 0 0 1 16 9" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M10 12 A2.5 2.5 0 0 1 14 12" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                  </span>
                </span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-orange-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className={`${textSecondary} text-sm mb-1`}>Available balance</p>
                  <p className="text-4xl font-bold">RWF 100,000</p>
                </div>

                <div>
                  <p className={`${textSecondary} text-sm mb-1`}>Cardholder</p>
                  <p className="text-xl font-semibold">CoolGuy</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link to="/signup" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:opacity-90 transition text-center">
                    Get this Card for free
                  </Link>
                  <Link to="/login" className={`border ${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-400 hover:border-gray-600'} px-6 py-3 rounded-lg transition`}>
                    Log In
                  </Link>
                </div>
              </div>

              <div className={`absolute -top-4 -right-4 ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600' : 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500'} text-white px-4 py-2 rounded-full text-sm font-semibold border`}>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`grid md:grid-cols-3 gap-8 mt-20 pt-12 border-t ${borderColor}`}>
            <div className="text-center hover:scale-105 transition">
              <p className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {stats.mealsServed}
              </p>
              <p className={textSecondary}>Meals served</p>
            </div>
            <div className="text-center hover:scale-105 transition">
              <p className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {stats.activeStudents}
              </p>
              <p className={textSecondary}>Active students</p>
            </div>
            <div className="text-center hover:scale-105 transition">
              <p className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {stats.partneredRestaurants}
              </p>
              <p className={textSecondary}>Partnered restaurants</p>
            </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" className={`${bgSection} container mx-auto px-4 py-20`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Everything You Need</h2>
          <p className={`${textSecondary} text-lg`}>
            Designed for students, by students. Simple, fast, and secure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`${featureCardBg} backdrop-blur-lg rounded-2xl p-6 border transition hover:shadow-xl transform hover:scale-105 relative`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                {/* renderIcon is now defined outside and correctly callable */}
                {renderIcon(feature.icon)}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className={`${textSecondary} text-sm`}>{feature.description}</p>

              {feature.badge && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {feature.badge}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== HOW IT WORKS SECTION ==================== */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">How It Works</h2>
          <p className={`${textSecondary} text-lg`}>
            Get started in just 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((item, idx) => (
            <div key={idx} className="relative">
              <div className={`${isDarkMode ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-600/50' : 'bg-blue-50 border-blue-200'} border rounded-2xl p-6 text-center relative z-10`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className={`text-sm ${textSecondary}`}>{item.desc}</p>
              </div>
              {idx < 3 && (
                <div className={`hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 text-2xl ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TESTIMONIALS SECTION ==================== */}
      <section id="reviews" className={`${bgSection} container mx-auto px-4 py-20`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">What Students Say</h2>
          <p className={`${textSecondary} text-lg`}>
            Join thousands of happy students using Igifu daily
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`${isDarkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl p-6 backdrop-blur-lg transition hover:shadow-xl`}
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className={`text-sm ${textSecondary}`}>{testimonial.role}</p>
                </div>
              </div>
              <div className="mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{testimonial.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className={`${textSecondary} text-lg`}>
            Have questions? We've got answers
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className={`${isDarkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-gray-50 border-gray-200'} border rounded-lg p-6 cursor-pointer transition hover:shadow-lg`}
            >
              <button
                className="w-full font-bold flex justify-between items-center"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              >
                {item.question}
                {/* This transition will apply when state changes from null to index or vice-versa */}
                <span className={`transition-transform ${openFaqIndex === idx ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaqIndex === idx && (
                <p className={`mt-4 ${textSecondary}`}>{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20' : 'bg-gradient-to-r from-purple-100 to-blue-100'} container mx-auto px-4 py-20 rounded-3xl my-20`}>
        <div className="text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Dining Experience?
          </h2>
          <p className={`${textSecondary} text-lg mb-8 max-w-2xl mx-auto`}>
            Join thousands of students who are already enjoying fast, secure, and hassle-free dining payments.
          </p>
          <Link to="/signup" className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg hover:opacity-90 transition font-bold text-lg shadow-lg hover:scale-105">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className={`${isDarkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100 border-gray-200'} border-t`}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="mb-4">
                <span className="font-bold text-white relative text-lg">
                  Igif
                  <span className="relative inline-block">
                    u
                    <svg className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 h-3" viewBox="0 0 24 16" fill="none">
                      <path d="M6 6 A8 8 0 0 1 18 6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M8 9 A5 5 0 0 1 16 9" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M10 12 A2.5 2.5 0 0 1 14 12" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                  </span>
                </span>
              </div>
              <p className={`text-sm ${textSecondary}`}>
                Making campus dining better, one transaction at a time.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="font-bold mb-4">Product</p>
              <ul className={`space-y-2 text-sm ${textSecondary}`}>
                {['Features', 'Pricing', 'Security'].map((link) => (
                  <li key={link}>
                    <a href="#" className={`${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition`}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="font-bold mb-4">Company</p>
              <ul className={`space-y-2 text-sm ${textSecondary}`}>
                {['About', 'Blog', 'Careers'].map((link) => (
                  <li key={link}>
                    <a href="#" className={`${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition`}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <p className="font-bold mb-4">Follow Us</p>
              <div className="flex gap-4">
                {['Twitter', 'Instagram', 'Facebook'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className={`text-sm ${textSecondary} transition`}
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className={`text-center pt-8 border-t ${borderColor} ${textSecondary} text-sm`}>
            <p>&copy; {new Date().getFullYear()} Igifu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default Home;