const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery'); // Adjust path if necessary

// POST /api/deliveries - Create a new delivery
router.post('/', async (req, res) => {
  try {
    const { deliveryId, orderId, customer, address, scheduledDate, assignedTo, status } = req.body;

    if (!deliveryId || !orderId || !customer || !assignedTo || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingDelivery = await Delivery.findOne({ deliveryId });
    if (existingDelivery) {
      return res.status(409).json({ message: 'Delivery ID already exists' });
    }

    const delivery = new Delivery({
      deliveryId,
      orderId,
      customer,
      address: address || 'Not provided',
      scheduledDate,
      assignedTo,
      status,
    });

    const savedDelivery = await delivery.save();
    res.status(201).json(savedDelivery);
  } catch (err) {
    console.error('Error creating delivery:', err);
    res.status(500).json({ message: 'Failed to create delivery: ' + err.message });
  }
});

// PUT /api/deliveries/:deliveryId/assign - Update delivery assignment or status
router.put('/:deliveryId/assign', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { driverId, status } = req.body;

    if (!deliveryId) {
      return res.status(400).json({ message: 'Delivery ID is required' });
    }

    const updates = {};
    if (driverId) updates.assignedTo = driverId;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const updatedDelivery = await Delivery.findOneAndUpdate(
      { deliveryId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(updatedDelivery);
  } catch (err) {
    console.error('Error updating delivery:', err);
    res.status(500).json({ message: 'Failed to update delivery: ' + err.message });
  }
});

// GET /api/deliveries - Fetch all deliveries
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ message: 'Failed to fetch deliveries: ' + err.message });
  }
});

// DELETE /api/deliveries/:deliveryId - Delete a delivery
router.delete('/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const deletedDelivery = await Delivery.findOneAndDelete({ deliveryId });
    if (!deletedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).json({ message: 'Failed to delete delivery: ' + err.message });
  }
});

module.exports = router;