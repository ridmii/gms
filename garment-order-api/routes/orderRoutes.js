import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// POST: Create new order
router.post('/', async (req, res) => {
    try {
        console.log("Received data:", req.body, "File:", req.file); // Debug log

        if (!req.body) {
            return res.status(400).json({ error: "Request body is empty" });
        }

        const { name, email, mobile, material, quantity, artwork, artworkText, priceDetails } = req.body;

        if (!name || !email || !mobile) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newOrder = new Order({
            name,
            email,
            mobile,
            material: material || '',
            quantity: Number(quantity) || 1,
            artwork: artwork === 'true', // FormData sends boolean as string
            artworkText: artworkText || '',
            artworkImage: req.file ? req.file.path : '', // Store file path
            priceDetails: priceDetails ? JSON.parse(priceDetails) : { unitPrice: 2000, total: 2000 }
        });

        await newOrder.save();
        res.status(201).json({
            success: true,
            message: 'Order saved successfully!',
            order: newOrder
        });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET: View all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;