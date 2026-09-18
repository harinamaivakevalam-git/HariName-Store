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
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
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

if (require.main === module) {
  let currentPort = parseInt(PORT, 10);

  const startServer = (portToTry) => {
    const server = app.listen(portToTry, () => {
      console.log(`
=====================================================
   🌸 HariNama Store - Commercial Server Live 🌸
=====================================================
   URL:         http://localhost:${portToTry}
   API Base:    http://localhost:${portToTry}/api
   Storefront:  http://localhost:${portToTry}/index.html
   Admin:       http://localhost:${portToTry}/admin.html
   Environment: ${process.env.NODE_ENV || 'development'}
=====================================================
      `);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Server] Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
        startServer(portToTry + 1);
      } else {
        console.error('[Server] Fatal listen error:', err);
      }
    });
  };

  startServer(currentPort);
}

module.exports = app;
