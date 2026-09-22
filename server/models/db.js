const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '../../database/data.json');

class DatabaseStore {
  constructor() {
    this.data = {
      users: [],
      categories: [],
      brands: [],
      products: [],
      product_images: [],
      product_variants: [],
      carts: [],
      cart_items: [],
      wishlists: [],
      addresses: [],
      coupons: [],
      orders: [],
      order_items: [],
      payments: [],
      reviews: [],
      notifications: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
      }
    } catch (err) {
      console.warn('[DatabaseStore] Error loading data.json, re-seeding:', err.message);
      this.seedInitialData();
    }
  }

  save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DatabaseStore] Error saving data.json:', err.message);
    }
  }

  seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const adminPassword = bcrypt.hashSync('admin123', salt);
    const userPassword = bcrypt.hashSync('user123', salt);

    const adminId = 'a1111111-1111-4111-8111-111111111111';
    const customerId = 'c2222222-2222-4222-8222-222222222222';

    // Users
    this.data.users = [
      {
        id: adminId,
        name: 'HariNama Admin',
        email: 'admin@harinama.com',
        password_hash: adminPassword,
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'a2222222-2222-4222-8222-222222222222',
        name: 'Anil Kumar',
        email: 'katturojuanilkumar@gmail.com',
        password_hash: adminPassword,
        phone: '+91 98765 43211',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'a3333333-3333-4333-8333-333333333333',
        name: 'HariNama Evakevalam',
        email: 'harinamaivakevalam@gmail.com',
        password_hash: adminPassword,
        phone: '+91 98765 43212',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

    ];

    // Empty initial arrays - live items are managed via Supabase Database and Admin Portal
    this.data.categories = [];
    this.data.brands = [];
    this.data.products = [];
    this.data.product_images = [];
    this.data.product_variants = [];
    this.data.coupons = [];
    this.data.addresses = [];
    this.data.reviews = [];

    this.data.wishlists = [];
    this.data.orders = [];
    this.data.order_items = [];
    this.data.payments = [];
    this.data.notifications = [];

    this.save();
    console.log('[DatabaseStore] Database store initialized cleanly.');
  }

  reload() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[DatabaseStore] Error reloading data.json:', err.message);
    }
  }

  // Generic helpers
  findAll(collection) {
    this.reload();
    return [...(this.data[collection] || [])];
  }

  findById(collection, id) {
    this.reload();
    return (this.data[collection] || []).find(item => item.id === id) || null;
  }

  findOne(collection, predicate) {
    this.reload();
    return (this.data[collection] || []).find(predicate) || null;
  }

  filter(collection, predicate) {
    this.reload();
    return (this.data[collection] || []).filter(predicate);
  }

  insert(collection, item) {
    if (!this.data[collection]) this.data[collection] = [];
    const record = {
      id: item.id || uuidv4(),
      ...item,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
    this.data[collection].push(record);
    this.save();
    return record;
  }

  update(collection, id, updates) {
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[collection][index] = {
      ...this.data[collection][index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data[collection][index];
  }

  delete(collection, id) {
    if (!this.data[collection]) return false;
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return false;

    this.data[collection].splice(index, 1);
    this.save();
    return true;
  }
}

const db = new DatabaseStore();

module.exports = db;
