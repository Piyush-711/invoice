const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'server_startup.log');
const log = (msg) => {
    try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        // Fallback if logging fails
    }
};

log('Server process started');

try {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    log('dotenv loaded');
    const express = require('express');
    log('express loaded');
    const mongoose = require('mongoose');
    log('mongoose loaded');
    const cors = require('cors');
    const bodyParser = require('body-parser');
} catch (err) {
    log(`Error loading modules: ${err.message}`);
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');



const invoiceRoutes = require('./routes/invoice');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invoice-app';

log(`Attempting to connect to MongoDB at ${MONGODB_URI}`);

if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    const msg = "WARNING: MONGODB_URI is not set! Using fallback localhost connection which will likely fail in production.";
    console.warn(msg);
    log(msg);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected');
        log('MongoDB Connected successfully');
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        log(`MongoDB Connection Error: ${err.message}`);
    });

// Routes
// Serve static files from the React client
// path already required at top
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.use('/invoice', invoiceRoutes);
app.use('/products', require('./routes/product'));

app.get('/api/health', (req, res) => {
    res.send('Invoice API is running');
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// Start Server only if not running in Vercel (lambda environment)
if (require.main === module) {
    const server = app.listen(PORT, () => {
        const msg = `Server running on port ${PORT}`;
        console.log(msg);
        log(msg);
    });

    server.on('error', (e) => {
        const msg = `Server Error: ${e.message}`;
        console.error(msg);
        log(msg);
    });
}

module.exports = app;
