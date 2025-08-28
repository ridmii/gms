import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  address: { type: String, required: true },
  driver: {
    employeeNumber: { type: String }, // Made optional
    name: { type: String, required: true },
  },
  assignedTo: { type: String },
  scheduledDate: { type: Date },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  notes: { type: String },
}, { timestamps: true });

// Auto-update updatedAt
deliverySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;