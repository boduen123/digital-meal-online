import axios from "axios";

// ===============================
// 1. AXIOS INSTANCE CONFIG
// ===============================

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add the JWT token to every protected request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Assumes token is stored in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===============================
// 2. AUTH & USER SERVICES
// ===============================

export const authService = {
  /**
   * @param {object} userData - { name, email, password, role }
   */
  register: (userData) => api.post("/auth/register", userData),

  /**
   * @param {object} credentials - { email, password }
   */
  login: (credentials) => api.post("/auth/login", credentials),

  /**
   * Fetches the profile of the currently logged-in user.
   */
  getProfile: () => api.get("/users/profile"),
};

// ===============================
// 3. STUDENT-FACING SERVICES (Cards, Wallets, Plans)
// ===============================

export const studentService = {
  /**
   * Fetches all active meal cards and wallet balances for the logged-in student.
   */
  getMyCardsAndWallet: () => api.get("/cards/me"),

  /**
   * Subscribes a student to a new meal plan.
   * @param {string} planId - The ID of the meal plan.
   * @param {object} paymentDetails - { paymentMethod, amount_paid_cents }
   */
  subscribeToPlan: (planId, paymentDetails) =>
    api.post(`/plans/${planId}/subscribe`, paymentDetails),

  /**
   * Redeems a meal from a specific card (student-initiated).
   * @param {string} cardId - The ID of the meal card.
   */
  redeemMeal: (cardId) => api.post(`/cards/${cardId}/redeem`),
};

// ===============================
// 4. RESTAURANT SERVICES
// ===============================

export const restaurantService = {
  /**
   * Gets the public list of all restaurants.
   */
  getAllRestaurants: () => api.get("/restaurants"),

  /**
   * Gets the active, public meal plans for a specific restaurant.
   * @param {string} restaurantId - The ID of the restaurant.
   */
  getRestaurantPlans: (restaurantId) =>
    api.get(`/restaurants/${restaurantId}/plans`),

  /**
   * Fetches the profile for the currently logged-in restaurant owner.
   */
  getMyRestaurantProfile: () => api.get("/restaurants/me"),

  /**
   * Fetches all meal plans owned by the logged-in restaurant owner.
   */
  getMyPlans: () => api.get("/restaurants/me/plans"),

  /**
   * Creates a new meal plan for the logged-in restaurant owner.
   * @param {object} planData - { name, description, price_cents, total_meals, plan_type }
   */
  createPlan: (planData) => api.post("/restaurants/me/plans", planData),

  /**
   * Updates an existing meal plan.
   * @param {string} planId - The ID of the plan to update.
   * @param {object} planData - { name, description, price_cents, total_meals, plan_type, is_active }
   */
  updatePlan: (planId, planData) =>
    api.put(`/restaurants/me/plans/${planId}`, planData),

  /**
   * Searches for a student's active meal card by email, phone, or QR code.
   * @param {string} searchQuery - The student's identifier.
   */
  searchCard: (searchQuery) =>
    api.post("/restaurants/me/search-card", { searchQuery }),

  /**
   * Redeems a meal on behalf of a student.
   * @param {object} redeemData - { cardId, amount_cents }
   */
  redeemMealForStudent: (redeemData) =>
    api.post("/restaurants/me/redeem-meal", redeemData),
};

// ===============================
// 5. SUPER ADMIN SERVICES
// ===============================

export const adminService = {
  /**
   * Fetches a list of all restaurants for the admin dashboard.
   */
  getAllRestaurants: () => api.get("/admin/restaurants"),

  /**
   * Updates the status of a restaurant (e.g., 'approved', 'suspended').
   * @param {string} restaurantId - The ID of the restaurant.
   * @param {object} statusData - { status: 'new-status' }
   */
  updateRestaurantStatus: (restaurantId, statusData) =>
    api.put(`/admin/restaurants/${restaurantId}/status`, statusData),

  /**
   * Fetches all meal plans from all restaurants.
   */
  getAllPlans: () => api.get("/admin/plans"),

  /**
   * Updates the active status of a meal plan.
   * @param {string} planId - The ID of the meal plan.
   * @param {boolean} isActive - The new status.
   */
  updatePlanStatus: (planId, isActive) =>
    api.put(`/admin/plans/${planId}/status`, { is_active: isActive }),
};

/**
 * HOW TO USE IN A REACT COMPONENT:
 *
 * import { authService, studentService } from './services/apiService';
 *
 * // Example: Login a user
 * const handleLogin = async (email, password) => {
 *   try {
 *     const response = await authService.login({ email, password });
 *     console.log('Login successful:', response.data);
 *     localStorage.setItem('token', response.data.token); // Save token
 *     // Redirect user or update state
 *   } catch (error) {
 *     console.error('Login failed:', error.response?.data?.message || error.message);
 *   }
 * };
 *
 * // Example: Fetch student data after login
 * const fetchStudentData = async () => {
 *   try {
 *     const response = await studentService.getMyCardsAndWallet();
 *     console.log('My cards:', response.data.plans);
 *     // Set state with response.data
 *   } catch (error) {
 *     console.error('Failed to fetch data:', error.response?.data?.message || error.message);
 *   }
 * }
 */