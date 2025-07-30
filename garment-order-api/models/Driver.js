import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

export default mongoose.model('Driver', driverSchema);