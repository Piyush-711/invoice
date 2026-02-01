const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    hsnCode: { type: String },
    defaultPrice: { type: Number, required: true }, // Rate
    barcode: { type: String, unique: true, sparse: true }, // Unique but optional
    qrCode: { type: String, unique: true, sparse: true },
    unit: { type: String, default: 'pcs' },
    taxRate: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
