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
import Employee from './models/Employee.js'; 
import Salary from './models/Salary.js';
import Inventory from './models/Inventory.js';
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
  if (!authHeader && req.url !== '/api/dashboard/stream') { // Allow stream without token for now
    console.error('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      res.status(401).json({ error: 'Invalid token', message: err.message });
    }
  } else {
    next(); // Allow stream without token
  }
};

// SSE setup
const sseClients = new Set();
app.get('/api/dashboard/stream', authenticateAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173'); // Explicit CORS for frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials
  res.flushHeaders();

  const clientId = Date.now().toString();
  sseClients.add({ id: clientId, res });

  req.on('close', () => {
    sseClients.delete({ id: clientId, res });
  });
});

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // Allow cookies/auth headers
}));

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


// Delivery Routes (unchanged)
app.get('/api/deliveries', authenticateAdmin, async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .sort({ completedAt: -1 })
      .populate('orderId', 'name address status');
    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries', details: err.message });
  }
});

app.get('/api/orders/unassigned', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' }).sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching unassigned orders:', err);
    res.status(500).json({ error: 'Failed to fetch unassigned orders', details: err.message });
  }
});

app.post('/api/deliveries', authenticateAdmin, async (req, res) => {
  try {
    const { orderId, customer, address, assignedTo, status } = req.body;
    if (!orderId || !customer || !address) {
      return res.status(400).json({ error: 'Order ID, customer, and address are required' });
    }
    const deliveryId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const delivery = new Delivery({
      deliveryId,
      orderId,
      customer,
      address,
      assignedTo: assignedTo || '',
      status: status || 'Pending',
    });
    const savedDelivery = await delivery.save();
    await Order.findByIdAndUpdate(orderId, { status: 'In Progress' });
    res.status(201).json(savedDelivery);
    updateDashboardStats(); // Trigger SSE update
  } catch (err) {
    console.error('Error creating delivery:', err);
    res.status(500).json({ error: 'Failed to create delivery', message: err.message });
  }
});

app.put('/api/deliveries/:deliveryId/assign', authenticateAdmin, async (req, res) => {
  try {
    const { driverId, status } = req.body;
    if (!driverId && !status) return res.status(400).json({ error: 'Driver ID or status is required' });
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: req.params.deliveryId },
      {
        assignedTo: driverId || '',
        status: status || 'Pending',
        completedAt: status === 'Delivered' ? new Date() : undefined,
      },
      { new: true, runValidators: true }
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (status === 'Delivered') {
      await Order.findByIdAndUpdate(delivery.orderId, { status: 'Completed' });
    }
    res.json(delivery);
    updateDashboardStats(); // Trigger SSE update
  } catch (err) {
    console.error('Error assigning driver:', err);
    res.status(500).json({ error: 'Failed to assign driver', details: err.message });
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
    updateDashboardStats(); // Trigger SSE update
  } catch (err) {
    console.error('Error removing driver:', err);
    res.status(500).json({ error: 'Failed to remove driver', details: err.message });
  }
});

app.delete('/api/deliveries/:deliveryId', authenticateAdmin, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const deletedDelivery = await Delivery.findOneAndDelete({ deliveryId });
    if (!deletedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    await Order.findByIdAndUpdate(deletedDelivery.orderId, { status: 'Pending' });
    res.json({ message: 'Delivery deleted successfully' });
    updateDashboardStats(); // Trigger SSE update
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).json({ message: 'Failed to delete delivery: ' + err.message });
  }
});

// Auto-create deliveries from pending orders on server start
const initializeDeliveries = async () => {
  try {
    const pendingOrders = await Order.find({ status: 'Pending' });
    for (const order of pendingOrders) {
      const existingDelivery = await Delivery.findOne({ orderId: order._id });
      if (!existingDelivery) {
        const delivery = new Delivery({
          deliveryId: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          orderId: order._id,
          customer: order.name || 'Unknown Customer',
          address: order.address || 'Not provided',
          assignedTo: '',
          status: 'Pending',
        });
        await delivery.save();
        console.log(`Created delivery for order ${order._id}`);
      }
    }
    updateDashboardStats(); // Trigger SSE update after initialization
  } catch (err) {
    console.error('Error initializing deliveries:', err);
  }
};

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

app.delete('/api/employees/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting employee with id:', id);
    const employee = await Employee.findOneAndDelete({ _id: id }); // Use _id for MongoDB
    if (!employee) {
      console.log('Employee not found with id:', id);
      return res.status(404).json({ message: 'Employee not found' });
    }
    console.log('Employee deleted:', employee);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ message: 'Error deleting employee', error: err.message });
  }
});

app.get('/api/employees/search', authenticateAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required' });
    const employees = await Employee.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { role: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(employees);
  } catch (err) {
    console.error('Error searching employees:', err);
    res.status(500).json({ message: 'Error searching employees', error: err.message });
  }
});

