/**
 * CRESCENDO - Reusable Components & Layout Renderers
 */

const formatPrice = (num) => {
  const amount = Number(num) || 0;
  return `$${amount.toFixed(2)} USD`;
};

const renderRatingStars = (rating = 5.0, count = 124) => {
  return `
    <div class="cres-product-rating">
      <i class="bi bi-star-fill text-warning"></i>
      <i class="bi bi-star-fill text-warning"></i>
      <i class="bi bi-star-fill text-warning"></i>
      <i class="bi bi-star-fill text-warning"></i>
      <i class="bi bi-star-fill text-warning"></i>
      <span class="text-muted ms-1 small">(${count})</span>
    </div>
  `;
};

const showToast = (message, type = 'success') => {
  let container = document.getElementById('cres-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'cres-toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '2000';
    document.body.appendChild(container);
  }

  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-bg-dark border-0 show shadow-lg mb-2 rounded-4';
  toastEl.role = 'alert';
  toastEl.ariaLive = 'assertive';
  toastEl.ariaAtomic = 'true';
  toastEl.style.background = 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)';
  toastEl.style.color = '#FFFFFF';
  toastEl.innerHTML = `
    <div class="d-flex p-2 align-items-center">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi bi-check-circle-fill text-info fs-5"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
    </div>
  `;
  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.remove();
  }, 3500);
};

// Global Header Component
const renderHeader = (activePage = '') => {
  const container = document.getElementById('cres-header-placeholder') || document.getElementById('hn-header-placeholder');
  if (!container) return;

  const currentPath = window.location.pathname;
  let active = activePage;
  if (!active) {
    if (currentPath.includes('products') || currentPath.includes('product-details')) active = 'products';
    else if (currentPath.includes('about')) active = 'about';
    else if (currentPath.includes('contact')) active = 'contact';
    else if (currentPath === '/' || currentPath.includes('index')) active = 'home';
  }

  const cart = JSON.parse(localStorage.getItem('cres_cart') || '[]');
  const wishlist = JSON.parse(localStorage.getItem('cres_wishlist') || '[]');
  const cartCount = cart.reduce((acc, i) => acc + (i.qty || 1), 0);
  const wishCount = Array.isArray(wishlist) ? wishlist.length : 0;

  container.innerHTML = `
    <header class="cres-header">
      <div class="container">
        <div class="d-flex align-items-center justify-content-between">
          
          <!-- Logo -->
          <a href="/index.html" class="cres-brand">
            <span class="cres-brand-dot"></span>
            <span>HARI NAMA STORE</span>
          </a>

          <!-- Desktop Navigation -->
          <nav class="d-none d-lg-flex align-items-center gap-1">
            <a href="/index.html" class="cres-nav-link ${active === 'home' ? 'active' : ''}">Home</a>
            <a href="/products.html" class="cres-nav-link ${active === 'products' ? 'active' : ''}">Products</a>
            <a href="/about.html" class="cres-nav-link ${active === 'about' ? 'active' : ''}">About</a>
            <div class="dropdown">
              <a href="#" class="cres-nav-link dropdown-toggle" data-bs-toggle="dropdown">Pages</a>
              <ul class="dropdown-menu shadow border-0 p-2 rounded-4">
                <li><a class="dropdown-item py-2" href="/cart.html"><i class="bi bi-cart me-2"></i>Shopping Cart</a></li>
                <li><a class="dropdown-item py-2" href="/checkout.html"><i class="bi bi-credit-card me-2"></i>Checkout</a></li>
                <li><a class="dropdown-item py-2" href="/account.html"><i class="bi bi-person me-2"></i>My Account</a></li>
                <li><a class="dropdown-item py-2" href="/orders.html"><i class="bi bi-box-seam me-2"></i>My Orders</a></li>
                <li><a class="dropdown-item py-2" href="/wishlist.html"><i class="bi bi-heart me-2"></i>My Wishlist</a></li>
                <li><a class="dropdown-item py-2" href="/addresses.html"><i class="bi bi-geo-alt me-2"></i>My Addresses</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item py-2" href="/faq.html"><i class="bi bi-question-circle me-2"></i>FAQ</a></li>
                <li><a class="dropdown-item py-2" href="/terms.html"><i class="bi bi-file-earmark-text me-2"></i>Terms &amp; Conditions</a></li>
                <li><a class="dropdown-item py-2" href="/404.html"><i class="bi bi-exclamation-triangle me-2"></i>404 Error Page</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item py-2 fw-semibold text-primary" href="/admin.html"><i class="bi bi-shield-lock me-2"></i>Admin Dashboard</a></li>
                <li><a class="dropdown-item py-2 fw-semibold text-primary" href="/admin-products.html"><i class="bi bi-boxes me-2"></i>Admin Products</a></li>
                <li><a class="dropdown-item py-2 fw-semibold text-primary" href="/admin-orders.html"><i class="bi bi-receipt me-2"></i>Admin Orders</a></li>
              </ul>
            </div>
            <a href="/contact.html" class="cres-nav-link ${active === 'contact' ? 'active' : ''}">Contact</a>
          </nav>

          <!-- Right Actions -->
          <div class="d-flex align-items-center gap-2 gap-md-3">
            <a href="/products.html" class="cres-icon-btn" title="Search Products">
              <i class="bi bi-search"></i>
            </a>

            <a href="/wishlist.html" class="cres-icon-btn d-none d-md-inline-flex" title="Wishlist">
              <i class="bi bi-heart"></i>
              <span class="cres-badge-pill" id="cres-wishlist-badge">${wishCount}</span>
            </a>

            <a href="/cart.html" class="cres-icon-btn" title="Shopping Cart">
              <i class="bi bi-bag"></i>
              <span class="cres-badge-pill" id="cres-cart-badge">${cartCount}</span>
            </a>

            <a href="/account.html" class="cres-icon-btn d-none d-md-inline-flex" title="Account">
              <i class="bi bi-person"></i>
            </a>

            <a href="/products.html" class="btn cres-btn-primary d-none d-xl-inline-flex">
              Buy Template
            </a>

            <!-- Mobile Menu Toggle -->
            <button class="cres-icon-btn d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#cresMobileNav" aria-label="Toggle navigation">
              <i class="bi bi-list"></i>
            </button>
          </div>

        </div>

        <!-- Mobile Navigation Dropdown -->
        <div class="collapse d-lg-none mt-3 pt-3 border-top" id="cresMobileNav">
          <div class="d-flex flex-column gap-2 p-2 bg-light rounded-4">
            <a href="/index.html" class="cres-nav-link ${active === 'home' ? 'active' : ''}"><i class="bi bi-house me-2"></i>Home</a>
            <a href="/products.html" class="cres-nav-link ${active === 'products' ? 'active' : ''}"><i class="bi bi-grid me-2"></i>Products</a>
            <a href="/wishlist.html" class="cres-nav-link"><i class="bi bi-heart me-2"></i>Wishlist (${wishCount})</a>
            <a href="/cart.html" class="cres-nav-link"><i class="bi bi-bag me-2"></i>Shopping Cart (${cartCount})</a>
            <a href="/account.html" class="cres-nav-link"><i class="bi bi-person me-2"></i>My Account</a>
            <a href="/orders.html" class="cres-nav-link"><i class="bi bi-box-seam me-2"></i>My Orders</a>
            <a href="/about.html" class="cres-nav-link ${active === 'about' ? 'active' : ''}"><i class="bi bi-info-circle me-2"></i>About Us</a>
            <a href="/contact.html" class="cres-nav-link ${active === 'contact' ? 'active' : ''}"><i class="bi bi-envelope me-2"></i>Contact</a>
            <a href="/admin.html" class="cres-nav-link text-primary fw-bold"><i class="bi bi-shield-lock me-2"></i>Admin Portal</a>
          </div>
        </div>
      </div>
    </header>
  `;
};

