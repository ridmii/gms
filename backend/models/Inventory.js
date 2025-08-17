import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  item: { type: String, required: true },
  type: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  threshold: { type: Number, required: true, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;