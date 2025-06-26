import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  material: String,
  quantity: Number,
  artwork: Boolean,
  artworkText: String,
  artworkImage: String,
  priceDetails: {
    unitPrice: Number,
    total: Number,
    advance: Number,
    balance: Number
  },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);
