const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// POST /invoice - Save invoice
router.post('/', async (req, res) => {
    try {
        const {
            customerName,
            mobileNumber,
            purchaseDate,
            items,
            totalAmount,
            invoiceNo,
            dueDate
        } = req.body;

        // Initial creation: paidAmount is 0 usually, so leftAmount = totalAmount.
        // Unless user allows prepayments, but requirement says "Paid Amount" is entered on Page 2.
        // However, Page 2 seems to be for VIEWING and UPDATING payments.
        // We will respect the "Save & Print" flow which likely creates the invoice first.

        const newInvoice = new Invoice({
            customerName,
            mobileNumber,
            purchaseDate,
            items,
            totalAmount,
            leftAmount: totalAmount, // Initially full amount pending
            invoiceNo,
            dueDate
        });

        const savedInvoice = await newInvoice.save();
        res.status(201).json(savedInvoice);
    } catch (err) {
        console.error('Error saving invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET / - Fetch all invoices
router.get('/', async (req, res) => {
    console.log('GET /invoice called');
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        console.log(`Found ${invoices.length} invoices`);
        res.json(invoices);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /next-number - Get next invoice number
router.get('/next-number', async (req, res) => {
    try {
        const invoices = await Invoice.find({}, 'invoiceNo');
        const maxInvoiceNo = invoices.reduce((max, invoice) => {
            const num = parseInt(invoice.invoiceNo);
            return !isNaN(num) && num > max ? num : max;
        }, 0);

        const nextNum = maxInvoiceNo + 1;
        res.json({ nextInvoiceNo: nextNum });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





// PUT /invoice/:id/payment - Update paid & left amount
router.put('/:id/payment', async (req, res) => {
    try {
        const { paidAmount } = req.body;
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Logic to update payment.
        // Assuming paidAmount sent is the NEW total paid amount or incremental?
        // Requirement: "Manually enter Paid Amount. Automatically calculate Left Amount = Total - Paid"
        // Usually this means we are setting the current paid amount.

        invoice.paidAmount = Number(paidAmount);

        // Recalculate left amount
        // Ensure we don't go negative or exceed total? Requirement doesn't say validation rigor, but standard practice:
        invoice.leftAmount = invoice.totalAmount - invoice.paidAmount;

        const updatedInvoice = await invoice.save();
        res.json(updatedInvoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// GET /customer-summary - Get total sales, paid, and pending for a customer by Mobile Number
router.get('/customer-summary', async (req, res) => {
    try {
        const { mobileNumber } = req.query;
        if (!mobileNumber) {
            return res.status(400).json({ message: "Mobile Number is required" });
        }

        // Match by mobile number (regex for robustness against whitespace)
        const stats = await Invoice.aggregate([
            {
                $match: {
                    mobileNumber: { $regex: new RegExp(`^${mobileNumber.trim()}$`, 'i') }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                    totalPaid: { $sum: "$paidAmount" }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                totalSales: 0,
                totalPaid: 0,
                totalPending: 0
            });
        }

        const { totalSales, totalPaid } = stats[0];
        const totalPending = totalSales - totalPaid;

        res.json({
            totalSales,
            totalPaid,
            totalPending
        });

    } catch (err) {
        console.error("Error fetching customer summary:", err);
        res.status(500).json({ error: err.message });
    }
});



// GET /all-summary - Get grand total sales, paid, and pending for ALL invoices
router.get('/all-summary', async (req, res) => {
    try {
        const stats = await Invoice.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                    totalPaid: { $sum: "$paidAmount" }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                totalSales: 0,
                totalPaid: 0,
                totalPending: 0
            });
        }

        const { totalSales, totalPaid } = stats[0];
        const totalPending = totalSales - totalPaid;

        res.json({
            totalSales,
            totalPaid,
            totalPending
        });

    } catch (err) {
        console.error("Error fetching all summary:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /invoice/:id - Fetch invoice
// Moved to bottom to avoid conflict with other specific GET routes
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /invoice/:id - Delete an invoice
router.delete('/:id', async (req, res) => {
    console.log(`DELETE /invoice/${req.params.id} request received`);
    try {
        const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!deletedInvoice) {
            console.log(`Invoice ${req.params.id} not found for deletion`);
            return res.status(404).json({ message: 'Invoice not found' });
        }
        console.log(`Invoice ${req.params.id} deleted successfully`);
        res.json({ message: 'Invoice deleted successfully' });
    } catch (err) {
        console.error(`Error deleting invoice ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
