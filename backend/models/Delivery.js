// Delivery.js
import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String }, // Added for email notifications
  address: { type: String, required: true },
  driver: {
    employeeNumber: { type: String, required: true }, // Required
    name: { type: String, required: true },          // Required
  },
  assignedTo: { type: String }, // Added to match assigned driver
  scheduledDate: { type: Date }, // Added for scheduling
  deliveryTime: { type: String }, // Added for time details
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  notes: { type: String }, // Added for additional notes
}, { timestamps: true });

// Auto-update updatedAt
deliverySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;