const db = require('../config/db'); // Assuming you have a db connection utility

exports.getAllRestaurants = async (req, res) => {
  try {
    const [restaurants] = await db.query('SELECT * FROM restaurants ORDER BY created_at DESC');
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRestaurantDetails = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    campus,
    location_sector,
    location_district,
    category,
    logo_url,
    image_url,
    walk_time,
    contact_phone,
    contact_email
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE restaurants SET 
        name = ?, description = ?, campus = ?, location_sector = ?, location_district = ?, 
        category = ?, logo_url = ?, image_url = ?, walk_time = ?, contact_phone = ?, contact_email = ?
      WHERE id = ?`,
      [
        name, description, campus, location_sector, location_district,
        category, logo_url, image_url, walk_time, contact_phone, contact_email,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant details updated successfully' });
  } catch (error) {
    console.error('Error updating restaurant details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRestaurantStatus = async (req, res) => {
  // This function is called by the frontend but was not implemented yet.
  // You can add the logic here. For example:
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE restaurants SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Restaurant status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};