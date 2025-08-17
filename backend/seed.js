import mongoose from 'mongoose';
import Delivery from './models/Delivery.js';
import Driver from './models/Driver.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('Connected to MongoDB');

    // Seed Drivers
    const drivers = await Driver.insertMany([
      { name: 'John Smith' },
      { name: 'Mary Johnson' },
      { name: 'Robert Brown' },
      { name: 'Lisa Davis' },
    ]);
    console.log('Drivers seeded:', drivers);

    // Seed Deliveries (replace with actual Order._id from your Orders collection)
    const deliveries = await Delivery.insertMany([
      {
        deliveryId: 'DEL-001',
        orderId: '68483374490f88775c938e38', // Replace with an existing Order._id
        customer: 'Ridmi Mithila Vancuylenburg',
        address: '123 Textile Road, Fabricville',
        assignedTo: drivers[0]._id,
        scheduledDate: new Date('2023-06-20'),
        status: 'In Progress',
      },
      {
        deliveryId: 'DEL-002',
        orderId: '68483839490f88775c938e3c', // Replace with an existing Order._id
        customer: 'Perera',
        address: '456 Fashion Ave, Styletown',
        assignedTo: drivers[1]._id,
        scheduledDate: new Date('2023-06-22'),
        status: 'Ready',
      },
      {
        deliveryId: 'DEL-003',
        orderId: '68483da7490f88775c938e3f', // Replace with an existing Order._id
        customer: 'A.A.R.A.Fernando',
        address: '789 Design Blvd, Trendville',
        assignedTo: null,
        scheduledDate: new Date('2023-06-19'),
        status: 'Delivered',
      },
      {
        deliveryId: 'DEL-004',
        orderId: '6848495a490f88775c938e49', // Replace with an existing Order._id
        customer: 'Ridmi Mithila Vancuylenburg',
        address: '101 Sewing Lane, Patterntown',
        assignedTo: drivers[3]._id,
        scheduledDate: new Date('2023-06-25'),
        status: 'Ready',
      },
    ]);
    console.log('Deliveries seeded:', deliveries);

    mongoose.connection.close();
  })
  .catch(err => console.error('Seeding error:', err));