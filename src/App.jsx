import { Routes, Route } from 'react-router-dom';
import './App.css';
import IgifuDashboardMainApp from './Components/DigitalMealCard';
import Home from './Components/Home';
import RestaurantPortal from './Components/RestaurantPortal';
import SuperAdminPortal from './Components/SuperAdminPortal';
import SignUpPage from './Components/Login'; // Corrected import

const App = () => {
  return (
    <Routes>
      {/* Route for the Home/Landing Page */}
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<SignUpPage />} />
      {/* Student Dashboard */}
      <Route path="/igifu-dashboard" element={<IgifuDashboardMainApp />} />
      
      {/* Restaurant Portal */}
      <Route path="/restaurant" element={<RestaurantPortal />} />

      {/* Super Admin Portal */}
      <Route path="/super-admin-portal" element={<SuperAdminPortal />} />
    </Routes>
  );
};

export default App;
