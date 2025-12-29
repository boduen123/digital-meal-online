import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendar, FaCheck, FaUtensils, FaShare, FaInfoCircle } from 'react-icons/fa';
import { tapAnimation } from './Animations';
import { formatAmount } from '../utils/helpers';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const MealPlanCard = ({ plan, studentId, restaurantId }) => {
  const [usedMeals, setUsedMeals] = useState(plan.usedMeals || []);

  const totalMeals = plan.totalMeals;
  const usedCount = usedMeals.length;
  const remaining = totalMeals - usedCount;
  const progress = (usedCount / totalMeals) * 100;

  // Fetch latest plan details
  const fetchPlanDetails = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/meal-plans/details/${plan.id}`);
      setUsedMeals(data.usedMeals || []);
    } catch (err) {
      console.error('Failed to fetch plan details', err);
    }
  };

  // Use a meal
  const handleUseMeal = async (mealIndex) => {
    try {
      await axios.post(`${API_URL}/meal-plans/use`, {
        studentId,
        subscriptionId: plan.id,
        mealIndex,
        restaurantId,
      });
      // Refresh used meals
      fetchPlanDetails();
    } catch (err) {
      console.error('Failed to use meal', err);
    }
  };

  // Share plan
  const handleShare = (plan) => {
    console.log('Share plan:', plan);
  };

  // View details
  const handleViewDetails = () => {
    console.log('Plan details:', plan);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-white font-bold text-base sm:text-lg mb-1 line-clamp-1">
              {plan.restaurantName}
            </h3>
            <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
              <FaCalendar className="text-xs" />
              <span>{plan.planType} Plan</span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="text-white font-bold text-xs sm:text-sm">{remaining}/{totalMeals}</span>
          </div>
        </div>

        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-400 to-green-300"
          />
        </div>
        <div className="text-white/70 text-xs mt-1">
          {usedCount} meals used • {remaining} remaining
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-10 gap-2 mb-4">
          {Array.from({ length: totalMeals }).map((_, index) => {
            const isUsed = usedMeals.includes(index);
            return (
              <motion.button
                key={index}
                whileHover={{ scale: isUsed ? 1 : 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => !isUsed && handleUseMeal(index)}
                className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all ${isUsed
                  ? 'bg-green-500 text-white shadow-md cursor-default'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600'
                  }`}
                disabled={isUsed}
                title={isUsed ? `Meal ${index + 1} - Used` : `Meal ${index + 1} - Available`}
              >
                {isUsed ? <FaCheck className="text-sm sm:text-base" /> : <FaUtensils className="text-xs sm:text-sm" />}
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={tapAnimation}
            onClick={() => handleShare(plan)}
            className="flex-1 py-2.5 sm:py-3 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            <FaShare /> Share
          </motion.button>
          <motion.button
            whileTap={tapAnimation}
            onClick={handleViewDetails}
            className="flex-1 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            <FaInfoCircle /> Details
          </motion.button>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 px-4 sm:px-6 py-3 flex justify-between items-center text-xs sm:text-sm">
        <div className="text-gray-600 dark:text-gray-400">
          Expires: {new Date(plan.expiryDate).toLocaleDateString()}
        </div>
        <div className="font-bold text-gray-900 dark:text-white">
          RWF {formatAmount(plan.price)}
        </div>
      </div>
    </motion.div>
  );
};

export default MealPlanCard;
