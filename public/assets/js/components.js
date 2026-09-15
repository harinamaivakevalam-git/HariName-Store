/**
 * HARINAMA STORE - Reusable Components & Layout Renderers
 * Exact Match to Reference Specification
 */
(function () {
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
    toastEl.className = 'toast align-items-center text-bg-dark border-0 show mb-2 rounded-2 hn-toast-animated';
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
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => toastEl.remove(), 320);
    }, 3500);
  };

  // ============================================================================
  // AUTHENTICATION STATE & DIVINE POPUP MODAL
  // ============================================================================
  let _pendingAuthCallback = null;

  const SUPABASE_AUTH_URL = 'https://wnaqfadlxrrvvjvqqbch.supabase.co';
  const SUPABASE_AUTH_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM';

  const _getAuthScope = () => atob('aGFyaW5hbWFpdmFrZXZhbGFtQGdtYWlsLmNvbQ==');
  const _getAdminRoute = () => atob('L2FkbWluLmh0bWw=');

  const isAdminUser = (usr) => {
    try {
      const user = usr || getLoggedInUser();
      if (!user || !user.email) return false;
      return user.role === 'admin' || String(user.email).toLowerCase().trim() === _getAuthScope();
    } catch (_) {
      return false;
    }
  };
  window.isAdminUser = isAdminUser;
  window._getAdminRoute = _getAdminRoute;

  const enforceAdminAccess = () => {
    const path = window.location.pathname.toLowerCase();
    const adminSegment = atob('YWRtaW4=');
    if (path.includes(adminSegment)) {
      if (!isAdminUser()) {
        window.location.replace('/404.html');
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceAdminAccess);
  } else {
    enforceAdminAccess();
  }

  const getLoggedInUser = () => {
    try {
      const raw = localStorage.getItem('hn_user_profile') || localStorage.getItem('hn_user') || localStorage.getItem('user');
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && (parsed.id || parsed.email || parsed.name)) {
        if (parsed.email && String(parsed.email).toLowerCase().trim() === _getAuthScope()) {
          parsed.role = 'admin';
        }
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const isUserLoggedIn = () => {
    const token = localStorage.getItem('hn_auth_token') || localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null' || token === '') return false;
    const user = getLoggedInUser();
    if (!user) {
      return false;
    }
    return true;
  };

  // Global Supabase OAuth Redirect & Hash Parser
  const processOAuthRedirectAndSession = async () => {
    // 1. Process URL Hash (e.g. #access_token=...&refresh_token=...)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (accessToken) {
          // Direct fetch from Supabase Auth API
          const res = await fetch(`${SUPABASE_AUTH_URL}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'apikey': SUPABASE_AUTH_ANON_KEY
            }
          });
          const userData = await res.json();
          if (userData && userData.id && userData.email) {
            const isSysAdmin = userData.email && String(userData.email).toLowerCase().trim() === _getAuthScope();
            const user = {
              id: userData.id,
              email: userData.email,
              name: userData.user_metadata?.full_name || userData.user_metadata?.name || userData.email.split('@')[0],
              avatar: userData.user_metadata?.avatar_url || userData.user_metadata?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
              phone: userData.user_metadata?.phone || '',
              city: userData.user_metadata?.city || '',
              role: isSysAdmin ? 'admin' : 'customer'
            };

            localStorage.setItem('hn_auth_token', accessToken);
            localStorage.setItem('hn_user_profile', JSON.stringify(user));
            localStorage.setItem('hn_user', JSON.stringify(user));
            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // Clean URL hash without triggering full reload
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, null, window.location.pathname + window.location.search);
            }

            renderHeader();
            window.dispatchEvent(new CustomEvent('hn:auth-changed', { detail: { user } }));
            showToast(`Welcome back, ${user.name}! 🌸`);

            // If currently on login, register, or auth page, auto-redirect to account
            const path = window.location.pathname.toLowerCase();
            if (path.includes('login') || path.includes('register') || path.includes('auth')) {
              setTimeout(() => { window.location.href = isSysAdmin ? _getAdminRoute() : '/account.html'; }, 300);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('OAuth redirect processing notice:', err);
      }
    }

    // 2. Process Supabase Client Session if library is loaded
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        if (!window.supabaseClient) {
          window.supabaseClient = window.supabase.createClient(SUPABASE_AUTH_URL, SUPABASE_AUTH_ANON_KEY);
        }
        const sb = window.supabaseClient;
        if (sb && sb.auth) {
          const { data: { session } } = await sb.auth.getSession();
          if (session && session.user && !isUserLoggedIn()) {
            const isSysAdmin = session.user.email && String(session.user.email).toLowerCase().trim() === _getAuthScope();
            const user = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
              phone: session.user.user_metadata?.phone || '',
              city: session.user.user_metadata?.city || '',
              role: isSysAdmin ? 'admin' : 'customer'
            };
            localStorage.setItem('hn_auth_token', session.access_token);
            localStorage.setItem('hn_user_profile', JSON.stringify(user));
            localStorage.setItem('hn_user', JSON.stringify(user));
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('user', JSON.stringify(user));
            renderHeader();
            window.dispatchEvent(new CustomEvent('hn:auth-changed', { detail: { user } }));
          }

          sb.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
              const isSysAdmin = session.user.email && String(session.user.email).toLowerCase().trim() === _getAuthScope();
              const user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
                avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
                phone: session.user.user_metadata?.phone || '',
                city: session.user.user_metadata?.city || '',
                role: isSysAdmin ? 'admin' : 'customer'
              };
              localStorage.setItem('hn_auth_token', session.access_token);
              localStorage.setItem('hn_user_profile', JSON.stringify(user));
              localStorage.setItem('hn_user', JSON.stringify(user));
              localStorage.setItem('token', session.access_token);
              localStorage.setItem('user', JSON.stringify(user));
              renderHeader();
              window.dispatchEvent(new CustomEvent('hn:auth-changed', { detail: { user } }));
            }
          });
        }
      } catch (_) { }
    }
  };

  // Execute immediately upon script execution
  processOAuthRedirectAndSession();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processOAuthRedirectAndSession);
  }

  const logoutUser = async (e = null, skipConfirm = false) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    if (!skipConfirm) {
      const user = getLoggedInUser();
      const devoteeName = user?.name ? user.name : 'Devotee';
      const confirmed = window.confirm(`Hare Krishna, ${devoteeName}!\n\nAre you sure you want to sign out of your sacred account?`);
      if (!confirmed) {
        return false;
      }
    }

    // Sign out from Supabase if client is present
    try {
      const client = window.supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient('https://wnaqfadlxrrvvjvqqbch.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM') : null);
      if (client && client.auth) {
        await client.auth.signOut();
      }
    } catch (sbErr) {
      console.warn('Supabase signout note:', sbErr);
    }

    // Purge all possible authentication keys from localStorage & sessionStorage
    const keysToPurge = [
      'hn_auth_token',
      'hn_user_profile',
      'hn_user',
      'token',
      'user',
      'auth_token',
      'supabase.auth.token',
      'sb-wnaqfadlxrrvvjvqqbch-auth-token'
    ];
    keysToPurge.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (_) { }
    });

    // Also clean any leftover Supabase token patterns in storage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('auth-token'))) {
          localStorage.removeItem(k);
        }
      }
    } catch (_) { }

    const menu = document.getElementById('hnUserMenu');
    if (menu) menu.classList.remove('active');

    // Re-render header to immediately reflect logged-out state ("Sign In")
    renderHeader();
    showToast('You have been signed out safely. Hare Krishna! 🌸');
    window.dispatchEvent(new CustomEvent('hn:auth-changed', { detail: { user: null } }));

    // If currently on an account/profile or admin page, redirect to login
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('account') || currentPath.includes('orders') || currentPath.includes('admin')) {
      setTimeout(() => { window.location.href = '/login.html'; }, 350);
    }
  };
  window.logoutUser = logoutUser;

  const toggleUserDropdown = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    if (!isUserLoggedIn()) {
      window.location.href = '/login.html';
      return;
    }

    const dropdown = document.getElementById('hnUserDropdown');
    const menu = document.getElementById('hnUserMenu');
    if (menu) {
      const isVisible = menu.classList.contains('active') || menu.classList.contains('show') || menu.style.display === 'block';
      if (isVisible) {
        menu.classList.remove('active', 'show');
        menu.style.display = 'none';
        if (dropdown) dropdown.classList.remove('active');
      } else {
        menu.classList.add('active', 'show');
        menu.style.display = 'block';
        menu.style.zIndex = '999999';
        if (dropdown) dropdown.classList.add('active');
      }
    }
  };

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('hnUserDropdown');
    const menu = document.getElementById('hnUserMenu');
    if (menu && !e.target.closest('#hnUserDropdown')) {
      menu.classList.remove('active', 'show');
      menu.style.display = 'none';
      if (dropdown) dropdown.classList.remove('active');
    }
  });

  const handleHeaderAccountClick = (e) => {
    if (isUserLoggedIn()) {
      toggleUserDropdown(e);
    } else {
      window.location.href = '/login.html';
    }
  };
  window.handleHeaderAccountClick = handleHeaderAccountClick;

  const ensureAuthModal = () => {
    // Inject embedded self-contained CSS to guarantee 100% visibility regardless of external cache
    if (!document.getElementById('hn-auth-modal-embedded-css')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'hn-auth-modal-embedded-css';
      styleTag.textContent = `
      .hn-auth-overlay-exact {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999999 !important;
        background: rgba(14, 11, 10, 0.76) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        display: none;
        align-items: center !important;
        justify-content: center !important;
        padding: 16px !important;
        box-sizing: border-box !important;
      }
      .hn-auth-overlay-exact.active {
        display: flex !important;
      }
      .hn-auth-card-exact {
        position: relative;
        background: #FFFFFF;
        border-radius: 28px;
        box-shadow: 0 32px 85px rgba(0, 0, 0, 0.45);
        max-width: 960px;
        width: 100%;
        display: grid;
        grid-template-columns: 1.15fr 0.95fr;
        align-items: stretch;
        animation: hnAuthCardPop 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }
      @keyframes hnAuthCardPop {
        from { opacity: 0; transform: scale(0.92) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .hn-auth-img-col {
        position: relative;
        background-image: linear-gradient(135deg, rgba(20, 15, 10, 0.46) 0%, rgba(20, 15, 10, 0.22) 50%, rgba(0, 0, 0, 0.14) 100%), url('/assets/images/krishna_hero_keychain.jpg');
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        padding: 44px 40px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: #FFFFFF;
        min-height: 520px;
      }
      .hn-auth-modal-brand {
        font-family: 'Work Sans', sans-serif;
        font-size: 1.65rem;
        font-weight: 800;
        color: #FFFFFF;
        letter-spacing: -0.02em;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
      }
      .hn-auth-modal-hero-wrap {
        margin-top: auto;
        margin-bottom: 40px;
      }
      .hn-auth-modal-headline {
        font-family: 'Work Sans', sans-serif;
        font-size: 2.35rem;
        font-weight: 800;
        line-height: 1.15;
        color: #FFFFFF;
        letter-spacing: -0.025em;
        margin-bottom: 12px;
        text-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
      }
      .hn-auth-modal-subtext {
        font-size: 1.05rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.94);
        margin-bottom: 0;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
      }
      .hn-auth-form-col {
        position: relative;
        background-color: #FFF8F3;
        padding: 44px 38px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .hn-auth-exact-close {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #EFE8DE;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5C524A;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
      }
      .hn-auth-exact-close:hover {
        background: #DFD5C7;
        color: #231C18;
        transform: rotate(90deg) scale(1.06);
      }
      .hn-auth-exact-title {
        font-size: 1.55rem;
        font-weight: 700;
        color: #231C18;
        text-align: center;
        letter-spacing: -0.02em;
        margin-bottom: 22px;
      }
      .hn-exact-field {
        margin-bottom: 14px;
        text-align: left;
      }
      .hn-exact-label {
        display: block;
        font-size: 0.82rem;
        font-weight: 600;
        color: #5C524A;
        margin-bottom: 5px;
      }
      .hn-exact-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
        background: #FFFFFF;
        border: 1.5px solid #EFE8DE;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        transition: all 0.2s ease;
      }
      .hn-exact-input-wrap:focus-within {
        border-color: #4CAE24;
        box-shadow: 0 0 0 3px rgba(76, 174, 36, 0.15);
      }
      .hn-exact-icon {
        padding-left: 14px;
        color: #9C8E84;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
      }
      .hn-exact-input {
        width: 100%;
        padding: 11px 12px;
        border: none;
        background: transparent;
        color: #231C18;
        font-size: 0.92rem;
        outline: none;
      }
      .hn-exact-input::placeholder {
        color: #A09489;
      }
      .hn-exact-eye-btn {
        background: none;
        border: none;
        padding: 0 14px;
        color: #9C8E84;
        cursor: pointer;
        font-size: 1.1rem;
        transition: color 0.2s;
        display: flex;
        align-items: center;
      }
      .hn-exact-eye-btn:hover {
        color: #231C18;
      }
      .hn-exact-forgot-wrap {
        text-align: right;
        margin-top: 4px;
        margin-bottom: 18px;
      }
      .hn-exact-forgot {
        color: #3E322A;
        font-size: 0.8rem;
        font-weight: 600;
        text-decoration: none;
        transition: color 0.2s;
      }
      .hn-exact-forgot:hover {
        color: #4CAE24;
        text-decoration: underline;
      }
      .hn-exact-btn-primary {
        width: 100%;
        padding: 12px 20px;
        background: #4CAE24;
        color: #FFFFFF;
        border: none;
        border-radius: 12px;
        font-size: 0.96rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(76, 174, 36, 0.25);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 0;
      }
      .hn-exact-btn-primary:hover {
        background: #41961F;
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(76, 174, 36, 0.32);
      }
      .hn-exact-btn-primary:disabled {
        opacity: 0.75;
        cursor: not-allowed;
      }
      .hn-exact-divider {
        position: relative;
        text-align: center;
        margin: 16px 0;
      }
      .hn-exact-divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #E8DFD5;
      }
      .hn-exact-divider span {
        position: relative;
        background: #FFF8F3;
        padding: 0 12px;
        font-size: 0.82rem;
        color: #9C8E84;
      }
      .hn-exact-btn-google {
        width: 100%;
        padding: 11px 20px;
        background: #FFFFFF;
        border: 1.5px solid #E8DFD5;
        border-radius: 12px;
        color: #231C18;
        font-size: 0.92rem;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      .hn-exact-btn-google:hover {
        background: #FDFBF8;
        border-color: #D6CCC0;
      }
      .hn-exact-guest-wrap {
        text-align: center;
        margin-top: 10px;
      }
      .hn-exact-guest-link {
        font-size: 0.8rem;
        color: #6B7280;
        text-decoration: none;
        cursor: pointer;
        font-weight: 500;
        transition: color 0.2s;
      }
      .hn-exact-guest-link:hover {
        color: #231C18;
        text-decoration: underline;
      }
      .hn-exact-switch {
        text-align: center;
        margin-top: 18px;
        font-size: 0.84rem;
        color: #5C524A;
      }
      .hn-exact-switch a {
        color: #4CAE24;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        margin-left: 4px;
        transition: color 0.2s;
      }
      .hn-exact-switch a:hover {
        text-decoration: underline;
        color: #3E8F1F;
      }
      .hn-exact-alert {
        display: none;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 0.82rem;
        margin-bottom: 12px;
        line-height: 1.35;
      }
      .hn-exact-alert.error {
        display: block;
        background: #FDF2F2;
        border: 1px solid #F8B4B4;
        color: #9B1C1C;
      }
      .hn-exact-alert.success {
        display: block;
        background: #F0FDF4;
        border: 1px solid #BBF7D0;
        color: #166534;
      }
      @media (max-width: 768px) {
        .hn-auth-card-exact {
          grid-template-columns: 1fr;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 24px;
        }
        .hn-auth-img-col {
          min-height: 160px;
          padding: 24px;
        }
        .hn-auth-modal-headline {
          font-size: 1.6rem;
        }
        .hn-auth-form-col {
          padding: 26px 20px;
        }
      }
    `;
      document.head.appendChild(styleTag);
    }

    const existingOverlay = document.getElementById('hnAuthModalOverlay');
    if (existingOverlay) {
      if (!existingOverlay.querySelector('.hn-auth-card-exact')) {
        existingOverlay.remove();
      } else {
        return;
      }
    }

    const modalHtml = `
    <div class="hn-auth-overlay-exact" id="hnAuthModalOverlay" onclick="handleAuthOverlayClick(event)">
      <div class="hn-auth-card-exact" role="dialog" aria-modal="true" aria-labelledby="hnAuthTitle" onclick="event.stopPropagation()">
        
        <!-- Top Right Close Button -->
        <button type="button" class="hn-auth-exact-close" onclick="closeAuthModal()" aria-label="Close dialog">
          <i class="bi bi-x-lg"></i>
        </button>

        <!-- Left Column: Sacred Product Visual with Overlaid Typography -->
        <div class="hn-auth-img-col">
          <div class="hn-auth-modal-brand">Harinama</div>

          <div class="hn-auth-modal-hero-wrap">
            <h1 class="hn-auth-modal-headline">Every big thing<br>starts small</h1>
            <p class="hn-auth-modal-subtext">Log in and continue growing.</p>
          </div>
        </div>

        <!-- Right Column: Warm Cream Form Card -->
        <div class="hn-auth-form-col text-center d-flex flex-column justify-content-center">
          
          <h2 class="hn-auth-exact-title mb-2" id="hnAuthTitle">Log in to your account</h2>
          <p class="hn-auth-exact-sub text-muted small mb-4" id="hnAuthSubtitle">Sign in securely with your Google account to continue 🌸</p>

          <div class="hn-exact-alert" id="hnAuthAlert"></div>

          <!-- Google Sign-In Action -->
          <div class="my-3">
            <button type="button" class="hn-exact-btn-google py-3 shadow-sm border-2 rounded-3 w-100 fs-6 d-flex align-items-center justify-content-center gap-2" onclick="handleGoogleSignIn()" style="background: #FFFFFF; border-color: #E2D9CD; color: #231C18; font-weight: 700; cursor: pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div class="hn-exact-guest-wrap mt-3">
            <a onclick="continueAsGuest()" class="hn-exact-guest-link text-muted small" style="cursor: pointer;">Or continue as guest &rarr;</a>
          </div>

        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  };

  const openAuthModal = (callback = null, promptReason = null) => {
    if (isUserLoggedIn()) {
      if (typeof callback === 'function') callback();
      return;
    }

    ensureAuthModal();
    _pendingAuthCallback = typeof callback === 'function' ? callback : null;

    const overlay = document.getElementById('hnAuthModalOverlay');
    const subtitle = document.getElementById('hnAuthSubtitle');
    const alertEl = document.getElementById('hnAuthAlert');

    if (subtitle && promptReason) {
      subtitle.innerText = promptReason;
    } else if (subtitle) {
      subtitle.innerText = 'Enter Your Details Below';
    }

    if (alertEl) {
      alertEl.className = 'hn-exact-alert';
      alertEl.innerText = '';
      alertEl.style.display = 'none';
    }

    if (overlay) {
      overlay.style.setProperty('display', 'flex', 'important');
      overlay.style.setProperty('opacity', '1', 'important');
      overlay.style.setProperty('visibility', 'visible', 'important');
      overlay.style.setProperty('z-index', '999999', 'important');
      overlay.classList.add('active');
    }
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      const emailInput = document.getElementById('hnAuthEmail');
      if (emailInput) emailInput.focus();
    }, 120);
  };

  const closeAuthModal = () => {
    const overlay = document.getElementById('hnAuthModalOverlay');
    if (overlay) {
      overlay.style.setProperty('display', 'none', 'important');
      overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
  };

  const continueAsGuest = () => {
    closeAuthModal();
    showToast('Continuing as divine guest. Hare Krishna! 🌸');
    if (typeof _pendingAuthCallback === 'function') {
      const cb = _pendingAuthCallback;
      _pendingAuthCallback = null;
      cb();
    }
  };
  window.continueAsGuest = continueAsGuest;

  const handleGoogleSignIn = async () => {
    const client = window.supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient('https://wnaqfadlxrrvvjvqqbch.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYXFmYWRseHJydnZqdnFxYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzg4NTYsImV4cCI6MjEwNDkxNDg1Nn0.aZcWAzKfjHkozCus4V_xD3BwDSL8KIIEhASdf2NtdtM') : null);

    if (client && client.auth) {
      showToast('Redirecting to Google Secure Sign-In... 🌸');
      try {
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/account.html'
          }
        });
        if (error) {
          setAuthAlert(error.message || 'Google OAuth error', 'error');
          return;
        }
        if (data && data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        setAuthAlert(err.message || 'Google Sign-in failed', 'error');
      }
    } else {
      window.location.href = '/login.html';
    }
  };
  window.handleGoogleSignIn = handleGoogleSignIn;

  const handleAuthOverlayClick = (e) => {
    if (e.target.id === 'hnAuthModalOverlay') {
      closeAuthModal();
    }
  };

  const switchAuthTab = (tab) => {
    const title = document.getElementById('hnAuthTitle');
    const subtitle = document.getElementById('hnAuthSubtitle');
    const signInForm = document.getElementById('hnSignInForm');
    const regForm = document.getElementById('hnRegisterForm');
    const alertEl = document.getElementById('hnAuthAlert');

    if (alertEl) {
      alertEl.className = 'hn-exact-alert';
      alertEl.innerText = '';
      alertEl.style.display = 'none';
    }

    if (tab === 'signin') {
      if (title) title.innerText = 'Welcome Back!';
      if (subtitle) subtitle.innerText = 'Enter Your Details Below';
      if (signInForm) signInForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
      setTimeout(() => document.getElementById('hnAuthEmail')?.focus(), 100);
    } else {
      if (title) title.innerText = 'Create Account';
      if (subtitle) subtitle.innerText = 'Enter Your Details Below to Join';
      if (signInForm) signInForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';
      setTimeout(() => document.getElementById('hnRegName')?.focus(), 100);
    }
  };

  const togglePasswordVisibility = (inputId, btn) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isPwd ? 'bi bi-eye-slash' : 'bi bi-eye';
    }
  };

  const setAuthAlert = (message, type = 'error') => {
    const alertEl = document.getElementById('hnAuthAlert');
    if (!alertEl) return;
    alertEl.className = `hn-exact-alert ${type}`;
    alertEl.innerText = message;
    alertEl.style.display = 'block';
  };

  const handleAuthSignIn = async (e) => {
    e.preventDefault();
    const email = document.getElementById('hnAuthEmail').value.trim();
    const password = document.getElementById('hnAuthPassword').value;
    const btn = document.getElementById('hnSignInSubmitBtn');

    if (!email || !password) {
      setAuthAlert('Please fill in both email and password.');
      return;
    }

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Logging in...`;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(r => r.json());

      if (!res.success) {
        throw new Error(res.message || 'Login failed. Please check your credentials.');
      }

      localStorage.setItem('hn_auth_token', res.token);
      localStorage.setItem('hn_user_profile', JSON.stringify(res.user));
      localStorage.setItem('hn_user', JSON.stringify(res.user));

      setAuthAlert('Logged in successfully! 🌸', 'success');

      setTimeout(() => {
        closeAuthModal();
        renderHeader();
        showToast(`Welcome back, ${res.user.name.split(' ')[0]}! 🌸`);
        window.dispatchEvent(new CustomEvent('hn:auth-changed', { detail: { user: res.user } }));

        if (typeof _pendingAuthCallback === 'function') {
          const cb = _pendingAuthCallback;
          _pendingAuthCallback = null;
          cb();
        }
      }, 450);

    } catch (err) {
      setAuthAlert(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }
  };

  const handleAuthRegister = async (e) => {
    e.preventDefault();
    const name = document.getElementById('hnRegName').value.trim();
    const email = document.getElementById('hnRegEmail').value.trim();
    const password = document.getElementById('hnRegPassword').value;
    const btn = document.getElementById('hnRegisterSubmitBtn');

    if (!name || !email || !password) {
      setAuthAlert('Name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setAuthAlert('Password must be at least 6 characters.');
      return;
    }

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creating account...`;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      }).then(r => r.json());

      if (!res.success) {
        throw new Error(res.message || 'Registration failed.');
      }

      localStorage.setItem('hn_auth_token', res.token);
      localStorage.setItem('hn_user_profile', JSON.stringify(res.user));
      localStorage.setItem('hn_user', JSON.stringify(res.user));

      setAuthAlert('Account created successfully! 🌸', 'success');

      setTimeout(() => {
        closeAuthModal();
        renderHeader();
        showToast(`Welcome to HariNama, ${res.user.name.split(' ')[0]}! 🌸`);
        window.dispatchEvent(new CustomEvent('hn:auth-changed', { detail: { user: res.user } }));

        if (typeof _pendingAuthCallback === 'function') {
          const cb = _pendingAuthCallback;
          _pendingAuthCallback = null;
          cb();
        }
      }, 450);

    } catch (err) {
      setAuthAlert(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }
  };

  const showForgotPasswordAlert = (e) => {
    e.preventDefault();
    setAuthAlert('Please reach out to support@harinama.com to reset your credentials.', 'error');
  };

  // Global Header Component
  const renderHeader = (activePage = '') => {
    // Ensure favicon is present
    if (!document.querySelector("link[rel*='icon']")) {
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/jpeg';
      favicon.href = '/assets/images/krishna-logo.jpg';
      document.head.appendChild(favicon);

      const appleFavicon = document.createElement('link');
      appleFavicon.rel = 'apple-touch-icon';
      appleFavicon.href = '/assets/images/krishna-logo.jpg';
      document.head.appendChild(appleFavicon);
    }

    const container = document.getElementById('hn-header-placeholder') || document.getElementById('cres-header-placeholder');
    if (!container) return;

    const currentPath = window.location.pathname;
    let active = activePage;
    if (!active) {
      if (currentPath.includes('collections')) active = 'collections';
      else if (currentPath.includes('shop') || currentPath.includes('products') || currentPath.includes('product-details')) active = 'shop';
      else if (currentPath.includes('about')) active = 'about';
      else if (currentPath.includes('contact')) active = 'contact';
      else if (currentPath.includes('mission')) active = 'mission';
      else if (currentPath === '/' || currentPath.includes('index')) active = 'home';
    }

    const cart = JSON.parse(localStorage.getItem('hn_cart') || localStorage.getItem('cres_cart') || '[]');
    const cartCount = cart.reduce((acc, i) => acc + (i.qty || 1), 0);
    const loggedIn = isUserLoggedIn();
    const user = getLoggedInUser();

    const userActionMarkup = loggedIn && user ? `
    <div class="hn-user-dropdown" id="hnUserDropdown">
      <button type="button" class="hn-header-account-btn logged-in text-decoration-none" title="Account Menu (${user.name})" id="hnUserAccountBtn" onclick="toggleUserDropdown(event)">
        <div class="hn-account-avatar-wrap">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}" class="hn-header-avatar" alt="${user.name}">
          <span class="hn-avatar-status-dot" title="Active"></span>
        </div>
        <div class="hn-account-text-wrap d-none d-sm-flex">
          <span class="hn-account-main fw-semibold">${user.name.split(' ')[0]}</span>
        </div>
        <i class="bi bi-chevron-down hn-account-caret ms-1" title="Account Menu"></i>
      </button>

      <div class="hn-user-menu" id="hnUserMenu">
        <div class="hn-user-menu-header">
          <div class="d-flex align-items-center gap-2 mb-2">
            <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}" class="hn-menu-avatar" alt="${user.name}">
            <div class="overflow-hidden">
              <div class="fw-bold text-navy text-truncate" style="font-size: 0.92rem;">${user.name}</div>
              <div class="small text-muted text-truncate" style="font-size: 0.76rem;">${user.email}</div>
            </div>
          </div>
        </div>
        <div class="hn-user-menu-links">
          <a href="/account.html"><i class="bi bi-person-badge"></i>My Profile</a>
          <a href="/account.html?tab=orders"><i class="bi bi-box-seam"></i>My Orders</a>
          <a href="/account.html?tab=addresses"><i class="bi bi-geo-alt"></i>Saved Addresses</a>
          <a href="/wishlist.html"><i class="bi bi-heart"></i>My Wishlist</a>
          <a href="/cart.html"><i class="bi bi-bag"></i>Shopping Cart</a>
          ${isAdminUser(user) ? `<a href="${_getAdminRoute()}" class="text-danger fw-bold"><i class="bi bi-shield-lock text-danger"></i>Admin Portal</a>` : ''}
        </div>
        <div class="hn-user-menu-footer">
          <button type="button" class="hn-menu-logout-btn" onclick="logoutUser(event)">
            <i class="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  ` : `
    <a href="/login.html" class="hn-header-account-btn text-decoration-none" title="Sign In" id="hnUserAccountBtn">
      <div class="hn-account-icon-wrap">
        <i class="bi bi-person-fill"></i>
      </div>
      <div class="hn-account-text-wrap d-none d-sm-flex">
        <span class="hn-account-main fw-semibold">Sign In <i class="bi bi-chevron-right small ms-1"></i></span>
      </div>
    </a>
  `;

    container.innerHTML = `
    <!-- Main Navigation Header -->
    <header class="hn-header">
      <div class="container">
        <div class="d-flex align-items-center justify-content-between">
          
          <!-- Logo -->
          <a href="/index.html" class="hn-brand">
            <div class="hn-brand-logo-wrap">
              <img src="/assets/images/krishna-logo.jpg" alt="Harinama Store Logo - Sri Krishna" class="hn-brand-img">
            </div>
            <div class="hn-brand-text">
              <span class="hn-brand-title">Harinama Store</span>
              <span class="hn-brand-tagline d-none d-lg-block">Remember Krishna. Share Krishna.</span>
            </div>
          </a>

          <!-- Centered Navigation -->
          <nav class="d-none d-lg-flex align-items-center gap-2">
            <a href="/index.html" class="hn-nav-link ${active === 'home' ? 'active' : ''}">Home</a>
            <a href="/shop.html" class="hn-nav-link ${active === 'shop' ? 'active' : ''}">Shop</a>
            <a href="/collections.html" class="hn-nav-link ${active === 'collections' ? 'active' : ''}">Collections</a>
            <a href="/about.html" class="hn-nav-link ${active === 'mission' || active === 'about' ? 'active' : ''}">Our Mission</a>
            <a href="/contact.html" class="hn-nav-link ${active === 'contact' ? 'active' : ''}">Contact</a>
          </nav>

          <!-- Right Action Icons: Search -> Cart -> Sign In / Profile (LAST) -->
          <div class="d-flex align-items-center gap-2 gap-md-3">
            <a href="/shop.html" class="hn-icon-btn d-none d-md-inline-flex" title="Search Products">
              <i class="bi bi-search"></i>
            </a>

            <a href="/cart.html" class="hn-icon-btn" title="Shopping Cart">
              <i class="bi bi-bag"></i>
              <span class="hn-badge-pill" id="hn-cart-badge">${cartCount}</span>
            </a>

            <!-- User Auth Trigger / Profile (LAST in order) -->
            ${userActionMarkup}

            <!-- Modern Animated Mobile Menu Toggle Button -->
            <button class="hn-hamburger-btn d-lg-none collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#hnMobileNav" aria-expanded="false" aria-label="Toggle navigation" id="hnMobileNavToggle">
              <span class="hn-hamburger-lines">
                <span class="hn-hamburger-line line-1"></span>
                <span class="hn-hamburger-line line-2"></span>
                <span class="hn-hamburger-line line-3"></span>
              </span>
            </button>
          </div>

        </div>

        <!-- Mobile Navigation Drawer -->
        <div class="collapse d-lg-none" id="hnMobileNav">
          <div class="hn-mobile-drawer">
            <div class="d-flex flex-column gap-1">
              ${loggedIn && user ? `
                <div class="p-3 bg-light rounded-3 border mb-2">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}" class="rounded-circle border" style="width: 38px; height: 38px; object-fit: cover; border-color: var(--hn-gold) !important;" alt="${user.name}">
                    <div class="overflow-hidden">
                      <div class="fw-bold text-navy text-truncate">${user.name}</div>
                      <div class="small text-muted text-truncate">${user.email}</div>
                    </div>
                  </div>
                  <div class="d-flex gap-2">
                    <a href="/account.html" class="btn btn-sm btn-outline-dark flex-grow-1"><i class="bi bi-person me-1"></i>Profile</a>
                    <button type="button" class="btn btn-sm btn-danger px-3" onclick="logoutUser(event)">
                      <i class="bi bi-box-arrow-right me-1"></i>Sign Out
                    </button>
                  </div>
                </div>
              ` : `
                <a href="/login.html" class="btn hn-btn-gold w-100 py-2 mb-2 text-start d-flex align-items-center justify-content-between text-decoration-none">
                  <span><i class="bi bi-person-circle me-2"></i>Sign In / Register</span>
                  <i class="bi bi-chevron-right small"></i>
                </a>
              `}
              <a href="/index.html" class="hn-mobile-nav-link ${active === 'home' ? 'active' : ''}">
                <span><i class="bi bi-house-door me-2"></i>Home</span>
                <i class="bi bi-chevron-right small text-muted"></i>
              </a>
              <a href="/shop.html" class="hn-mobile-nav-link ${active === 'shop' ? 'active' : ''}">
                <span><i class="bi bi-shop me-2"></i>Shop All Products</span>
                <i class="bi bi-chevron-right small text-muted"></i>
              </a>
              <a href="/collections.html" class="hn-mobile-nav-link ${active === 'collections' ? 'active' : ''}">
                <span><i class="bi bi-grid me-2"></i>Collections</span>
                <i class="bi bi-chevron-right small text-muted"></i>
              </a>
              <a href="/about.html" class="hn-mobile-nav-link ${active === 'mission' || active === 'about' ? 'active' : ''}">
                <span><i class="bi bi-heart me-2"></i>Our Mission</span>
                <i class="bi bi-chevron-right small text-muted"></i>
              </a>
              <a href="/contact.html" class="hn-mobile-nav-link ${active === 'contact' ? 'active' : ''}">
                <span><i class="bi bi-envelope me-2"></i>Contact</span>
                <i class="bi bi-chevron-right small text-muted"></i>
              </a>
              <hr class="my-2">
              <a href="/cart.html" class="hn-mobile-nav-link">
                <span><i class="bi bi-bag me-2"></i>Shopping Cart</span>
                <span class="badge text-white rounded-pill px-2" style="background-color: var(--hn-gold);">${cartCount}</span>
              </a>
              <a href="/wishlist.html" class="hn-mobile-nav-link">
                <span><i class="bi bi-heart me-2"></i>My Wishlist</span>
                <i class="bi bi-chevron-right small text-muted"></i>
              </a>
              ${isAdminUser(user) ? `
                <a href="${_getAdminRoute()}" class="hn-mobile-nav-link admin-link mt-1">
                  <span><i class="bi bi-shield-lock me-2"></i>Admin Dashboard</span>
                  <i class="bi bi-arrow-up-right small"></i>
                </a>
              ` : ''}
            </div>
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
            <a href="/index.html" class="d-flex align-items-center gap-2 mb-3 text-decoration-none">
              <div class="hn-brand-logo-wrap footer-logo">
                <img src="/assets/images/krishna-logo.jpg" alt="Harinama Store Logo - Sri Krishna" class="hn-brand-img">
              </div>
              <h5 class="hn-brand-title text-white mb-0">Harinama Store</h5>
            </a>
            <p class="hn-footer-desc">
              Beautiful devotional products and gifts designed to keep Krishna in your heart and everyday life.
            </p>
            <div class="hn-footer-social">
              <a href="https://instagram.com" target="_blank" title="Instagram"><i class="bi bi-instagram"></i></a>
              <a href="https://youtube.com" target="_blank" title="YouTube"><i class="bi bi-youtube"></i></a>
              <a href="https://facebook.com" target="_blank" title="Facebook"><i class="bi bi-facebook"></i></a>
            </div>
          </div>

          <!-- Col 2: Shop Links -->
          <div class="col-6 col-lg-2">
            <div class="hn-footer-title">Shop</div>
            <a href="/shop.html">All Products</a>
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
            </div>
          </div>

        </div>

        <div class="hn-footer-bottom">
          <div>© ${new Date().getFullYear()} Harinama Store. All rights reserved. &nbsp;|&nbsp; Hare Krishna!</div>
        </div>
      </div>
    </footer>
  `;
  };

  // Universal Product Catalog Resolver (Handles UUID, legacy prod-XXX, slug, or title)
  const findCatalogProduct = (idOrSlug) => {
    if (!idOrSlug) return null;
    const str = String(idOrSlug).trim();
    const list = (typeof HARINAMA_DATA !== 'undefined' && Array.isArray(HARINAMA_DATA.products)) ? HARINAMA_DATA.products : [];
    const staticList = (typeof HARINAMA_DATA !== 'undefined' && Array.isArray(HARINAMA_DATA._staticProducts)) ? HARINAMA_DATA._staticProducts : [];
    const allProds = [...list, ...staticList];

    // 1. Direct match on id, legacy_id, sku, or slug
    let found = allProds.find(p =>
      p && (p.id === str || p.legacy_id === str || p.sku === str || p.slug === str)
    );
    if (found) return found;

    // 2. Case-insensitive slug / title match
    const lower = str.toLowerCase();
    found = allProds.find(p =>
      p && (
        (p.slug && p.slug.toLowerCase() === lower) ||
        (p.name && p.name.toLowerCase() === lower) ||
        (p.title && p.title.toLowerCase() === lower)
      )
    );
    if (found) return found;

    // 3. Numeric ID match (e.g. prod-003 or index 3 or uuid ending in 003)
    const numMatch = str.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      found = allProds.find(p => {
        if (!p) return false;
        const idNum = String(p.id).match(/\d+$/);
        if (idNum && parseInt(idNum[0], 10) === num) return true;
        const legNum = String(p.legacy_id || p.sku || '').match(/\d+$/);
        if (legNum && parseInt(legNum[0], 10) === num) return true;
        return false;
      });
      if (found) return found;
    }

    return null;
  };
  window.findCatalogProduct = findCatalogProduct;

  // Render Product Card (Exact match to reference image with dual-ID wishlist awareness)
  const renderProductCard = (p) => {
    if (!p) return '';
    const wishlist = JSON.parse(localStorage.getItem('hn_wishlist') || '[]');
    const isWish = wishlist.includes(p.id) || (p.legacy_id && wishlist.includes(p.legacy_id)) || (p.slug && wishlist.includes(p.slug));

    return `
    <div class="col-6 col-md-4 col-lg-2">
      <div class="hn-product-card" data-product-id="${p.id}" data-legacy-id="${p.legacy_id || ''}">
        
        <button class="hn-card-wishlist ${isWish ? 'active text-danger' : ''}" onclick="toggleWishlist('${p.id}', this)" title="Wishlist" aria-label="Add to wishlist">
          <i class="bi ${isWish ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
        </button>

        <a href="/product-details.html?id=${p.id}" class="hn-card-img-box">
          <img src="${p.image || p.primary_image}" alt="${p.name || p.title}" loading="lazy">
        </a>

        <div class="hn-card-title">
          <a href="/product-details.html?id=${p.id}">${p.name || p.title}</a>
        </div>

        <div class="hn-card-price">
          ${formatPrice(p.price)}
        </div>

        ${renderRatingStars(p.rating, p.reviews_count)}

        <div class="d-flex gap-1 mt-auto">
          <button type="button" class="hn-btn-card-add flex-grow-1" onclick="handleAddToCart('${p.id}')">
            Add to Cart
          </button>
        </div>

      </div>
    </div>
  `;
  };
  window.renderProductCard = renderProductCard;

  // Cart Helpers with Universal Product Resolution
  const handleAddToCart = (productId, qty = 1, selectedMaterial = null, btnElement = null) => {
    if (!isUserLoggedIn()) {
      openAuthModal(() => handleAddToCart(productId, qty, selectedMaterial, btnElement), 'Sign in to add divine items to your sacred cart 🌸');
      return;
    }

    const product = findCatalogProduct(productId);
    if (!product) {
      showToast('Product not found in catalog.', 'error');
      return;
    }

    const material = selectedMaterial || product.material || 'Acrylic';
    const quantity = Math.max(1, Number(qty) || 1);

    let cart = JSON.parse(localStorage.getItem('hn_cart') || localStorage.getItem('cres_cart') || '[]');

    const canonId = product.id;
    const legacyId = product.legacy_id || product.id;

    const existingIndex = cart.findIndex(item =>
      (item.id === canonId || (legacyId && item.id === legacyId) || item.id === productId) &&
      (item.material === material)
    );

    if (existingIndex > -1) {
      cart[existingIndex].qty += quantity;
      cart[existingIndex].id = canonId; // maintain canonical id
      if (legacyId) cart[existingIndex].legacy_id = legacyId;
    } else {
      cart.push({
        id: canonId,
        legacy_id: legacyId,
        name: product.title || product.name,
        price: Number(product.price) || 0,
        image: product.image || product.primary_image,
        material: material,
        qty: quantity
      });
    }

    localStorage.setItem('hn_cart', JSON.stringify(cart));
    localStorage.setItem('cres_cart', JSON.stringify(cart));

    // Update badge with micro bounce animation
    const totalCount = cart.reduce((acc, i) => acc + (i.qty || 1), 0);
    const badge = document.getElementById('hn-cart-badge') || document.getElementById('cres-cart-badge');
    if (badge) {
      badge.innerText = totalCount;
      badge.classList.remove('hn-badge-bounce');
      void badge.offsetWidth; // Force CSS reflow to re-trigger keyframe
      badge.classList.add('hn-badge-bounce');
    }

    // Instant inline visual feedback on the button
    const triggerBtn = btnElement ||
      (window.event && window.event.target ? window.event.target.closest('button') : null) ||
      document.querySelector(`[data-product-id="${canonId}"] .hn-btn-card-add`) ||
      document.querySelector(`[data-product-id="${productId}"] .hn-btn-card-add`);
    if (triggerBtn) {
      const origHtml = triggerBtn.innerHTML;
      triggerBtn.innerHTML = `<i class="bi bi-check2"></i> Added! ✓`;
      triggerBtn.style.backgroundColor = '#166534';
      triggerBtn.style.color = '#FFFFFF';
      triggerBtn.disabled = true;
      setTimeout(() => {
        triggerBtn.innerHTML = origHtml;
        triggerBtn.style.backgroundColor = '';
        triggerBtn.style.color = '';
        triggerBtn.disabled = false;
      }, 1200);
    }

    // Dispatch global event for reactive listeners
    window.dispatchEvent(new CustomEvent('hn_cart_updated', { detail: { cart, totalCount } }));

    showToast(`Added "${product.title || product.name}" (${quantity}) to your cart 🌸`);
  };
  window.handleAddToCart = handleAddToCart;

  // Buy Now Helper
  const handleBuyNow = (productId, qty = 1, selectedMaterial = null) => {
    if (!isUserLoggedIn()) {
      openAuthModal(() => handleBuyNow(productId, qty, selectedMaterial), 'Sign in to proceed to instant checkout 🌸');
      return;
    }

    handleAddToCart(productId, qty, selectedMaterial);
    setTimeout(() => {
      window.location.href = '/checkout.html';
    }, 300);
  };
  window.handleBuyNow = handleBuyNow;

  // Wishlist Helper with Dual-ID Persistence & UI Sync
  const toggleWishlist = (productId, btn = null) => {
    if (!isUserLoggedIn()) {
      openAuthModal(() => toggleWishlist(productId, btn), 'Sign in to save items to your sacred wishlist 🌸');
      return;
    }

    const prod = findCatalogProduct(productId);
    const canonId = prod ? prod.id : productId;
    const legacyId = prod ? prod.legacy_id : null;
    const slug = prod ? prod.slug : null;

    let wishlist = JSON.parse(localStorage.getItem('hn_wishlist') || '[]');
    const exists = wishlist.some(id =>
      id === canonId || (legacyId && id === legacyId) || (slug && id === slug) || id === productId
    );

    let isNowWish = false;
    if (exists) {
      wishlist = wishlist.filter(id =>
        id !== canonId && id !== legacyId && id !== slug && id !== productId
      );
      isNowWish = false;
      showToast('Item removed from your sacred wishlist.');
    } else {
      wishlist.push(canonId);
      if (legacyId && legacyId !== canonId) {
        wishlist.push(legacyId);
      }
      isNowWish = true;
      const title = prod ? (prod.title || prod.name) : 'Item';
      showToast(`Saved "${title}" to your sacred wishlist 🌸`);
    }

    localStorage.setItem('hn_wishlist', JSON.stringify(wishlist));

    // Update ALL heart buttons in the DOM matching this product
    const idSelectors = [
      `[data-product-id="${canonId}"] .hn-card-wishlist`,
      `[data-product-id="${productId}"] .hn-card-wishlist`
    ];
    if (legacyId) {
      idSelectors.push(`[data-product-id="${legacyId}"] .hn-card-wishlist`);
      idSelectors.push(`[data-legacy-id="${legacyId}"] .hn-card-wishlist`);
    }
    if (slug) {
      idSelectors.push(`[data-product-id="${slug}"] .hn-card-wishlist`);
    }

    const buttonsToUpdate = new Set();
    if (btn) buttonsToUpdate.add(btn);

    // Also check product details wishlist button
    const detailBtn = document.getElementById('hn-detail-wishlist-btn');
    if (detailBtn) buttonsToUpdate.add(detailBtn);

    document.querySelectorAll(idSelectors.join(', ')).forEach(b => buttonsToUpdate.add(b));

    buttonsToUpdate.forEach(targetBtn => {
      targetBtn.classList.toggle('active', isNowWish);
      targetBtn.classList.toggle('text-danger', isNowWish);
      const icon = targetBtn.querySelector('i');
      if (icon) {
        icon.className = isNowWish ? 'bi bi-heart-fill text-danger' : 'bi bi-heart';
      }
    });

    window.dispatchEvent(new CustomEvent('hn_wishlist_updated', { detail: wishlist }));
  };
  window.toggleWishlist = toggleWishlist;

  // Universal Scroll Reveal Animation Engine
  const initScrollAnimations = () => {
    const elements = document.querySelectorAll('.hn-reveal, .hn-reveal-stagger');
    if (!elements.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('hn-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('hn-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  };

  // Auto-run when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initScrollAnimations, 100));
  } else {
    setTimeout(initScrollAnimations, 100);
  }

  // Global Window Exports for Inline HTML Handlers
  window.formatPrice = formatPrice;
  window.renderRatingStars = renderRatingStars;
  window.showToast = showToast;
  window.isUserLoggedIn = isUserLoggedIn;
  window.getLoggedInUser = getLoggedInUser;
  window.logoutUser = logoutUser;
  window.toggleUserDropdown = toggleUserDropdown;
  window.ensureAuthModal = ensureAuthModal;
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.handleAuthSignIn = handleAuthSignIn;
  window.handleAuthRegister = handleAuthRegister;
  window.showForgotPasswordAlert = showForgotPasswordAlert;
  window.renderHeader = renderHeader;
  window.renderFooter = renderFooter;
  window.renderProductCard = renderProductCard;
  window.findCatalogProduct = findCatalogProduct;
  window.handleAddToCart = handleAddToCart;
  window.handleBuyNow = handleBuyNow;
  window.toggleWishlist = toggleWishlist;
  window.continueAsGuest = continueAsGuest;
  window.handleGoogleSignIn = handleGoogleSignIn;
  window.handleAuthOverlayClick = handleAuthOverlayClick;
  window.handleHeaderAccountClick = handleHeaderAccountClick;
  window.initScrollAnimations = initScrollAnimations;
})();
