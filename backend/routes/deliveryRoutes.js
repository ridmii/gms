// deliveryRoutes.js
import express from 'express';
import Delivery from '../models/Delivery.js';
import nodemailer from 'nodemailer';

const router = express.Router();

let transporter; // Will be initialized in server.js and made available here

// Function to get status email color
function getStatusEmailColor(status) {
  switch (status) {
    case 'Pending': return '#d69e2e';
    case 'In Progress': return '#3182ce';
    case 'Delivered': return '#38a169';
    case 'Cancelled': return '#e53e3e';
    default: return '#718096';
  }
}

// Get all deliveries
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deliveries', message: err.message });
  }
});

// Create a new delivery
router.post('/', async (req, res) => {
  try {
    const { orderId, customerName, customerEmail, address, assignedTo, scheduledDate, status } = req.body;
    if (!orderId || !customerName || !address) {
      return res.status(400).json({ error: 'Missing required fields: orderId, customerName, address' });
    }
    const delivery = new Delivery({ 
      deliveryId: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      orderId,
      customerName,
      customerEmail,
      address,
      assignedTo: assignedTo || '',
      scheduledDate: scheduledDate || new Date(),
      status: status || 'Pending'
    });
    const savedDelivery = await delivery.save();
    res.status(201).json(savedDelivery);
  } catch (err) {
    console.error('Delivery creation error:', err);
    res.status(500).json({ error: 'Failed to create delivery', message: err.message });
  }
});

// Update delivery (general update)
router.put('/:id', async (req, res) => {
  try {
    const { status, assignedTo, scheduledDate } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status, assignedTo, scheduledDate },
      { new: true, runValidators: true }
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update delivery', message: err.message });
  }
});

// Update delivery status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', message: err.message });
  }
});

// Send tracking email
router.post('/send-tracking-email', async (req, res) => {
  try {
    const { delivery, customerEmail } = req.body;
    
    if (!transporter) {
      return res.status(503).json({ 
        success: false, 
        error: 'Email service not configured properly. Check server logs.' 
      });
    }
    
    if (!delivery || !customerEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing delivery data or customer email' 
      });
    }

    const emailHTML = `
      <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333;">📦 Delivery Update</h2>
          <p>Dear <strong>${delivery.customerName || 'Customer'}</strong>,</p>
          <p>Your delivery status has been updated:</p>
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Status:</strong> 
              <span style="color:white; padding:6px 12px; background:${getStatusEmailColor(delivery.status)}; border-radius: 4px; font-weight: bold;">
                ${delivery.status || 'Pending'}
              </span>
            </p>
            <p><strong>Order ID:</strong> ${delivery.orderId || 'N/A'}</p>
            <p><strong>Delivery Address:</strong> ${delivery.address || 'N/A'}</p>
            <p><strong>Assigned Driver:</strong> ${delivery.assignedTo || 'N/A'}</p>
            ${delivery.notes ? `<p><strong>Notes:</strong> ${delivery.notes}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 14px;">Thank you for choosing our delivery service!</p>
          <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Dimalsha Fashions" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `📦 Delivery Update - Order ${delivery.orderId || 'Unknown'}`,
      html: emailHTML
    };

    const result = await transporter.sendMail(mailOptions);
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Check credentials and "Less secure app access".';
    }
    res.status(500).json({ 
      success: false, 
      error: errorMessage, 
      details: error.message,
      code: error.code 
    });
  }
});

export default router;