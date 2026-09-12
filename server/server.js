const express = require('express');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const { helmetConfig, corsOptions, apiLimiter } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmetConfig);
app.use(require('cors')(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve Static Uploads & Public Assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Endpoints
app.use('/api', apiLimiter, apiRoutes);

// Fallback for HTML page routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, '../public/shop.html')));
app.get('/product', (req, res) => res.sendFile(path.join(__dirname, '../public/product.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, '../public/cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, '../public/checkout.html')));
app.get('/order-success', (req, res) => res.sendFile(path.join(__dirname, '../public/order-success.html')));
app.get('/order-tracking', (req, res) => res.sendFile(path.join(__dirname, '../public/order-tracking.html')));
app.get('/account', (req, res) => res.sendFile(path.join(__dirname, '../public/account.html')));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, '../public/auth.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));

// Catch 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
=====================================================
   🌸 HariNama Store - Commercial Server Live 🌸
=====================================================
   URL:         http://localhost:${PORT}
   API Base:    http://localhost:${PORT}/api
   Storefront:  http://localhost:${PORT}/index.html
   Admin:       http://localhost:${PORT}/admin.html
   Environment: ${process.env.NODE_ENV || 'development'}
=====================================================
    `);
  });
}

module.exports = app;