// Global Footer Component
const renderFooter = () => {
  const container = document.getElementById('cres-footer-placeholder') || document.getElementById('hn-footer-placeholder');
  if (!container) return;

  container.innerHTML = `
    <footer class="cres-footer">
      <div class="container">
        <div class="row g-4">
          <!-- Col 1 -->
          <div class="col-lg-4">
            <a href="/index.html" class="cres-brand mb-3 d-inline-block">
              <span class="cres-brand-dot"></span>
              <span>HARI NAMA STORE</span>
            </a>
            <p class="text-muted small mb-4 pe-lg-4">
              Premium quality audio gear and lifestyle store designed for those who love pure acoustics, high fidelity, and modern design.
            </p>
            <div class="d-flex gap-2">
              <a href="#" class="cres-icon-btn"><i class="bi bi-instagram"></i></a>
              <a href="#" class="cres-icon-btn"><i class="bi bi-twitter-x"></i></a>
              <a href="#" class="cres-icon-btn"><i class="bi bi-youtube"></i></a>
              <a href="#" class="cres-icon-btn"><i class="bi bi-facebook"></i></a>
            </div>
          </div>

          <!-- Col 2 -->
          <div class="col-6 col-lg-2">
            <h6>Categories</h6>
            <a href="/products.html?category=speakers">Speakers</a>
            <a href="/products.html?category=headphones">Headphones</a>
            <a href="/products.html?category=earbuds">Earbuds</a>
            <a href="/products.html?category=accessories">Accessories</a>
            <a href="/products.html?category=wireless-charger">Wireless Charger</a>
          </div>

          <!-- Col 3 -->
          <div class="col-6 col-lg-2">
            <h6>Quick Links</h6>
            <a href="/products.html">All Products</a>
            <a href="/about.html">About Us</a>
            <a href="/faq.html">FAQs</a>
            <a href="/contact.html">Contact Us</a>
            <a href="/admin.html">Admin Portal</a>
          </div>

          <!-- Col 4 -->
          <div class="col-lg-4">
            <h6>Subscribe to Newsletter</h6>
            <p class="text-muted small mb-3">Get 10% off your first purchase and stay updated with new product releases.</p>
            <form onsubmit="handleCrescendoNewsletter(event)" class="d-flex gap-2">
              <input type="email" required class="form-control rounded-pill px-3" placeholder="Enter your email address">
              <button type="submit" class="btn cres-btn-primary px-4">Subscribe</button>
            </form>
          </div>
        </div>

        <hr class="my-4 text-muted opacity-25">

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-muted">
          <div>© ${new Date().getFullYear()} HARI NAMA STORE. All rights reserved.</div>
          <div class="d-flex gap-3">
            <a href="/terms.html" class="text-muted">Privacy Policy</a>
            <a href="/terms.html" class="text-muted">Terms of Service</a>
            <a href="/faq.html" class="text-muted">Support</a>
          </div>
        </div>
      </div>
    </footer>
  `;
};

