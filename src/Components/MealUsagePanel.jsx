import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaSpinner, FaUserSlash, FaCheckCircle, FaUtensils } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

// ==================== AXIOS CONFIG ====================
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Re-importing MealPlanCard locally as it was removed from its own file
import { MealPlanCard } from './DigitalMealCard';

const pageMotion = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const tapAnimation = { scale: 0.95 };

const MealUsagePanel = ({ onMealUsed }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundSubscriber, setFoundSubscriber] = useState(null);
    const [error, setError] = useState('');
    const [mealUsed, setMealUsed] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;

        setLoading(true);
        setFoundSubscriber(null);
        setError('');
        setMealUsed(false);

        try {
            const response = await api.post('/restaurant/subscribers/search', { searchQuery });
            setFoundSubscriber(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleUseMealClick = async () => {
        if (!foundSubscriber) return;

        try {
            await api.post('/restaurant/subscribers/use-meal', { subscriptionId: foundSubscriber.id });
            setMealUsed(true);
            toast.success('Meal successfully recorded!');
            
            // Update local state for immediate feedback
            setFoundSubscriber(prev => ({ ...prev, used_plates: prev.used_plates + 1 }));

            // Notify parent to refetch all data
            if (onMealUsed) {
                onMealUsed();
            }

            setTimeout(() => {
                setMealUsed(false);
                setFoundSubscriber(null);
                setSearchQuery('');
            }, 2500);

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record meal usage.');
        }
    };

    return (
        <motion.div {...pageMotion} className="max-w-2xl mx-auto">
            <div className="bg-[#0f172a] rounded-2xl p-6 border border-[#1e293b] mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Meal Usage</h1>
                <p className="text-gray-400 mb-4">Search for a student by ID or Phone to record meal usage.</p>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter Student ID or Phone..."
                            className="w-full bg-[#1e293b] text-white rounded-xl px-4 py-3 pl-11 border border-[#334155] focus:border-orange-500 focus:outline-none"
                        />
                    </div>
                    <motion.button
                        whileTap={tapAnimation}
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <FaSpinner className="animate-spin" /> : 'Find'}
                    </motion.button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {foundSubscriber && (
                    <motion.div key="found" {...pageMotion}>
                        {/* This component is not designed for this view, but we adapt it */}
                        <div className="bg-[#0f172a] rounded-2xl p-6 border border-[#1e293b] mb-6 text-white">
                            <h3 className="text-lg font-bold">{foundSubscriber.student_name}</h3>
                            <p className="text-sm text-gray-400">{foundSubscriber.plan_name}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <p>Plates Remaining:</p>
                                <p className="text-2xl font-bold text-blue-400">
                                    {foundSubscriber.total_plates - foundSubscriber.used_plates}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={tapAnimation}
                            onClick={handleUseMealClick}
                            disabled={mealUsed || (foundSubscriber.total_plates - foundSubscriber.used_plates <= 0)}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {mealUsed ? <><FaCheckCircle /> Meal Used!</> : <><FaUtensils /> USE MEAL</>}
                        </motion.button>
                    </motion.div>
                )}

                {error && !foundSubscriber && (
                    <motion.div key="not-found" {...pageMotion} className="text-center py-12 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                        <FaUserSlash className="text-5xl text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-300 mb-2">Student Not Found</h3>
                        <p className="text-gray-500">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MealUsagePanel;