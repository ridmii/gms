import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: String, required: true },
  address: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  assignedTo: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Delivered'], default: 'Pending' },
}, { timestamps: true });

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;