// Order Routes (unchanged)
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
      updateDashboardStats(); // Trigger SSE update
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
      return res.status(400).json({ error: 'Missing required fields: name, email, material, quantity' });
    }

    const parsedPriceDetails = JSON.parse(priceDetails || '{}');
    const unitPrice = parsedPriceDetails.unitPrice || (parseInt(quantity) > 30 ? 1500 : 2000);
    const artworkFee = parsedPriceDetails.artworkFee || (artwork === 'true' ? 5000 : 0);
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
      artwork: artwork === 'true',
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
    updateDashboardStats(); // Trigger SSE update
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
    updateDashboardStats(); // Trigger SSE update
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Salary Routes (unchanged)

app.get('/api/salaries/search', authenticateAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required' });
    const salaries = await Salary.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { id: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(salaries);
  } catch (err) {
    console.error('Error searching salaries:', err);
    res.status(500).json({ message: 'Error searching salaries', error: err.message });
  }
});


app.get('/api/salaries', authenticateAdmin, async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ paymentDate: -1 });
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching salaries' });
  }
});

app.post('/api/salaries', authenticateAdmin, async (req, res) => {
  const { id, name, role, amount, paymentDate, paid } = req.body;
  try {
    if (!id || !name || !amount || !paymentDate) {
      return res.status(400).json({ message: 'ID, name, amount, and payment date are required' });
    }
    const salary = new Salary({
      id,
      name,
      role,
      amount: amount.replace('LKR ', ''),
      paymentDate: new Date(paymentDate),
      paid: paid !== undefined ? paid : false,
    });
    const savedSalary = await salary.save();
    res.status(201).json(savedSalary);
    updateDashboardStats(); // Trigger SSE update
  } catch (error) {
    res.status(500).json({ message: 'Error creating salary record' });
  }
});

app.put('/api/salaries/:id', authenticateAdmin, async (req, res) => {
  const { name, role, amount, paymentDate, paid } = req.body;
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { name, role, amount: amount.replace('LKR ', ''), paymentDate: new Date(paymentDate), paid },
      { new: true, runValidators: true }
    );
    if (!salary) return res.status(404).json({ message: 'Salary record not found' });
    res.json(salary);
    updateDashboardStats(); // Trigger SSE update
  } catch (error) {
    res.status(500).json({ message: 'Error updating salary record' });
  }
});

app.delete('/api/salaries/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params; // This is the _id from the URL
    console.log('Attempting to delete salary with _id:', id);
    const deletedSalary = await Salary.findByIdAndDelete(id);
    if (!deletedSalary) {
      console.log('Salary not found with _id:', id);
      return res.status(404).json({ message: 'Salary record not found' });
    }
    console.log('Salary deleted:', deletedSalary);
    res.json({ message: 'Salary deleted successfully' });
    updateDashboardStats(); // Trigger SSE update
  } catch (err) {
    console.error('Error deleting salary:', err);
    res.status(500).json({ message: 'Error deleting salary', error: err.message });
  }
});

app.put('/api/salaries/:id/mark-paid', authenticateAdmin, async (req, res) => {
  try {
    const { paid } = req.body;
    console.log('Mark-paid request received:', {
      paramsId: req.params.id,
      payload: { paid },
      dbConnection: mongoose.connection.readyState,
      collection: Salary.collection.name,
    });
    const salary = await Salary.findById(req.params.id).lean();
    if (!salary) {
      console.log('Record not found for _id:', req.params.id);
      return res.status(404).json({ message: 'Salary record not found' });
    }
    console.log('Record found before update:', salary);
    const updatedSalary = await Salary.findByIdAndUpdate(
      req.params.id,
      { $set: { paid } },
      { new: true, runValidators: true }
    );
    console.log('Updated salary:', updatedSalary);
    res.json(updatedSalary);
    updateDashboardStats(); // Trigger SSE update
  } catch (err) {
    console.error('Error updating salary status:', err);
    res.status(500).json({ message: 'Error updating salary status', error: err.message });
  }
});

// Employee Routes (unchanged)
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Inventory Routes (unchanged)
app.get('/api/inventory', authenticateAdmin, async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ lastAdded: -1 });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

