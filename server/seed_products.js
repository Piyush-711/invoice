require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invoice-app';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        const testProduct = new Product({
            name: 'Test Scanner Item',
            description: 'Barcode Scanned Product',
            hsnCode: '8501',
            defaultPrice: 500,
            barcode: '12345678',
            qrCode: 'QR-TEST-001',
            taxRate: 18
        });

        try {
            await Product.deleteMany({ barcode: '12345678' }); // Clear if exists
            await testProduct.save();
            console.log('Test Product Added:');
            console.log('Barcode: 12345678');
            console.log('QR: QR-TEST-001');
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error(err));
