import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import Order from './models/Order.js';
import Delivery from './models/Delivery.js';
import Driver from './models/Driver.js';
import Employee from './models/Employee.js'; // Import existing Employee model
import fastCsv from 'fast-csv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || '893a5fd0c3de8d1ec5355d64273f913afef53b1b5e9213d91d82fe286f69941a';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dimalsha.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '$2b$10$z4ADspMJ1eBzmRF34Wc38.TXLwYTpd9w67LfrSZaGOHNMGy0zCMsW';

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
}).fields([{ name: 'artworkFile', maxCount: 1 }]);

// Express middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Delivery Schema and Model (already defined in ./models/Delivery.js, imported above)

// Routes

// Employee Routes
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  const { name, contact, role, department, baseSalary } = req.body;
  try {
    if (!name || !contact || !baseSalary) {
      return res.status(400).json({ message: 'Name, contact, and base salary are required' });
    }
    const employee = await Employee.findOneAndUpdate(
      { name },
      { contact, role, department, baseSalary, present: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error creating/updating employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contact, role, department, baseSalary, present } = req.body;
  try {
    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, contact, role, department, baseSalary, present },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee' });
  }
});

// Order Routes
app.get('/api/orders/unassigned', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' }).sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching unassigned orders:', err);
    res.status(500).json({ error: 'Failed to fetch unassigned orders' });
  }
});

app.post('/api/orders', (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload Error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    try {
      const { name, email, mobile, address, material, quantity, artwork, artworkText, priceDetails } = req.body;
      if (!name || !email || !mobile || !address || !material || !quantity) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      const parsedPriceDetails = typeof priceDetails === 'string' ? JSON.parse(priceDetails) : priceDetails || {};
      const unitPrice = parsedPriceDetails.unitPrice || (parseInt(quantity) > 30 ? 1500 : 2000);
      const artworkFee = parsedPriceDetails.artworkFee || (artwork === 'true' || artwork === 'on' ? 5000 : 0);
      const subtotal = parsedPriceDetails.subtotal || parseInt(quantity) * unitPrice;
      const total = parsedPriceDetails.total || subtotal + artworkFee;
      const advance = parsedPriceDetails.advance || Math.round(total * 0.5);
      const balance = parsedPriceDetails.balance || total - advance;

      const artworkImage = req.files?.artworkFile ? `/uploads/${req.files.artworkFile[0].filename}` : '';

      const order = new Order({
        name,
        email,
        mobile,
        address,
        material,
        quantity: parseInt(quantity),
        artwork: artwork === 'true' || artwork === 'on',
        artworkText,
        artworkImage,
        priceDetails: { unitPrice, subtotal, artworkFee, total, advance, balance },
        status: 'Pending',
        date: new Date(),
      });

      const savedOrder = await order.save();
      res.status(201).json({ success: true, order: savedOrder });
    } catch (err) {
      console.error('Order save error:', err);
      res.status(500).json({ error: 'Failed to save order', message: err.message });
    }
  });
});

