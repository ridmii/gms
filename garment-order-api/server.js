import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import orderRoutes from './routes/orderRoutes.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import Order from './models/Order.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/postscript', 'image/eps'];
        if (file && allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else if (file) {
            cb(new Error('Invalid file type. Only JPEG, PNG, PDF, AI, and EPS are allowed.'));
        } else {
            cb(null, false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

app.use('/api/orders', upload.single('artworkImage'), orderRoutes);

// Invoice endpoint
app.get('/api/orders/:id/invoice', async (req, res) => {
    try {
        console.log(`Generating invoice for order ID: ${req.params.id}`);
        const order = await Order.findById(req.params.id);
        if (!order || !order._id) {
            console.error(`Order not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Order not found' });
        }

        const tempDir = path.join(__dirname, 'temp');
        const pdfFile = path.join(tempDir, `invoice-${order._id}.pdf`);

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const priceDetails = typeof order.priceDetails === 'string' ? JSON.parse(order.priceDetails) : order.priceDetails || {};
        const submissionDate = new Date(order.date).toLocaleDateString('en-US', {
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        });

        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(pdfFile);
        doc.pipe(stream);

        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text('Custom Printing Co.', { align: 'center' });
        doc.text('123 Print Street, Colombo, Sri Lanka', { align: 'center' });
        doc.text('Phone: +94 11 234 5678 | Email: info@customprint.lk', { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(12).text(`Invoice Number: ${order._id.toString().slice(-8)}`, { align: 'left' });
        doc.text(`Date: ${submissionDate}`, { align: 'left' });
        doc.moveDown(0.5);

        doc.text('Billed To:', { underline: true });
        doc.text(order.name || 'N/A');
        doc.text(order.email || 'N/A');
        doc.text(order.mobile || 'N/A');
        doc.moveDown(1);

        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [150, 150, 100, 100];
        const rowHeight = 20;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', tableLeft, tableTop);
        doc.text('Details', tableLeft + colWidths[0], tableTop);
        doc.text('Quantity', tableLeft + colWidths[0] + colWidths[1], tableTop);
        doc.text('Amount (Rs.)', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.moveDown(0.5);

        doc.font('Helvetica');
        let currentY = tableTop + rowHeight;
        doc.text('Material', tableLeft, currentY);
        doc.text(order.material || 'N/A', tableLeft + colWidths[0], currentY);
        doc.text(order.quantity.toString(), tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text((priceDetails.unitPrice || 0).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
        currentY += rowHeight;

        doc.text('Artwork Design', tableLeft, currentY);
        doc.text(order.artwork === true || order.artwork === 'true' ? 'Yes' : 'No', tableLeft + colWidths[0], currentY);
        doc.text('-', tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text(order.artwork === true || order.artwork === 'true' ? '5,000' : '0', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
        currentY += rowHeight;

        doc.text('Artwork Description', tableLeft, currentY);
        doc.text(order.artworkText || 'N/A', tableLeft + colWidths[0], currentY);
        doc.text('-', tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text('-', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
        currentY += rowHeight;

        doc.font('Helvetica-Bold');
        currentY += rowHeight;
        doc.text('Total', tableLeft, currentY);
        doc.text('', tableLeft + colWidths[0], currentY);
        doc.text(order.quantity > 50 ? 'Bulk Order' : 'Standard', tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text((priceDetails.total || 0).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
        currentY += rowHeight;

        doc.text('Advance (50%)', tableLeft, currentY);
        doc.text('', tableLeft + colWidths[0], currentY);
        doc.text('', tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text(Math.round((priceDetails.total || 0) * 0.5).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
        currentY += rowHeight;

        doc.text('Balance Due', tableLeft, currentY);
        doc.text('', tableLeft + colWidths[0], currentY);
        doc.text('', tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text(Math.round((priceDetails.total || 0) * 0.5).toLocaleString('en-US'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);

        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica').text('Thank you for your business!', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order._id}.pdf`);
            const pdfStream = fs.createReadStream(pdfFile);
            pdfStream.pipe(res);
            pdfStream.on('end', () => {
                fs.unlinkSync(pdfFile);
            });
        });
        stream.on('error', (err) => {
            console.error('PDF stream error:', err);
            res.status(500).json({ error: 'Failed to generate PDF', message: err.message });
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ message: "API is working!" });
});

const connectMongoDB = async () => {
    let retries = 5;
    while (retries) {
        try {
            console.log("Attempting to connect to MongoDB...");
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000
            });
            console.log('✅ Success! Connected to MongoDB');
            return;
        } catch (err) {
            console.error(`❌ Connection attempt failed: ${err.message}`);
            retries -= 1;
            if (retries === 0) {
                console.error('❌ Max retries reached. Exiting...');
                process.exit(1);
            }
            console.log(`Retrying in 5 seconds... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

connectMongoDB();

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
