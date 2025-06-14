import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    material: String,
    quantity: Number,
    artwork: Boolean,
    artworkText: String,
    artworkImage: String, // Store file path
    priceDetails: {
        unitPrice: Number,
        total: Number
    },
    date: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);