const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
require('dotenv').config();

// Default local mongo URI if not in env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/invoice-app';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to DB");
        const invoices = await Invoice.find({}, 'invoiceNo');
        console.log("Invoices:", invoices.map(i => i.invoiceNo));
        process.exit(0);
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
