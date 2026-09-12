/**
 * HARINAMA STORE - Reusable Components & Layout Renderers
 * Exact Match to Reference Specification
 */

const formatPrice = (num) => {
  const amount = Number(num) || 0;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const renderRatingStars = (rating = 5.0, count = 24) => {
  return `
    <div class="hn-card-rating">
      <i class="bi bi-star-fill"></i>
      <i class="bi bi-star-fill"></i>
      <i class="bi bi-star-fill"></i>
      <i class="bi bi-star-fill"></i>
      <i class="bi bi-star-fill"></i>
      <span class="hn-card-rating-count">(${count})</span>
    </div>
  `;
};

const showToast = (message, type = 'success') => {
  let container = document.getElementById('hn-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hn-toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '2000';
    document.body.appendChild(container);
  }

  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-bg-dark border-0 show shadow-lg mb-2 rounded-2';
  toastEl.role = 'alert';
  toastEl.ariaLive = 'assertive';
  toastEl.ariaAtomic = 'true';
  toastEl.style.background = '#0B2545';
  toastEl.style.color = '#FFFFFF';
  toastEl.style.borderLeft = '4px solid #C59B27';
  toastEl.innerHTML = `
    <div class="d-flex p-2 align-items-center">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi bi-check-circle-fill text-warning fs-5"></i>
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
  const container = document.getElementById('hn-header-placeholder') || document.getElementById('cres-header-placeholder');
  if (!container) return;

  const currentPath = window.location.pathname;
  let active = activePage;
  if (!active) {
    if (currentPath.includes('shop') || currentPath.includes('products') || currentPath.includes('product-details')) active = 'shop';
    else if (currentPath.includes('about')) active = 'about';
    else if (currentPath.includes('contact')) active = 'contact';
    else if (currentPath.includes('mission')) active = 'mission';
    else if (currentPath === '/' || currentPath.includes('index')) active = 'home';
  }

  const cart = JSON.parse(localStorage.getItem('hn_cart') || localStorage.getItem('cres_cart') || '[]');
  const cartCount = cart.reduce((acc, i) => acc + (i.qty || 1), 0);

  container.innerHTML = `
    <!-- Top Announcement Bar -->
    <div class="hn-topbar">
      <span>Free shipping on orders above ₹499</span>
      <span class="separator">|</span>
      <span>Harinama Store. Remember Krishna. Share Krishna!</span>
    </div>

    <!-- Main Navigation Header -->
    <header class="hn-header">
      <div class="container">
        <div class="d-flex align-items-center justify-content-between">
          
          <!-- Logo -->
          <a href="/index.html" class="hn-brand">
            <svg width="28" height="34" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C7 6 4 12 4 18C4 22.4183 7.58172 26 12 26C16.4183 26 20 22.4183 20 18C20 12 17 6 12 2Z" fill="#0E6251"/>
              <ellipse cx="12" cy="18" rx="5" ry="7" fill="#16A085"/>
              <circle cx="12" cy="18" rx="2.5" fill="#0B2545"/>
              <circle cx="12" cy="18" rx="1" fill="#F1C40F"/>
              <path d="M12 26V30" stroke="#C59B27" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <div class="hn-brand-text">
              <span class="hn-brand-title">Harinama Store</span>
              <span class="hn-brand-tagline">Remember Krishna. Share Krishna.</span>
            </div>
          </a>

          <!-- Centered Navigation -->
          <nav class="d-none d-lg-flex align-items-center gap-2">
            <a href="/index.html" class="hn-nav-link ${active === 'home' ? 'active' : ''}">Home</a>
            <a href="/shop.html" class="hn-nav-link ${active === 'shop' ? 'active' : ''}">Shop</a>
            <a href="/shop.html" class="hn-nav-link">Collections</a>
            <a href="/about.html" class="hn-nav-link ${active === 'mission' ? 'active' : ''}">Our Mission</a>
            <a href="/about.html" class="hn-nav-link ${active === 'about' ? 'active' : ''}">About</a>
            <a href="/contact.html" class="hn-nav-link ${active === 'contact' ? 'active' : ''}">Contact</a>
          </nav>

          <!-- Right Action Icons -->
          <div class="d-flex align-items-center gap-1 gap-md-2">
            <a href="/shop.html" class="hn-icon-btn" title="Search Products">
              <i class="bi bi-search"></i>
            </a>

            <a href="/account.html" class="hn-icon-btn" title="My Account">
              <i class="bi bi-person"></i>
            </a>

            <a href="/cart.html" class="hn-icon-btn" title="Shopping Cart">
              <i class="bi bi-bag"></i>
              <span class="hn-badge-pill" id="hn-cart-badge">${cartCount}</span>
            </a>

            <!-- Mobile Menu Toggle Button -->
            <button class="hn-icon-btn d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#hnMobileNav" aria-label="Toggle navigation">
              <i class="bi bi-list fs-4"></i>
            </button>
          </div>

        </div>

        <!-- Mobile Navigation Drawer -->
        <div class="collapse d-lg-none mt-3 pt-3 border-top" id="hnMobileNav">
          <div class="d-flex flex-column gap-2">
            <a href="/index.html" class="hn-nav-link ${active === 'home' ? 'active' : ''}">Home</a>
            <a href="/shop.html" class="hn-nav-link ${active === 'shop' ? 'active' : ''}">Shop Keychains</a>
            <a href="/shop.html" class="hn-nav-link">Collections</a>
            <a href="/about.html" class="hn-nav-link">Our Mission</a>
            <a href="/about.html" class="hn-nav-link">About Us</a>
            <a href="/contact.html" class="hn-nav-link">Contact</a>
            <hr class="my-1">
            <a href="/cart.html" class="hn-nav-link">Shopping Cart (${cartCount})</a>
            <a href="/account.html" class="hn-nav-link">My Account / Orders</a>
            <a href="/admin.html" class="hn-nav-link text-warning fw-semibold">Admin Dashboard</a>
          </div>
        </div>

      </div>
    </header>
  `;
};

// Global Footer Component
const renderFooter = () => {
  const container = document.getElementById('hn-footer-placeholder') || document.getElementById('cres-footer-placeholder');
  if (!container) return;

  container.innerHTML = `
    <footer class="hn-footer">
      <div class="container">
        <div class="row g-4">
          
          <!-- Col 1: Brand Info -->
          <div class="col-lg-4 mb-3 mb-lg-0">
            <div class="d-flex align-items-center gap-2 mb-3">
              <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C7 6 4 12 4 18C4 22.4183 7.58172 26 12 26C16.4183 26 20 22.4183 20 18C20 12 17 6 12 2Z" fill="#16A085"/>
                <ellipse cx="12" cy="18" rx="5" ry="7" fill="#F1C40F"/>
                <circle cx="12" cy="18" rx="2" fill="#0B2545"/>
              </svg>
              <h5 class="hn-brand-title text-white mb-0">Harinama Store</h5>
            </div>
            <p class="hn-footer-desc">
              Beautiful devotional keychains and gifts designed to keep Krishna in your heart and everyday life.
            </p>
            <div class="hn-footer-social">
              <a href="https://instagram.com" target="_blank" title="Instagram"><i class="bi bi-instagram"></i></a>
              <a href="https://youtube.com" target="_blank" title="YouTube"><i class="bi bi-youtube"></i></a>
              <a href="https://facebook.com" target="_blank" title="Facebook"><i class="bi bi-facebook"></i></a>
              <a href="https://pinterest.com" target="_blank" title="Pinterest"><i class="bi bi-pinterest"></i></a>
            </div>
          </div>

          <!-- Col 2: Shop Links -->
          <div class="col-6 col-lg-2">
            <div class="hn-footer-title">Shop</div>
            <a href="/shop.html">All Keychains</a>
            <a href="/shop.html?category=gift-sets">Gift Sets</a>
            <a href="/shop.html">New Arrivals</a>
          </div>

          <!-- Col 3: Help Links -->
          <div class="col-6 col-lg-2">
            <div class="hn-footer-title">Help</div>
            <a href="/faq.html">Shipping</a>
            <a href="/terms.html">Returns</a>
            <a href="/faq.html">FAQs</a>
          </div>

          <!-- Col 4: About Links -->
          <div class="col-6 col-lg-2">
            <div class="hn-footer-title">About</div>
            <a href="/about.html">Our Mission</a>
            <a href="/contact.html">Contact Us</a>
          </div>

          <!-- Col 5: Follow Us Column -->
          <div class="col-6 col-lg-2">
            <div class="hn-footer-title">Follow Us</div>
            <div class="d-flex flex-column gap-1">
              <a href="https://instagram.com" target="_blank"><i class="bi bi-instagram me-2"></i>Instagram</a>
              <a href="https://youtube.com" target="_blank"><i class="bi bi-youtube me-2"></i>YouTube</a>
              <a href="https://facebook.com" target="_blank"><i class="bi bi-facebook me-2"></i>Facebook</a>
              <a href="https://pinterest.com" target="_blank"><i class="bi bi-pinterest me-2"></i>Pinterest</a>
            </div>
          </div>

        </div>

        <div class="hn-footer-bottom">
          <div>© ${new Date().getFullYear()} Harinama Store. All rights reserved. &nbsp;|&nbsp; Made with love for a higher purpose. &nbsp;|&nbsp; Hare Krishna!</div>
        </div>
      </div>
    </footer>
  `;
};

// Render Product Card (Exact match to reference image)
const renderProductCard = (p) => {
  const isWish = false;

  return `
    <div class="col-6 col-md-4 col-lg-2">
      <div class="hn-product-card" data-product-id="${p.id}">
        
        <button class="hn-card-wishlist ${isWish ? 'active' : ''}" onclick="toggleWishlist('${p.id}', this)" title="Wishlist">
          <i class="bi ${isWish ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
        </button>

        <a href="/product-details.html?id=${p.id}" class="hn-card-img-box">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </a>

        <div class="hn-card-title">
          <a href="/product-details.html?id=${p.id}">${p.name}</a>
        </div>

        <div class="hn-card-price">
          ${formatPrice(p.price)}
        </div>

        ${renderRatingStars(p.rating, p.reviews_count)}

        <button class="hn-btn-card-add" onclick="handleAddToCart('${p.id}')">
          Add to Cart
        </button>

      </div>
    </div>
  `;
};

// Cart Helpers
const handleAddToCart = (productId, qty = 1, selectedMaterial = 'Acrylic') => {
  const product = (HARINAMA_DATA.products || []).find(p => p.id === productId);
  if (!product) return;

  let cart = JSON.parse(localStorage.getItem('hn_cart') || localStorage.getItem('cres_cart') || '[]');
  const existingIndex = cart.findIndex(item => item.id === productId && item.material === selectedMaterial);

  if (existingIndex > -1) {
    cart[existingIndex].qty += Number(qty);
  } else {
    cart.push({
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.image,
      material: selectedMaterial,
      qty: Number(qty)
    });
  }

  localStorage.setItem('hn_cart', JSON.stringify(cart));
  localStorage.setItem('cres_cart', JSON.stringify(cart));

  // Update badge
  const totalCount = cart.reduce((acc, i) => acc + (i.qty || 1), 0);
  const badge = document.getElementById('hn-cart-badge') || document.getElementById('cres-cart-badge');
  if (badge) badge.innerText = totalCount;

  showToast(`Added "${product.name}" to your cart.`);
};

const toggleWishlist = (productId, btn) => {
  showToast('Item saved to your sacred wishlist.');
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('bi-heart');
      icon.classList.toggle('bi-heart-fill');
      icon.classList.toggle('text-danger');
    }
  }
};
