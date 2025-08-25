import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  driver: {
    name: { type: String, required: true },
    employeeNumber: { type: String, required: true },
  },
  orderDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Delivered', 'Cancelled'], default: 'Pending' },
});

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery; // Ensure this line is present