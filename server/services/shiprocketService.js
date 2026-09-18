/**
 * Shiprocket Logistics & Order Fulfillment Service
 * Production-ready backend module for authenticating and communicating with Shiprocket API v2
 */

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external';

class ShiprocketService {
  constructor() {
    this.token = null;
    this.tokenExpiresAt = null;
    this.authPromise = null;
  }

  /**
   * Check if Shiprocket credentials are fully configured in the environment
   */
  isConfigured() {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    return Boolean(
      email &&
      password &&
      email.trim() !== '' &&
      password.trim() !== '' &&
      !email.includes('your_shiprocket')
    );
  }

  /**
   * Safe login to Shiprocket with token caching & renewal
   * Never leaks passwords or raw tokens to logs
   */
  async authenticate(forceRefresh = false) {
    if (!this.isConfigured()) {
      throw new Error('Shiprocket credentials are not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env.');
    }

    const now = Date.now();
    // Re-use cached token if still valid (valid for 9 days from 10-day issue)
    if (!forceRefresh && this.token && this.tokenExpiresAt && this.tokenExpiresAt > now) {
      return this.token;
    }

    // Deduplicate simultaneous auth requests
    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      try {
        const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: process.env.SHIPROCKET_EMAIL.trim(),
            password: process.env.SHIPROCKET_PASSWORD.trim()
          })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.token) {
          const errMsg = data.message || (typeof data === 'string' ? data : 'Shiprocket authentication failed');
          console.error('[Shiprocket Auth Error] Authentication failed with status:', response.status);
          throw new Error(errMsg);
        }

        this.token = data.token;
        // Shiprocket tokens last ~10 days. Cache for 8 days to be safe.
        this.tokenExpiresAt = Date.now() + 8 * 24 * 60 * 60 * 1000;
        console.log('[Shiprocket Auth] Successfully authenticated and cached auth token.');
        return this.token;
      } finally {
        this.authPromise = null;
      }
    })();

    return this.authPromise;
  }

  /**
   * Internal authenticated API requester with auto-retry on 401 token expiry
   */
  async request(endpoint, options = {}, isRetry = false) {
    const token = await this.authenticate(isRetry);
    const url = endpoint.startsWith('http') ? endpoint : `${SHIPROCKET_API_BASE}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle token expiration
      if (response.status === 401 && !isRetry) {
        console.warn('[Shiprocket] Token expired or unauthorized. Refreshing token and retrying request...');
        this.token = null;
        this.tokenExpiresAt = null;
        return this.request(endpoint, options, true);
      }

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!response.ok) {
        const errorMsg = data.message || (data.errors ? JSON.stringify(data.errors) : `Shiprocket API error (${response.status})`);
        const err = new Error(errorMsg);
        err.statusCode = response.status;
        err.shiprocketData = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.statusCode) throw err;
      console.error(`[Shiprocket Request Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  }

  /**
   * 1. Test Connection
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Shiprocket credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) are not set in environment.'
      };
    }

    try {
      await this.authenticate(true);
      return {
        success: true,
        message: 'Shiprocket connected successfully'
      };
    } catch (err) {
      return {
        success: false,
        message: `Shiprocket connection failed: ${err.message}`
      };
    }
  }

  /**
   * 2. Create Order in Shiprocket
   * Endpoint: POST /orders/create/adhoc
   */
  async createOrder(orderData) {
    if (!orderData || !orderData.order_number) {
      throw new Error('Valid order data with order_number is required.');
    }

    const shipAddr = orderData.shipping_address || {};
    const billAddr = orderData.billing_address || shipAddr;

    // Parse customer name into first & last name
    const rawName = (shipAddr.name || orderData.guest_name || 'Customer').trim();
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Format order date: YYYY-MM-DD HH:mm
    const dateObj = orderData.created_at ? new Date(orderData.created_at) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const orderDateFormatted = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;

    // Map items
    const rawItems = orderData.items || [];
    let calculatedWeight = 0;
    const orderItemsPayload = rawItems.map((item, idx) => {
      const unitPrice = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity || item.qty, 10) || 1;
      // Default item weight: 0.25 kg
      const itemWeight = parseFloat(item.weight) || 0.25;
      calculatedWeight += itemWeight * qty;

      return {
        name: (item.product_name || item.name || `Product Item ${idx + 1}`).substring(0, 100),
        sku: item.sku || `SKU-${idx + 1}`,
        units: qty,
        selling_price: unitPrice,
        discount: 0,
        tax: 0,
        hsn: item.hsn || 998311
      };
    });

    // Subtotal and payment method
    const subTotal = parseFloat(orderData.subtotal || orderData.total || 0);
    const isCod = String(orderData.payment_method || '').toLowerCase() === 'cod';
    const paymentMethod = isCod ? 'COD' : 'Prepaid';

    // Package dimensions (cm) & weight (kg)
    const packageWeight = Math.max(0.1, parseFloat(orderData.weight || calculatedWeight || 0.5));
    const length = parseFloat(orderData.length) || 18;
    const breadth = parseFloat(orderData.breadth) || 12;
    const height = parseFloat(orderData.height) || 6;

    const payload = {
      order_id: orderData.order_number,
      order_date: orderDateFormatted,
      pickup_location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary').trim(),
      
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shipAddr.address_line_1 || shipAddr.address || 'Address Line 1',
      billing_address_2: shipAddr.address_line_2 || '',
      billing_city: shipAddr.city || 'Vrindavan',
      billing_pincode: String(shipAddr.postal_code || shipAddr.pin || shipAddr.pincode || '281121').replace(/\D/g, ''),
      billing_state: shipAddr.state || 'Uttar Pradesh',
      billing_country: shipAddr.country || 'India',
      billing_email: shipAddr.email || orderData.guest_email || 'orders@harinama.store',
      billing_phone: String(shipAddr.phone || '9999999999').replace(/\D/g, '').slice(-10),

      shipping_is_billing: 1,

      order_items: orderItemsPayload.length > 0 ? orderItemsPayload : [
        {
          name: 'Devotional Sacred Package',
          sku: 'HN-DEV-01',
          units: 1,
          selling_price: subTotal
        }
      ],

      payment_method: paymentMethod,
      shipping_charges: parseFloat(orderData.shipping_fee || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: parseFloat(orderData.discount || 0),
      sub_total: subTotal,

      length,
      breadth,
      height,
      weight: packageWeight
    };

    console.log(`[Shiprocket Service] Creating adhoc order for ${orderData.order_number}...`);
    const result = await this.request('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      data: {
        order_id: result.order_id,
        shipment_id: result.shipment_id,
        status: result.status,
        status_code: result.status_code,
        onboarding_completed_now: result.onboarding_completed_now,
        awb_code: result.awb_code || null,
        courier_name: result.courier_name || null,
        raw: result
      }
    };
  }

  /**
   * 3. Check Courier Serviceability for a Delivery Pincode
   */
  async checkServiceability(deliveryPincode, pickupPincode = null, weight = 0.5, isCod = false) {
    const pickup = pickupPincode || '281121';
    const cleanDelivery = String(deliveryPincode).replace(/\D/g, '');
    const codFlag = isCod ? 1 : 0;

    const endpoint = `/courier/serviceability/?pickup_postcode=${encodeURIComponent(pickup)}&delivery_postcode=${encodeURIComponent(cleanDelivery)}&weight=${weight}&cod=${codFlag}`;
    const result = await this.request(endpoint, { method: 'GET' });
    return result;
  }

  /**
   * 4. Assign Courier & AWB to a Shipment
   * Endpoint: POST /courier/assign/awb
   */
  async assignAwb(shipmentId, courierId = null) {
    if (!shipmentId) {
      throw new Error('shipment_id is required to assign AWB.');
    }

    const payload = { shipment_id: shipmentId };
    if (courierId) {
      payload.courier_id = courierId;
    }

    console.log(`[Shiprocket Service] Assigning AWB for shipment ${shipmentId}...`);
    const result = await this.request('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const respData = result.response?.data || result;
    return {
      success: true,
      data: {
        awb_code: respData.awb_code || result.awb_code,
        courier_name: respData.courier_name || result.courier_name,
        courier_company_id: respData.courier_company_id || courierId,
        shipment_id: shipmentId,
        assigned_date_time: respData.assigned_date_time,
        raw: result
      }
    };
  }

  /**
   * 5. Generate Shipping Label
   * Endpoint: POST /courier/generate/label
   */
  async generateLabel(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    if (ids.length === 0 || !ids[0]) {
      throw new Error('At least one valid shipment_id is required to generate label.');
    }

    console.log(`[Shiprocket Service] Generating label for shipment(s):`, ids);
    const result = await this.request('/courier/generate/label', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: ids })
    });

    return {
      success: true,
      label_url: result.label_url || result.label_created_url || (result.response && result.response.label_url),
      raw: result
    };
  }

  /**
   * 6. Generate Manifest
   * Endpoint: POST /manifests/generate
   */
  async generateManifest(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    if (ids.length === 0 || !ids[0]) {
      throw new Error('At least one valid shipment_id is required to generate manifest.');
    }

    console.log(`[Shiprocket Service] Generating manifest for shipment(s):`, ids);
    const result = await this.request('/manifests/generate', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: ids })
    });

    return {
      success: true,
      manifest_url: result.manifest_url || (result.response && result.response.manifest_url),
      raw: result
    };
  }

  /**
   * 7. Request Courier Pickup
   * Endpoint: POST /courier/generate/pickup
   */
  async requestPickup(shipmentIds, pickupDate = null) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    if (ids.length === 0 || !ids[0]) {
      throw new Error('At least one valid shipment_id is required to request pickup.');
    }

    const payload = { shipment_id: ids };
    if (pickupDate) {
      payload.pickup_date = Array.isArray(pickupDate) ? pickupDate : [pickupDate];
    }

    console.log(`[Shiprocket Service] Requesting pickup for shipment(s):`, ids);
    const result = await this.request('/courier/generate/pickup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      pickup_status: result.pickup_status || result.response?.pickup_status || 'PICKUP_SCHEDULED',
      pickup_token_number: result.response?.pickup_token_number || null,
      raw: result
    };
  }

  /**
   * 8. Track Shipment by AWB
   * Endpoint: GET /courier/track/awb/:awb
   */
  async trackAwb(awb) {
    if (!awb || String(awb).trim() === '') {
      throw new Error('AWB code is required to track shipment.');
    }

    const cleanAwb = String(awb).trim();
    console.log(`[Shiprocket Service] Fetching tracking for AWB ${cleanAwb}...`);
    const result = await this.request(`/courier/track/awb/${encodeURIComponent(cleanAwb)}`, {
      method: 'GET'
    });

    const trackingData = result.tracking_data || result;
    const trackObj = (trackingData.shipment_track && trackingData.shipment_track[0]) || trackingData;
    const scans = trackingData.shipment_track_activities || trackObj.scans || [];

    const formattedScans = scans.map(s => ({
      date: s['date'] || s['Date'] || s['scan_date_time'] || new Date().toISOString(),
      activity: s['activity'] || s['Activity'] || s['status'] || 'Status update',
      location: s['location'] || s['Location'] || s['scan_location'] || 'Processing Hub',
      sr_status: s['sr-status'] || s['status'] || ''
    }));

    return {
      success: true,
      data: {
        awb_code: cleanAwb,
        courier_name: trackObj.courier_name || trackingData.courier_name || 'Carrier',
        current_status: trackObj.current_status || trackingData.current_status || 'IN_TRANSIT',
        status_code: trackObj.status_code || null,
        etd: trackObj.expected_date || trackObj.edd || null,
        delivered_date: trackObj.delivered_date || null,
        origin: trackObj.origin || 'Vrindavan',
        destination: trackObj.destination || '',
        scans: formattedScans,
        raw: result
      }
    };
  }

  /**
   * 9. Cancel Order / Shipment
   * Endpoint: POST /orders/cancel
   */
  async cancelOrder(orderIds) {
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    if (ids.length === 0 || !ids[0]) {
      throw new Error('At least one order_id or shipment_id is required to cancel.');
    }

    console.log(`[Shiprocket Service] Cancelling order(s):`, ids);
    const result = await this.request('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });

    return {
      success: true,
      message: 'Shiprocket shipment cancelled successfully',
      raw: result
    };
  }
  /**
   * 10. Get Configured Pickup Locations
   * Endpoint: GET /settings/company/pickup
   */
  async getPickupLocations() {
    console.log('[Shiprocket Service] Fetching company pickup addresses...');
    const result = await this.request('/settings/company/pickup', {
      method: 'GET'
    });
    return result;
  }

  /**
   * 11. Get Orders List from Shiprocket
   * Endpoint: GET /orders
   */
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/orders?${query}` : '/orders';
    const result = await this.request(endpoint, { method: 'GET' });
    return result;
  }
}

module.exports = new ShiprocketService();
