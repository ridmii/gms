import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true }, // Explicitly required
  material: { type: String, required: true },
  quantity: { type: Number, required: true },
  artwork: { type: Boolean, default: false },
  artworkText: { type: String },
  artworkImage: { type: String },
  priceDetails: {
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    artworkFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    advance: { type: Number, required: true },
    balance: { type: Number, required: true }
  },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);