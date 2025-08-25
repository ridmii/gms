import express from 'express';
import Delivery from '../models/Delivery.js';

const router = express.Router();

// Get all deliveries
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deliveries', message: err.message });
  }
});

// Create a new delivery (e.g., from pending orders)
router.post('/', async (req, res) => {
  try {
    const { orderId, customerName, address, assignedTo, status } = req.body;
    if (!orderId || !customerName || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const delivery = new Delivery({ 
      deliveryId: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
      orderId, 
      customerName, 
      address, 
      assignedTo: assignedTo || '', 
      status: status || 'Pending' 
    });
    const savedDelivery = await delivery.save();
    res.status(201).json(savedDelivery);
  } catch (err) {
    console.error('Delivery creation error:', err);
    res.status(500).json({ error: 'Failed to create delivery', message: err.message });
  }
});

// Update delivery status
router.put('/:id', async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, { status, assignedTo }, { new: true, runValidators: true });
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update delivery', message: err.message });
  }
});

export default router;