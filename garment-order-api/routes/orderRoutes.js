import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../models/Order.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/postscript', 'image/eps'];
    if (!file) {
      cb(null, true);
    } else if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, PDF, AI, EPS'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('artworkImage');

router.post('/', (req, res, next) => {
  console.log('POST /api/orders with headers:', req.headers['content-type']);
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    upload(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ error: err.message });
      }
      console.log(`Incoming POST request to /api/orders with body:`, req.body); // Log after multer
      createOrder(req, res);
    });
  } else {
    console.log(`Incoming POST request to /api/orders with body:`, req.body); // Log for JSON
    createOrder(req, res);
  }
});

async function createOrder(req, res) {
  try {
    console.log('Received data:', req.body, 'File:', req.file);
    const { name, email, mobile, material, quantity, artwork, artworkText, priceDetails } = req.body;

    if (!name || !email || !material || !quantity) {
      console.error('Missing required fields:', { name, email, material, quantity });
      return res.status(400).json({ error: 'Missing required fields: name, email, material, quantity' });
    }

    const orderData = {
      name,
      email,
      mobile: mobile || '',
      material: material || '',
      quantity: Number(quantity) || 1,
      artwork: artwork === 'true' || artwork === true,
      artworkText: artworkText || '',
      artworkImage: req.file ? `/uploads/${req.file.filename}` : '',
      priceDetails: priceDetails ? JSON.parse(typeof priceDetails === 'string' ? priceDetails : JSON.stringify(priceDetails)) : { unitPrice: 2000, total: 2000 },
      date: new Date(),
    };

    const newOrder = new Order(orderData);
    await newOrder.save();
    res.status(201).json({
      success: true,
      message: 'Order saved successfully!',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error saving order:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save order',
    });
  }
}

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