// Render Product Card Component (Matching Reference Image)
const renderProductCard = (p) => {
  const badgeClass = p.badge_type === 'pink' ? 'cres-badge-pink' : (p.badge_type === 'blue' ? 'cres-badge-blue' : 'cres-badge-purple');
  const wishlist = JSON.parse(localStorage.getItem('cres_wishlist') || '[]');
  const isWish = Array.isArray(wishlist) && (wishlist.includes(p.id) || wishlist.some(item => (typeof item === 'object' ? item.id === p.id : item === p.id)));

  return `
    <div class="cres-product-card" data-product-id="${p.id}">
      ${p.badge ? `<span class="cres-product-badge ${badgeClass}">${p.badge}</span>` : ''}
      
      <button class="cres-card-wishlist ${isWish ? 'active' : ''}" onclick="toggleWishlist('${p.id}', this)" title="Add to Wishlist">
        <i class="bi ${isWish ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
      </button>

      <a href="/product-details.html?id=${p.id}" class="cres-product-img-box">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </a>

      <h6 class="cres-product-title">
        <a href="/product-details.html?id=${p.id}">${p.name}</a>
      </h6>

      ${renderRatingStars(p.rating, p.reviews_count)}

      <div class="cres-product-price-row">
        <div class="cres-product-price">${formatPrice(p.price)}</div>
        <button class="cres-card-cart-btn" onclick="addToCart('${p.id}')" title="Add to Cart">
          <i class="bi bi-bag"></i>
        </button>
      </div>
    </div>
  `;
};

// Cart & Wishlist local state helpers
window.addToCart = (productId, qty = 1, color = 'Standard') => {
  const p = window.CRESCENDO_DATA && window.CRESCENDO_DATA.products.find(prod => prod.id === productId);
  if (!p) return;

  let cart = JSON.parse(localStorage.getItem('cres_cart') || '[]');
  const existing = cart.find(i => i.id === p.id && i.color === color);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.image,
      color: color,
      qty: qty
    });
  }

  localStorage.setItem('cres_cart', JSON.stringify(cart));
  const badge = document.getElementById('cres-cart-badge');
  if (badge) badge.textContent = cart.reduce((acc, i) => acc + i.qty, 0);

  showToast(`Added "${p.name}" to cart! 🛍️`, 'success');
};

window.toggleWishlist = (productId, btnEl) => {
  const p = window.CRESCENDO_DATA && window.CRESCENDO_DATA.products.find(prod => prod.id === productId);
  if (!p) return;

  let wishlist = JSON.parse(localStorage.getItem('cres_wishlist') || '[]');
  const index = wishlist.findIndex(item => (typeof item === 'object' ? item.id === p.id : item === p.id));
  let isAdded = false;

  if (index > -1) {
    wishlist.splice(index, 1);
    showToast(`Removed "${p.name}" from wishlist.`, 'info');
  } else {
    wishlist.push(p.id);
    isAdded = true;
    showToast(`Added "${p.name}" to wishlist! 💖`, 'success');
  }

  localStorage.setItem('cres_wishlist', JSON.stringify(wishlist));
  window.crescendoWishlist = wishlist;
  const badge = document.getElementById('cres-wishlist-badge');
  if (badge) badge.textContent = wishlist.length;

  if (btnEl) {
    btnEl.classList.toggle('active', isAdded);
    const icon = btnEl.querySelector('i');
    if (icon) icon.className = isAdded ? 'bi bi-heart-fill text-danger' : 'bi bi-heart';
  }
};

window.cresAddToCart = window.addToCart;
window.cresToggleWishlist = window.toggleWishlist;
window.cresShowToast = showToast;
window.cresUpdateCounters = () => {
  const cart = JSON.parse(localStorage.getItem('cres_cart') || '[]');
  const wishlist = JSON.parse(localStorage.getItem('cres_wishlist') || '[]');
  const cartBadge = document.getElementById('cres-cart-badge');
  const wishBadge = document.getElementById('cres-wishlist-badge');
  if (cartBadge) cartBadge.textContent = cart.reduce((acc, i) => acc + (i.qty || 1), 0);
  if (wishBadge) wishBadge.textContent = wishlist.length;
};

window.handleCrescendoNewsletter = (e) => {
  e.preventDefault();
  showToast('Thank you for subscribing to CRESCENDO updates! 🎧', 'success');
  e.target.reset();
};

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
});