app.post('/api/inventory', authenticateAdmin, async (req, res) => {
  const { id, item, type, quantity, unit, threshold } = req.body;
  try {
    if (!id || !item || !quantity || !unit || !threshold) {
      return res.status(400).json({ message: 'ID, item, quantity, unit, and threshold are required' });
    }
    const inventory = new Inventory({
      id: id || `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      item,
      type,
      quantity: Number(quantity),
      unit,
      threshold: Number(threshold),
      lastAdded: new Date(),
    });
    const savedInventory = await inventory.save();
    res.status(201).json(savedInventory);
  } catch (error) {
    console.error('Error creating inventory item:', error.message);
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
});

app.put('/api/inventory/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { item, type, quantity, unit, threshold } = req.body;
  try {
    const inventory = await Inventory.findOneAndUpdate(
      { id },
      { item, type, quantity: Number(quantity), unit, threshold: Number(threshold), lastAdded: new Date() },
      { new: true, runValidators: true }
    );
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory item' });
  }
});

app.put('/api/inventory/:id/add', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { quantity: addQty } = req.body;
  try {
    if (!addQty || isNaN(Number(addQty))) {
      return res.status(400).json({ message: 'Valid quantity to add is required' });
    }
    const inventory = await Inventory.findOneAndUpdate(
      { id },
      { $inc: { quantity: Number(addQty) }, lastAdded: new Date() },
      { new: true, runValidators: true }
    );
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to inventory' });
  }
});

app.put('/api/inventory/:id/remove', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { quantity: removeQty } = req.body;
  try {
    if (!removeQty || isNaN(Number(removeQty)) || Number(removeQty) <= 0) {
      return res.status(400).json({ message: 'Valid quantity to remove is required' });
    }
    const inventory = await Inventory.findOne({ id });
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    if (inventory.quantity < Number(removeQty)) {
      return res.status(400).json({ message: 'Insufficient quantity' });
    }
    const updatedInventory = await Inventory.findOneAndUpdate(
      { id },
      { $inc: { quantity: -Number(removeQty) }, lastAdded: new Date() },
      { new: true, runValidators: true }
    );
    res.json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: 'Error removing from inventory' });
  }
});

app.delete('/api/inventory/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const inventory = await Inventory.findOneAndDelete({ id });
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
});

// Admin Login (unchanged)
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && (await bcrypt.compare(password, ADMIN_PASSWORD))) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Invoice and Report Routes (unchanged)
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
    const { month } = req.query;
    console.log('Raw month query:', month);
    const inputMonth = month || new Date().toISOString().slice(0, 7); // Default to current month if invalid
    console.log('Using month for stats:', inputMonth);

    const startDate = new Date(inputMonth);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid month format. Expected YYYY-MM, e.g., 2025-08');
    }
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCHours(23, 59, 59, 999);
    endDate.setMonth(endDate.getMonth() + 1);
    console.log('Date range:', { startDate, endDate });

    // Check for existing orders
    const hasOrders = await Order.countDocuments() > 0;
    console.log('Orders exist:', hasOrders);

    // Calculate monthly income from orders
    const incomeResult = await Order.aggregate([
      { $match: { date: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $ifNull: [{ $toDouble: '$priceDetails.total' }, 0] } },
        },
      },
    ]);
    console.log('Income aggregation result:', incomeResult);
    const monthlyIncome = incomeResult[0]?.totalIncome || 0;

    // Calculate total paid salaries for the month
    const salaryResult = await Salary.aggregate([
      { $match: { paid: true, paymentDate: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: { $toDouble: { $ifNull: ['$amount', 0] } } },
        },
      },
    ]);
    console.log('Salary aggregation result:', salaryResult);
    const totalSalaryExpense = salaryResult[0]?.totalExpense || 0;

    // Calculate profit
    const profit = monthlyIncome - totalSalaryExpense;

    // Calculate pending deliveries
    const pendingDeliveries = await Delivery.countDocuments({
      status: 'Pending',
      createdAt: { $gte: startDate, $lt: endDate },
    });
    console.log('Pending deliveries count:', pendingDeliveries);

    // Calculate total orders
    const totalOrders = await Order.countDocuments({
      date: { $gte: startDate, $lt: endDate },
    });
    console.log('Total orders count:', totalOrders);

    res.json({
      monthlyIncome,
      totalSalaryExpense,
      profit,
      pendingDeliveries,
      totalOrders,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      message: 'Error fetching dashboard stats, using fallback data',
      error: err.message,
      fallback: {
        monthlyIncome: 100000,
        totalSalaryExpense: 50000,
        profit: 50000,
        pendingDeliveries: 5,
        totalOrders: 10,
      },
    });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Function to update dashboard stats and send SSE
async function updateDashboardStats() {
  try {
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCHours(23, 59, 59, 999);
    endDate.setMonth(endDate.getMonth() + 1);

    const incomeResult = await Order.aggregate([
      { $match: { date: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: null, totalIncome: { $sum: { $ifNull: [{ $toDouble: '$priceDetails.total' }, 0] } } } },
    ]);
    const monthlyIncome = incomeResult[0]?.totalIncome || 0;

    const salaryResult = await Salary.aggregate([
      { $match: { paid: true, paymentDate: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: null, totalExpense: { $sum: { $toDouble: { $ifNull: ['$amount', 0] } } } } },
    ]);
    const totalSalaryExpense = salaryResult[0]?.totalExpense || 0;

    const profit = monthlyIncome - totalSalaryExpense;
    const pendingDeliveries = await Delivery.countDocuments({ status: 'Pending', createdAt: { $gte: startDate, $lt: endDate } });
    const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lt: endDate } });

    const data = {
      monthlyIncome,
      totalSalaryExpense,
      profit,
      pendingDeliveries,
      totalOrders,
    };
    const eventData = `data: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => client.res.write(eventData));
  } catch (err) {
    console.error('Error updating dashboard stats:', err);
  }
}

const connectMongoDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Success! Connected to MongoDB');
      await initializeDeliveries(); // Initialize deliveries after connection
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