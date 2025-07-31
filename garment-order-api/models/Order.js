import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true }, // Ensure address is required
  material: { type: String, required: true },
  quantity: { type: Number, required: true },
  artwork: { type: Boolean, default: false },
  artworkText: { type: String, default: '' },
  artworkImage: { type: String, default: '' },
  priceDetails: {
    unitPrice: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    artworkFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['Pending', 'In Progress', 'Delivered'], default: 'Pending' },
  date: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);
export default Order;