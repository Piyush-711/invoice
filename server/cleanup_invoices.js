const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/invoice-app';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to DB");

        // Find invoices with number > 1000
        // Since invoiceNo is string, we need to be careful, but user's data seems numeric string.
        // We will fetch all and filter in JS to be safe.
        const invoices = await Invoice.find();
        let deletedCount = 0;

        for (const inv of invoices) {
            const num = parseInt(inv.invoiceNo);
            if (!isNaN(num) && num > 1000) {
                console.log(`Deleting invoice #${num}`);
                await Invoice.findByIdAndDelete(inv._id);
                deletedCount++;
            }
        }

        console.log(`Deleted ${deletedCount} high-numbered invoices.`);

        // Now checks max
        const remaining = await Invoice.find();
        const max = remaining.reduce((m, i) => Math.max(m, parseInt(i.invoiceNo) || 0), 0);
        console.log(`Current max invoice number is: ${max}`);

        // If max < 10, we might want to "pad" it so next is 11?
        // Or we just let the user set it manually to 11 once.

        process.exit(0);
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
