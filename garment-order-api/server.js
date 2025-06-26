import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import orderRoutes from './routes/orderRoutes.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import Order from './models/Order.js';
import fastCsv from 'fast-csv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || '893a5fd0c3de8d1ec5355d64273f913afef53b1b5e9213d91d82fe286f69941a';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dimalsha.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '$2a$10$KX9b1z3X8qY6Z7W8V9U0O.tY2Z3X4qY5Z6W7V8U9O0P1Q2R3S4T5';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to authenticate admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token', message: err.message });
  }
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random * 1e9);
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

// Express middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('Uploads'));

// Routes
app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

app.use('/api/orders', orderRoutes);

// Admin invoice endpoint
app.get('/api/orders/:id/invoice', authenticateAdmin, async (req, res) => {
  try {
    console.log(`Generating admin invoice for order ID: ${req.params.id}`);
    await generateInvoice(req, res);
  } catch (error) {
    console.error('Error generating admin invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

// Public invoice endpoint
app.get('/api/orders/:id/invoice/public', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    console.log(`Generating public invoice for order ID: ${id}, email: ${email}`);
    
    if (!email) {
      console.error('Email not provided for public invoice');
      return res.status(400).json({ error: 'Email is required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      console.error(`Order not found for ID: ${id}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.email !== email) {
      console.error(`Unauthorized email for order ID: ${id}, provided: ${email}, expected: ${order.email}`);
      return res.status(401).json({ error: 'Unauthorized: Email does not match order' });
    }

    await generateInvoice(req, res);
  } catch (error) {
    console.error('Error generating public invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

// Invoice generation function
async function generateInvoice(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) {
    console.error(`Order not found for ID: ${req.params.id}`);
    return res.status(404).json({ error: 'Order not found' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const pdfFile = path.join(tempDir, `invoice-${order._id}.pdf`);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const priceDetails = typeof order.priceDetails === 'string' ? JSON.parse(order.priceDetails) : order.priceDetails || {};
  const submissionDate = new Date(order.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(pdfFile);
  doc.pipe(stream);

  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text('Dimalsha Fashions', { align: 'center' });
  doc.text('159/37,Pamunuwa Garden,Pamunuwila,Gonewela(W.P)', { align: 'center' });
  doc.text('Phone: +94 71 260 0228 | Email: mihiripennaramani@gmail.com', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(12).text(`Invoice Number: ${order._id.toString().slice(-8)}`, { align: 'left' });
  doc.text(`Date: ${submissionDate}`, { align: 'left' });
  doc.moveDown(0.5);

  doc.text('Billed To:', { underline: true });
  doc.text(order.name || 'N/A');
  doc.text(order.email || 'N/A');
  doc.text(order.mobile || 'N/A');
  doc.moveDown(1);

  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidths = [150, 150, 100, 100];
  const rowHeight = 20;

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Description', tableLeft, tableTop);
  doc.text('Details', tableLeft + colWidths[0], tableTop);
  doc.text('Quantity', tableLeft + colWidths[0] + colWidths[1], tableTop);
  doc.text('Amount (Rs.)', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
  doc.moveDown(0.5);

  doc.font('Helvetica');
  let currentY = tableTop + rowHeight;
  doc.text('Material', tableLeft, currentY);
  doc.text(order.material || 'N/A', tableLeft + colWidths[0], currentY);
  doc.text(order.quantity.toString(), tableLeft + colWidths[0] + colWidths[1], currentY);
  doc.text((priceDetails.unitPrice || 0).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
  currentY += rowHeight;

  doc.text('Artwork Design', tableLeft, currentY);
  doc.text(order.artwork ? 'Yes' : 'No', tableLeft + colWidths[0], currentY);
  doc.text('-', tableLeft + colWidths[0] + colWidths[1], currentY);
  doc.text(order.artwork ? '5,000' : '0', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
  currentY += rowHeight;

  doc.text('Artwork Description', tableLeft, currentY);
  doc.text(order.artworkText || 'N/A', tableLeft + colWidths[0], currentY);
  doc.text('-', tableLeft + colWidths[0] + colWidths[1], currentY);
  doc.text('-', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
  currentY += rowHeight;

  doc.font('Helvetica-Bold');
  currentY += rowHeight;
  doc.text('Total', tableLeft, currentY);
  doc.text('', tableLeft + colWidths[0], currentY);
  doc.text(order.quantity > 50 ? 'Bulk Order' : 'Standard', tableLeft + colWidths[0] + colWidths[1], currentY);
  doc.text((priceDetails.total || 0).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
  currentY += rowHeight;

  doc.text('Advance (50%)', tableLeft, currentY);
  doc.text('', tableLeft + colWidths[0], currentY);
  doc.text('', tableLeft + colWidths[0] + colWidths[1], currentY);
  doc.text((priceDetails.advance || Math.round((priceDetails.total || 0) * 0.5)).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
  currentY += rowHeight;

  doc.text('Balance Due', tableLeft, currentY);
  doc.text('', tableLeft + colWidths[0], currentY);
  doc.text('', tableLeft + colWidths[0] + colWidths[1], currentY);
  doc.text((priceDetails.balance || Math.round((priceDetails.total || 0) * 0.5)).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);

  doc.moveDown(2);
  doc.fontSize(12).font('Helvetica').text('Thank you for your business!', { align: 'center' });

  doc.end();

  stream.on('finish', () => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order._id}.pdf`);
    const pdfStream = fs.createReadStream(pdfFile);
    pdfStream.pipe(res);
    pdfStream.on('end', () => {
      fs.unlinkSync(pdfFile);
      console.log(`Invoice generated and sent for order ID: ${order._id}`); // Log success
    });
  });
  stream.on('error', (err) => {
    console.error('PDF stream error:', err);
    res.status(500).json({ error: 'Failed to generate PDF', message: err.message });
  });
}

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, ADMIN_EMAIL });
  if (email === ADMIN_EMAIL && (await bcrypt.compare(password, ADMIN_PASSWORD))) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/orders/customer/:email', async (req, res) => {
  try {
    const orders = await Order.find({ email: req.params.email }).sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/admin', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/api/orders/:id', authenticateAdmin, (req, res, next) => {
  console.log('PUT /api/orders/:id with headers:', req.headers['content-type']);
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    upload(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ error: err.message });
      }
      updateOrder(req, res);
    });
  } else {
    updateOrder(req, res);
  }
});

app.put('/api/orders/:id/nofile', authenticateAdmin, async (req, res) => {
  console.log('PUT /api/orders/:id/nofile with body:', req.body);
  updateOrder(req, res);
});

async function updateOrder(req, res) {
  try {
    const { name, email, mobile, material, quantity, artwork, artworkText, priceDetails } = req.body;
    if (!name || !email || !material || !quantity) {
      console.error('Missing required fields:', { name, email, material, quantity });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const updateData = {
      name,
      email,
      mobile: mobile || '',
      material,
      quantity: parseInt(quantity, 10) || 0,
      artwork: artwork === 'true' || artwork === true,
      artworkText: artworkText || '',
    };
    try {
      updateData.priceDetails = priceDetails ? JSON.parse(typeof priceDetails === 'string' ? priceDetails : JSON.stringify(priceDetails)) : {};
    } catch (e) {
      console.error('Invalid priceDetails JSON:', priceDetails, e.message);
      return res.status(400).json({ error: 'Invalid priceDetails format' });
    }
    if (req.file) {
      updateData.artworkImage = `/Uploads/${req.file.filename}`;
      const oldOrder = await Order.findById(req.params.id);
      if (oldOrder?.artworkImage) {
        const oldImagePath = path.join(__dirname, oldOrder.artworkImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!order) {
      console.error('Order not found:', req.params.id);
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error updating order:', err.message);
    res.status(500).json({ error: 'Failed to update order', message: err.message });
  }
}

app.delete('/api/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.artworkImage) {
      const imagePath = path.join(__dirname, order.artworkImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

app.get('/api/orders/report', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    const csvData = orders.map((order) => ({
      OrderID: order._id.toString().slice(-8),
      CustomerName: order.name,
      Email: order.email,
      Mobile: order.mobile,
      Material: order.material,
      Quantity: order.quantity,
      Artwork: order.artwork ? 'Yes' : 'No',
      ArtworkDescription: order.artworkText || 'N/A',
      Total: (order.priceDetails?.total || 0).toLocaleString('en-US'),
      Date: new Date(order.date).toLocaleDateString('en-US'),
    }));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-report.csv');
    fastCsv
      .write(csvData, { headers: true })
      .pipe(res);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

const connectMongoDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Success! Connected to MongoDB');
      return;
    } catch (err) {
      console.error(`❌ Connection attempt failed: ${err.message}`);
      retries -= 1;
      if (retries === 0) {
        console.error('❌ Max retries reached. Exiting...');
        process.exit(1);
      }
      console.log(`Retrying in 5 seconds... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

connectMongoDB();

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});