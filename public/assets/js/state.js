/**
 * Sample Store - Reactive State Management
 */

class AppState {
  constructor() {
    this.cartCount = 0;
    this.wishlistCount = 0;
    this.unreadNotifs = 0;
    this.user = api.getUser();
    this.categories = [];
  }

  async init() {
    await this.fetchInitialData();
  }

  async fetchInitialData() {
    try {
      // 1. Fetch Cart count
      const cartRes = await api.get('/cart');
      if (cartRes.success && cartRes.data) {
        this.cartCount = cartRes.data.items_count || 0;
        this.emit('cart-updated', { count: this.cartCount, cart: cartRes.data });
      }
    } catch (e) {
      // Guest fallback
    }

    try {
      // 2. Fetch Wishlist count if logged in
      if (api.getToken()) {
        const wishRes = await api.get('/wishlist');
        if (wishRes.success && wishRes.data) {
          this.wishlistCount = wishRes.data.length || 0;
          this.emit('wishlist-updated', { count: this.wishlistCount, items: wishRes.data });
        }

        // 3. Fetch Unread Notifications
        const notifRes = await api.get('/notifications');
        if (notifRes.success) {
          this.unreadNotifs = notifRes.unread_count || 0;
          this.emit('notifications-updated', { count: this.unreadNotifs, items: notifRes.data });
        }
      }
    } catch (e) {}

    try {
      // 4. Fetch Categories
      const catRes = await api.get('/categories');
      if (catRes.success) {
        this.categories = catRes.data || [];
        this.emit('categories-loaded', { categories: this.categories });
      }
    } catch (e) {}
  }

  setUser(user) {
    this.user = user;
    api.setUser(user);
    this.emit('auth-changed', { user });
    if (user) {
      this.fetchInitialData();
    } else {
      this.wishlistCount = 0;
      this.unreadNotifs = 0;
      this.emit('wishlist-updated', { count: 0 });
      this.emit('notifications-updated', { count: 0 });
    }
  }

  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`hn:${event}`, { detail: data }));
  }

  on(event, callback) {
    window.addEventListener(`hn:${event}`, (e) => callback(e.detail));
  }
}

const state = new AppState();
window.state = state;
