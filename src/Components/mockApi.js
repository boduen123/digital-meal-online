// ==================== MOCK DATA & SERVICES ====================

const generateMockRestaurants = () => {
    const statuses = ['Pending', 'Approved', 'Rejected', 'Suspended'];
    const categories = ['Buffet', 'Fast Food', 'Local Restaurant', 'School Canteen', 'Hotel'];
    const names = ['Campus Bites', 'The Scholar\'s Plate', 'Student Hub Eatery', 'Remera Foodies', 'Huye Heights Dining'];
    
    return Array.from({ length: 12 }, (_, i) => ({
      id: `REST-${Date.now() + i}`,
      name: names[i % names.length],
      owner: `Owner ${i + 1}`,
      email: `owner${i+1}@restaurant.com`,
      phone: `078812345${i}`,
      location: { province: 'South', district: 'Huye', sector: 'Ngoma' },
      category: categories[i % categories.length],
      meals: ['Lunch', 'Dinner'],
      priceRange: '1500 - 3000 RWF',
      hours: '8:00 AM - 9:00 PM',
      logo: `https://picsum.photos/seed/${i+1}/200`,
      description: 'A great place for students to eat, study, and relax.',
      status: i < 2 ? 'Pending' : statuses[Math.floor(Math.random() * statuses.length)],
      registeredAt: Date.now() - Math.floor(Math.random() * 86400000 * 30),
    }));
  };
  
  export const restaurantService = {
    getRestaurants: () => {
      try {
        const data = localStorage.getItem('partnerRestaurants');
        if (!data) {
          const mockData = generateMockRestaurants();
          localStorage.setItem('partnerRestaurants', JSON.stringify(mockData));
          return mockData;
        }
        return JSON.parse(data);
      } catch (error) {
        console.error("Failed to parse restaurants from localStorage", error);
        return [];
      }
    },
    saveRestaurants: (restaurants) => {
      localStorage.setItem('partnerRestaurants', JSON.stringify(restaurants));
    },
    addRestaurant: (application) => {
      const restaurants = restaurantService.getRestaurants();
      const newRestaurant = {
        ...application,
        id: `REST-${Date.now()}`,
        status: 'Pending',
        registeredAt: Date.now(),
        logo: `https://picsum.photos/seed/${Date.now()}/200`, // Assign a mock logo
      };
      const updatedRestaurants = [newRestaurant, ...restaurants];
      restaurantService.saveRestaurants(updatedRestaurants);
      return newRestaurant;
    },
    updateRestaurant: (updatedRestaurant) => {
      let restaurants = restaurantService.getRestaurants();
      restaurants = restaurants.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r);
      restaurantService.saveRestaurants(restaurants);
      return restaurants;
    }
  };