import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true }, // Links to Order._id
  customer: { type: String, required: true },
  address: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ['Ready', 'In Progress', 'Delivered'], default: 'Ready' },
});

export default mongoose.model('Delivery', deliverySchema);