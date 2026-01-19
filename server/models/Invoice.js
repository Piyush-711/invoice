const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    qty: { type: Number, required: true },
    hsnCode: { type: String },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
});

const InvoiceSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    purchaseDate: { type: Date, required: true, default: Date.now },
    invoiceNo: { type: String }, // Can be auto-generated or manual
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    items: [InvoiceItemSchema],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    leftAmount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
