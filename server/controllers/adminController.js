const db = require('../models/db');

// Admin Analytics & Dashboard Overview
exports.getDashboardStats = (req, res, next) => {
  try {
    const orders = db.findAll('orders');
    const products = db.findAll('products');
    const users = db.findAll('users');
    const reviews = db.findAll('reviews');

    const completedOrders = orders.filter(o => o.order_status !== 'cancelled');
    const totalRevenue = completedOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.order_status)).length;
    const lowStockProducts = products.filter(p => p.stock <= 10);

    // Recent 6 Orders
    const recentOrders = orders.slice(0, 6).map(o => {
      const user = db.findById('users', o.user_id);
      return {
        id: o.id,
        order_number: o.order_number,
        customer_name: user ? user.name : o.shipping_address?.name || 'Customer',
        total: o.total,
        order_status: o.order_status,
        payment_status: o.payment_status,
        created_at: o.created_at
      };
    });

    // Recent 5 Customers
    const recentCustomers = users.filter(u => u.role === 'customer').slice(0, 5).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      status: u.status,
      created_at: u.created_at
    }));

    // Top Selling Products
    const orderItems = db.findAll('order_items');
    const salesByProduct = {};
    orderItems.forEach(oi => {
      salesByProduct[oi.product_id] = (salesByProduct[oi.product_id] || 0) + oi.quantity;
    });

    const topProducts = Object.keys(salesByProduct)
      .map(pId => {
        const prod = db.findById('products', pId);
        if (!prod) return null;
        return {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          stock: prod.stock,
          units_sold: salesByProduct[pId]
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, 5);

    // Sales Chart Data (Last 6 Months simulated series)
    const salesChart = {
      labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      revenue: [18400, 24500, 31200, 28900, 39400, Math.round(totalRevenue + 45000)],
      orders: [22, 34, 45, 38, 52, totalOrders + 58]
    };

    res.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalCustomers,
        totalProducts: products.length,
        pendingOrders,
        lowStockCount: lowStockProducts.length,
        recentOrders,
        recentCustomers,
        lowStockProducts: lowStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          price: p.price
        })),
        topProducts,
        salesChart
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get Customers
exports.getCustomers = (req, res, next) => {
  try {
    const customers = db.findAll('users')
      .filter(u => u.role === 'customer')
      .map(u => {
        const userOrders = db.filter('orders', o => o.user_id === u.id);
        const totalSpent = userOrders
          .filter(o => o.order_status !== 'cancelled')
          .reduce((acc, o) => acc + parseFloat(o.total), 0);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: u.avatar,
          status: u.status,
          orders_count: userOrders.length,
          total_spent: Math.round(totalSpent * 100) / 100,
          created_at: u.created_at
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
};

// Admin: Update Customer Status (active / suspended)
exports.updateCustomerStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = db.update('users', id, { status });
    if (!updated) return res.status(404).json({ success: false, message: 'Customer not found.' });

    res.json({ success: true, message: `Customer status updated to ${status}.`, data: updated });
  } catch (err) {
    next(err);
  }
};
