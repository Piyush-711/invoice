const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../server_error.log');
const logError = (context, err) => {
    try {
        const timestamp = new Date().toISOString();
        const msg = `[${timestamp}] [PRODUCT] Error in ${context}: ${err.message}\nStack: ${err.stack}\n`;
        fs.appendFileSync(logFile, msg);
    } catch (e) {
        // Fallback
    }
};

// GET /products/fetch/:code - Find product by barcode or QR code
router.get('/fetch/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const product = await Product.findOne({
            $or: [{ barcode: code }, { qrCode: code }]
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        logError('GET /fetch/:code', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /products - Add new product
router.post('/', async (req, res) => {
    try {
        const { name, description, hsnCode, defaultPrice, barcode, qrCode, taxRate, unit } = req.body;

        // Basic validation
        if (!name || !defaultPrice) {
            return res.status(400).json({ message: "Name and Default Price are required" });
        }

        // Check for duplicate barcode
        if (barcode) {
            const existingProduct = await Product.findOne({ barcode });
            if (existingProduct) {
                return res.status(409).json({ message: "Barcode already exists" });
            }
        }

        const newProduct = new Product({
            name,
            description,
            hsnCode,
            defaultPrice,
            barcode,
            qrCode,
            taxRate,
            unit,
            quantity: req.body.quantity,
            reorderLevel: req.body.reorderLevel
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        // Handle Mongoose unique constraint error if it slips through
        if (err.code === 11000) {
            return res.status(409).json({ message: "Product with this Barcode or QR Code already exists" });
        }
        logError('POST /', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /products - Fetch all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }); // Newest first
        res.json(products);
    } catch (err) {
        logError('GET /', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /products/:id - Update a product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Remove _id from updates if present to avoid immutable field error
        delete updates._id;

        const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(updatedProduct);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "Barcode or QR Code already exists on another product" });
        }
        logError('PUT /:id', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /products/:id - Delete a product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        logError('DELETE /:id', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
