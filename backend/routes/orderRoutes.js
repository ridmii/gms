import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../models/Order.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration
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
}).fields([
  { name: 'artworkImage', maxCount: 1 }
]);

router.post('/', (req, res, next) => {
  console.log('POST /api/orders with headers:', req.headers['content-type']);
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    upload(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ error: err.message });
      }
      console.log(`Incoming POST request to /api/orders with body:`, req.body); // Log body
      console.log(`Files received:`, req.files); // Log files
      createOrder(req, res);
    });
  } else {
    console.log(`Incoming POST request to /api/orders with body:`, req.body); // Log for JSON
    createOrder(req, res);
  }
});

// POST to create new order
router.post('/', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order', message: err.message });
  }
});

async function createOrder(req, res) {
  try {
    // Explicitly access form fields from req.body
    const { name, email, mobile, address, material, quantity, artwork, artworkText, priceDetails } = req.body;
    console.log('Parsed request body:', { name, email, mobile, address, material, quantity, artwork, artworkText, priceDetails }); // Debug all fields

    // Validate all required fields
    if (!name || !email || !mobile || !address || !material || !quantity) {
      console.error('Missing required fields:', { name, email, mobile, address, material, quantity });
      return res.status(400).json({ error: 'All required fields must be filled: name, email, mobile, address, material, quantity' });
    }

    // Parse and validate priceDetails
    const parsedPriceDetails = typeof priceDetails === 'string' ? JSON.parse(priceDetails) : priceDetails || {};
    const unitPrice = parsedPriceDetails.unitPrice || (parseInt(quantity) > 30 ? 1500 : 2000);
    const artworkFee = parsedPriceDetails.artworkFee || (artwork === 'true' ? 5000 : 0);
    const subtotal = parsedPriceDetails.subtotal || parseInt(quantity) * unitPrice;
    const total = parsedPriceDetails.total || subtotal + artworkFee;
    const advance = parsedPriceDetails.advance || Math.round(total * 0.5);
    const balance = parsedPriceDetails.balance || total - advance;

    const orderData = {
      name,
      email,
      mobile,
      address: address || '', // Ensure address is included, fallback to empty if undefined
      material,
      quantity: parseInt(quantity),
      artwork: artwork === 'true',
      artworkText: artworkText || '',
      artworkImage: req.files?.artworkImage ? `/uploads/${req.files.artworkImage[0].filename}` : '',
      priceDetails: {
        unitPrice,
        subtotal,
        artworkFee,
        total,
        advance,
        balance
      },
      date: new Date(),
    };

  const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    console.log('Order saved successfully:', savedOrder);

    // Trigger delivery creation
    const { initializeDeliveries } = await import('../server.js'); // Dynamic import
    await initializeDeliveries();

    res.status(201).json({
      success: true,
      message: 'Order saved successfully!',
      order: savedOrder,
    });
  } catch (error) {
    console.error('Error saving order:', error.message, error.stack);
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

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order', message: err.message });
  }
});

export default router;