app.put('/api/orders/:id', authenticateAdmin, (req, res, next) => {
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

async function updateOrder(req, res) {
  try {
    const { name, email, mobile, address, material, quantity, artwork, artworkText, priceDetails } = req.body;
    if (!name || !email || !material || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedPriceDetails = JSON.parse(priceDetails || '{}');
    const unitPrice = parsedPriceDetails.unitPrice || (parseInt(quantity) > 30 ? 1500 : 2000);
    const artworkFee = parsedPriceDetails.artworkFee || (artwork === 'true' || artwork === 'on' ? 5000 : 0);
    const subtotal = parsedPriceDetails.subtotal || parseInt(quantity) * unitPrice;
    const total = parsedPriceDetails.total || subtotal + artworkFee;
    const advance = parsedPriceDetails.advance || Math.round(total * 0.5);
    const balance = parsedPriceDetails.balance || total - advance;

    const updateData = {
      name,
      email,
      mobile: mobile || '',
      address: address || '',
      material,
      quantity: parseInt(quantity),
      artwork: artwork === 'true' || artwork === 'on',
      artworkText: artworkText || '',
      priceDetails: { unitPrice, subtotal, artworkFee, total, advance, balance },
    };

    if (req.files?.artworkFile) {
      updateData.artworkImage = `/uploads/${req.files.artworkFile[0].filename}`;
      const oldOrder = await Order.findById(req.params.id);
      if (oldOrder?.artworkImage) {
        const oldImagePath = path.join(__dirname, oldOrder.artworkImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Error updating order:', err.message);
    res.status(500).json({ error: 'Failed to update order', message: err.message });
  }
}

app.delete('/api/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.artworkImage) {
      const imagePath = path.join(__dirname, order.artworkImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Delivery Routes
app.get('/api/deliveries', authenticateAdmin, async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ scheduledDate: -1 }).populate('orderId', 'name address');
    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

app.post('/api/deliveries', authenticateAdmin, async (req, res) => {
  try {
    const { orderId, customer, address, scheduledDate, assignedTo } = req.body;
    if (!orderId || !customer || !address || !scheduledDate) {
      return res.status(400).json({ error: 'Order ID, customer, address, and scheduled date are required' });
    }
    const deliveryId = `DEL-${Date.now()}`;
    const delivery = new Delivery({
      deliveryId,
      orderId,
      customer,
      address,
      scheduledDate,
      assignedTo: assignedTo || '',
    });
    const savedDelivery = await delivery.save();
    res.status(201).json(savedDelivery);
  } catch (err) {
    console.error('Error creating delivery:', err);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

app.put('/api/deliveries/:deliveryId/assign', authenticateAdmin, async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: 'Driver ID is required' });
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: req.params.deliveryId },
      { assignedTo: driverId, status: 'In Progress' },
      { new: true, runValidators: true }
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    console.error('Error assigning driver:', err);
    res.status(500).json({ error: 'Failed to assign driver' });
  }
});

app.put('/api/deliveries/:deliveryId/remove-driver', authenticateAdmin, async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: req.params.deliveryId },
      { assignedTo: '', status: 'Pending' },
      { new: true, runValidators: true }
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    console.error('Error removing driver:', err);
    res.status(500).json({ error: 'Failed to remove driver' });
  }
});

// Driver Routes
app.get('/api/drivers', authenticateAdmin, async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && (await bcrypt.compare(password, ADMIN_PASSWORD))) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Invoice and Report Routes
app.get('/api/orders/:id/invoice', authenticateAdmin, async (req, res) => {
  try {
    await generateInvoice(req, res);
  } catch (error) {
    console.error('Error generating admin invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

app.get('/api/orders/:id/invoice/public', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const order = await Order.findById(id);
    if (!order || order.email !== email) return res.status(401).json({ error: 'Unauthorized: Email does not match order' });
    await generateInvoice(req, res);
  } catch (error) {
    console.error('Error generating public invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

async function generateInvoice(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const tempDir = path.join(__dirname, 'temp');
  const pdfFile = path.join(tempDir, `invoice-${order._id}.pdf`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const priceDetails = order.priceDetails || {};
  const submissionDate = new Date(order.createdAt || order.date || Date.now()).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(pdfFile);
  doc.pipe(stream);

  doc.fontSize(20).text('Payment Invoice', { align: 'center' });
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
  doc.text(`Address: ${order.address || 'Not provided'}`);
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
    });
  });
  stream.on('error', (err) => {
    console.error('PDF stream error:', err);
    res.status(500).json({ error: 'Failed to generate PDF', message: err.message });
  });
}

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

app.get('/api/orders/report', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    const csvData = orders.map((order) => ({
      OrderID: order._id.toString().slice(-8),
      CustomerName: order.name,
      Email: order.email,
      Mobile: order.mobile,
      Address: order.address || 'Not provided',
      Material: order.material,
      Quantity: order.quantity,
      Artwork: order.artwork ? 'Yes' : 'No',
      ArtworkDescription: order.artworkText || 'N/A',
      Total: (order.priceDetails?.total || 0).toLocaleString('en-US'),
      Date: new Date(order.date).toLocaleDateString('en-US'),
    }));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-report.csv');
    fastCsv.write(csvData, { headers: true }).pipe(res);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.get('/api/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingDeliveries = await Order.countDocuments({ status: 'Pending' });
    const stockLevel = 85; // Placeholder
    const monthlyIncome = await Order.aggregate([
      { $match: { date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$priceDetails.total', 0] } } } },
    ]).then((result) => result[0]?.total || 0);

    res.json({ totalOrders, pendingDeliveries, stockLevel, monthlyIncome });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
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