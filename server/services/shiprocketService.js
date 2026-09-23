require('dotenv').config();

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external';

class ShiprocketService {
  constructor() {
    this.token = null;
    this.tokenExpiresAt = null;
    this.authPromise = null;
    // In-memory cache for live rate requests (TTL 10 minutes)
    this.rateCache = new Map();
    this.RATE_CACHE_TTL_MS = 10 * 60 * 1000;
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
    // Re-use cached token if still valid (valid for 8 days from 10-day issue)
    if (!forceRefresh && this.token && this.tokenExpiresAt && this.tokenExpiresAt > now) {
      return this.token;
    }

    // Deduplicate simultaneous auth requests
    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      try {
        console.log('[Shiprocket Auth] Requesting authentication token from Shiprocket API...');
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
   * Centralized Shipment Weight & Dimensions Calculation
   * Supports grams, kg, packaging weight, and composite packaging dimensions.
   */
  calculateShipmentPackage(cartItems = [], options = {}) {
    const defaultPackagingGrams = parseFloat(process.env.DEFAULT_PACKAGING_WEIGHT_GRAMS || '47');
    const defaultLength = parseFloat(process.env.DEFAULT_PACKAGE_LENGTH_CM || '15');
    const defaultBreadth = parseFloat(process.env.DEFAULT_PACKAGE_BREADTH_CM || '10');
    const defaultHeight = parseFloat(process.env.DEFAULT_PACKAGE_HEIGHT_CM || '3');

    const items = Array.isArray(cartItems) ? cartItems : [];
    let totalItemsWeightGrams = 0;
    let totalUnits = 0;

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity || item.qty || item.units, 10) || 1);
      totalUnits += qty;

      let itemWeightGrams = 0;
      if (item.weight_grams !== undefined && item.weight_grams !== null) {
        itemWeightGrams = parseFloat(item.weight_grams) || 0;
      } else if (item.weight !== undefined && item.weight !== null) {
        const rawW = parseFloat(item.weight) || 0;
        // If raw weight < 1, assume kg (e.g. 0.003 kg = 3 grams or 0.25 kg = 250 grams)
        // If raw weight >= 1, assume grams if > 5 or kg otherwise
        itemWeightGrams = rawW < 1 ? rawW * 1000 : (rawW < 5 ? rawW * 1000 : rawW);
      } else {
        // Default 25 grams for lightweight sacred devotional items (e.g. keychain, japa mala)
        itemWeightGrams = 25.0;
      }

      totalItemsWeightGrams += itemWeightGrams * qty;
    }

    // Add packaging weight (e.g. 47g box + bubble mailer)
    const packagingGrams = items.length > 0 ? defaultPackagingGrams : 0;
    const totalGrossWeightGrams = totalItemsWeightGrams + packagingGrams;

    // Convert to KG with a safe minimum of 0.05 kg (50 grams) for Shiprocket rate checking
    const weightKg = Math.max(0.05, Math.round((totalGrossWeightGrams / 1000) * 1000) / 1000);

    // Package dimensions calculation (cm)
    // Multi-item carts slightly increase package height/thickness safely
    const extraHeight = Math.max(0, (totalUnits - 1) * 0.8);
    const lengthCm = Math.max(5, parseFloat(options.length || defaultLength));
    const breadthCm = Math.max(5, parseFloat(options.breadth || defaultBreadth));
    const heightCm = Math.max(2, parseFloat(options.height || (defaultHeight + extraHeight)));

    // Volumetric weight: (L x B x H) / 5000 in kg
    const volumetricWeightKg = Math.round(((lengthCm * breadthCm * heightCm) / 5000) * 1000) / 1000;
    const chargeableWeightKg = Math.max(weightKg, volumetricWeightKg);

    return {
      weightKg,
      itemsWeightGrams: totalItemsWeightGrams,
      packagingWeightGrams: packagingGrams,
      grossWeightGrams: totalGrossWeightGrams,
      lengthCm,
      breadthCm,
      heightCm,
      volumetricWeightKg,
      chargeableWeightKg,
      totalUnits
    };
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
   * 2. Live Shipping Rate Check Endpoint
   * Checks courier serviceability, fetches live rates, applies selection mode, and caches results.
   */
  async checkRates({ deliveryPincode, pickupPincode = null, weight = null, length = null, breadth = null, height = null, paymentMethod = 'Prepaid', orderValue = 0, items = [] }) {
    const cleanDelivery = String(deliveryPincode || '').replace(/\D/g, '').trim();
    if (cleanDelivery.length !== 6) {
      throw new Error('Valid 6-digit Indian delivery pincode is required.');
    }

    const pickup = String(pickupPincode || process.env.SHIPROCKET_PICKUP_PINCODE || '281121').replace(/\D/g, '').trim();
    const isCod = String(paymentMethod || '').toLowerCase() === 'cod';
    const codFlag = isCod ? 1 : 0;
    const declaredValue = Math.max(1, parseFloat(orderValue || 0));

    // Calculate package weight & dimensions
    const pkg = this.calculateShipmentPackage(items, { length, breadth, height });
    const finalWeightKg = weight ? Math.max(0.05, parseFloat(weight)) : pkg.weightKg;
    const finalLength = length ? parseFloat(length) : pkg.lengthCm;
    const finalBreadth = breadth ? parseFloat(breadth) : pkg.breadthCm;
    const finalHeight = height ? parseFloat(height) : pkg.heightCm;

    // Check Rate Cache (TTL: 10 minutes)
    const cacheKey = `rate_${pickup}_${cleanDelivery}_${finalWeightKg}_${finalLength}_${finalBreadth}_${finalHeight}_${codFlag}_${Math.round(declaredValue)}`;
    const cached = this.rateCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      console.log(`[Shiprocket Rate Cache] Hit for ${cleanDelivery} (${isCod ? 'COD' : 'Prepaid'}) -> Rate: ₹${cached.data.shippingRate}`);
      return cached.data;
    }

    // If Shiprocket is not configured or in testing environment, return standard calculated rate
    if (!this.isConfigured() || process.env.DISABLE_SHIPROCKET_ORDERS === 'true') {
      console.log(`[Shiprocket Rate Mock] Shiprocket not configured in .env. Providing standard calculated devotional delivery rate.`);
      const mockFreight = 75.72;
      const mockCodFee = isCod ? 52.00 : 0.00;
      const mockSmartOrder = 5.00;
      const mockTotal = Math.round((mockFreight + mockCodFee + mockSmartOrder) * 100) / 100;

      const fallbackResult = {
        success: true,
        serviceable: true,
        shippingRate: mockFreight,
        freightCharge: mockFreight,
        codCharges: mockCodFee,
        smartOrderCharge: mockSmartOrder,
        totalShippingCharge: mockTotal,
        estimatedDelivery: '2–4 days',
        estimatedDays: 3,
        courierName: 'Shiprocket Express Partner (Delhivery Surface)',
        courierCompanyId: 1,
        chargeableWeight: finalWeightKg,
        packageWeight: finalWeightKg,
        packageDimensions: { length: finalLength, breadth: finalBreadth, height: finalHeight },
        availableCouriersCount: 5,
        courierSelectionMode: 'standard_fallback',
        isMock: true
      };

      this.rateCache.set(cacheKey, { data: fallbackResult, expiresAt: now + this.RATE_CACHE_TTL_MS });
      return fallbackResult;
    }

    // Call Shiprocket Serviceability API
    console.log(`[Shiprocket Rate Request] Checking serviceability: Pickup ${pickup} -> Delivery ${cleanDelivery}, Weight ${finalWeightKg}kg, COD: ${codFlag}...`);
    const endpoint = `/courier/serviceability/?pickup_postcode=${encodeURIComponent(pickup)}&delivery_postcode=${encodeURIComponent(cleanDelivery)}&weight=${finalWeightKg}&cod=${codFlag}&declared_value=${encodeURIComponent(declaredValue)}&length=${finalLength}&breadth=${finalBreadth}&height=${finalHeight}`;
    
    const srResponse = await this.request(endpoint, { method: 'GET' });
    const availableCouriers = srResponse?.data?.available_courier_companies || [];

    if (!availableCouriers || availableCouriers.length === 0) {
      console.warn(`[Shiprocket Rate Warning] Pincode ${cleanDelivery} is not serviceable via available couriers.`);
      return {
        success: true,
        serviceable: false,
        message: 'Delivery is currently unavailable for this PIN code.',
        pincode: cleanDelivery
      };
    }

    // Filter couriers based on COD serviceability if COD selected
    const eligibleCouriers = isCod
      ? availableCouriers.filter(c => c.cod === 1 || c.is_cod === 1 || (c.cod_charges !== undefined && c.cod_charges !== null))
      : availableCouriers;

    const courierPool = eligibleCouriers.length > 0 ? eligibleCouriers : availableCouriers;

    // Apply Courier Selection Strategy
    const selectionMode = (process.env.SHIPROCKET_COURIER_SELECTION_MODE || 'cheapest').toLowerCase();
    let selectedCourier = courierPool[0];

    if (selectionMode === 'fastest') {
      selectedCourier = [...courierPool].sort((a, b) => {
        const etdA = parseInt(a.estimated_delivery_days || a.etd_hours || 99, 10);
        const etdB = parseInt(b.estimated_delivery_days || b.etd_hours || 99, 10);
        return etdA - etdB;
      })[0];
    } else if (selectionMode === 'best_rated') {
      selectedCourier = [...courierPool].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))[0];
    } else if (selectionMode === 'preferred') {
      const preferredName = (process.env.SHIPROCKET_PREFERRED_COURIER || 'Delhivery').toLowerCase();
      const match = courierPool.find(c => (c.courier_name || '').toLowerCase().includes(preferredName));
      selectedCourier = match || courierPool[0];
    } else {
      // Default: 'cheapest' rate
      selectedCourier = [...courierPool].sort((a, b) => (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0))[0];
    }

    const freightCharge = Math.round((parseFloat(selectedCourier.rate || selectedCourier.freight_charge || 0)) * 100) / 100;
    const codCharges = isCod ? Math.round((parseFloat(selectedCourier.cod_charges || 0)) * 100) / 100 : 0;
    const smartOrderCharge = 5.00;
    const totalShippingCharge = Math.round((freightCharge + codCharges) * 100) / 100;

    const etdString = selectedCourier.etd || (selectedCourier.estimated_delivery_days ? `${selectedCourier.estimated_delivery_days} days` : '2–4 days');
    const estimatedDays = parseInt(selectedCourier.estimated_delivery_days, 10) || 3;

    const rateResult = {
      success: true,
      serviceable: true,
      shippingRate: freightCharge,
      freightCharge: freightCharge,
      codCharges: codCharges,
      smartOrderCharge: smartOrderCharge,
      totalShippingCharge: totalShippingCharge,
      estimatedDelivery: etdString,
      estimatedDays: estimatedDays,
      courierName: selectedCourier.courier_name || 'Shiprocket Express Partner',
      courierCompanyId: selectedCourier.courier_company_id,
      chargeableWeight: selectedCourier.charge_weight || finalWeightKg,
      packageWeight: finalWeightKg,
      packageDimensions: { length: finalLength, breadth: finalBreadth, height: finalHeight },
      availableCouriersCount: availableCouriers.length,
      courierSelectionMode: selectionMode
    };

    // Cache the result
    this.rateCache.set(cacheKey, { data: rateResult, expiresAt: now + this.RATE_CACHE_TTL_MS });
    console.log(`[Shiprocket Rate Success] ${cleanDelivery} (${isCod ? 'COD' : 'Prepaid'}) -> Courier: ${rateResult.courierName}, Rate: ₹${rateResult.shippingRate}`);

    return rateResult;
  }

  /**
   * 3. Create Order in Shiprocket
   * Endpoint: POST /orders/create/adhoc
   */
  async createOrder(orderData) {
    if (!orderData || !orderData.order_number) {
      throw new Error('Valid order data with order_number is required.');
    }

    const shipAddr = orderData.shipping_address || {};
    const billAddr = orderData.billing_address || shipAddr;

    // Parse customer name into first & last name
    const rawName = (shipAddr.name || orderData.guest_name || orderData.customer || 'Customer').trim();
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Format order date: YYYY-MM-DD HH:mm
    const dateObj = orderData.created_at ? new Date(orderData.created_at) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const orderDateFormatted = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;

    // Map items and calculate weight & packaging
    const rawItems = orderData.items || orderData.order_items || [];
    const pkg = this.calculateShipmentPackage(rawItems, {
      length: orderData.length,
      breadth: orderData.breadth,
      height: orderData.height
    });

    const orderItemsPayload = rawItems.map((item, idx) => {
      const unitPrice = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity || item.qty || 1, 10) || 1;

      return {
        name: (item.product_name || item.name || `Devotional Item ${idx + 1}`).substring(0, 100),
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
    const isCod = String(orderData.payment_method || '').toLowerCase().includes('cod');
    const paymentMethod = isCod ? 'COD' : 'Prepaid';

    const payload = {
      order_id: orderData.order_number,
      order_date: orderDateFormatted,
      pickup_location: (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary').trim(),
      
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shipAddr.address_line_1 || shipAddr.address || 'Address Line 1',
      billing_address_2: shipAddr.address_line_2 || shipAddr.village || '',
      billing_city: shipAddr.city || 'Vrindavan',
      billing_pincode: String(shipAddr.postal_code || shipAddr.pin || shipAddr.pincode || '281121').replace(/\D/g, ''),
      billing_state: shipAddr.state || 'Uttar Pradesh',
      billing_country: shipAddr.country || 'India',
      billing_email: shipAddr.email || orderData.guest_email || orderData.email || 'orders@harinama.store',
      billing_phone: String(shipAddr.phone || orderData.phone || '9999999999').replace(/\D/g, '').slice(-10),

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
      shipping_charges: parseFloat(orderData.shipping_fee || orderData.shipping || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: parseFloat(orderData.discount || 0),
      sub_total: subTotal,

      length: pkg.lengthCm,
      breadth: pkg.breadthCm,
      height: pkg.heightCm,
      weight: pkg.weightKg
    };

    console.log(`[Shiprocket Service] Creating adhoc order for ${orderData.order_number} (${pkg.weightKg}kg, ${pkg.lengthCm}x${pkg.breadthCm}x${pkg.heightCm}cm)...`);
    const result = await this.request('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Strict validation: Verify response contains valid order_id and shipment_id
    if (!result || !result.order_id || !result.shipment_id || (result.status_code && Number(result.status_code) >= 400)) {
      const errMsg = result?.message || (result?.errors ? (typeof result.errors === 'string' ? result.errors : JSON.stringify(result.errors)) : 'Shiprocket did not return valid order and shipment identifiers');
      const err = new Error(errMsg);
      err.shiprocketData = result;
      throw err;
    }

    return {
      success: true,
      data: {
        order_id: result.order_id,
        shipment_id: result.shipment_id,
        status: result.status || 'NEW',
        status_code: result.status_code || 1,
        onboarding_completed_now: result.onboarding_completed_now,
        awb_code: result.awb_code || null,
        courier_name: result.courier_name || null,
        shipping_charge: parseFloat(orderData.shipping_fee || orderData.shipping || 0),
        chargeable_weight: pkg.chargeableWeightKg,
        raw: result
      }
    };
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
   * 10. Get Orders List from Shiprocket
   * Endpoint: GET /orders
   */
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/orders?${query}` : '/orders';
    const result = await this.request(endpoint, { method: 'GET' });
    return result;
  }

  /**
   * 11. Search Order in Shiprocket by Channel Order ID or ID
   * Endpoint: GET /orders?search=...
   */
  async searchOrder(orderNumber) {
    if (!orderNumber || String(orderNumber).trim() === '') return null;
    const cleanNum = String(orderNumber).trim();
    try {
      console.log(`[Shiprocket Service] Searching for existing order ${cleanNum}...`);
      const res = await this.getOrders({ search: cleanNum });
      const list = res?.data || [];
      const matched = list.find(o =>
        String(o.channel_order_id || '').trim().toLowerCase() === cleanNum.toLowerCase() ||
        String(o.id || '') === cleanNum
      );

      if (matched && matched.id) {
        const shipment = (matched.shipments && matched.shipments[0]) || {};
        return {
          exists: true,
          order_id: matched.id,
          shipment_id: shipment.id || matched.shipment_id || null,
          status: matched.status || 'NEW',
          status_code: matched.status_code || 1,
          awb_code: shipment.awb_code || matched.awb_code || null,
          courier_name: shipment.courier_name || matched.courier_name || null,
          raw: matched
        };
      }
      return null;
    } catch (err) {
      console.warn(`[Shiprocket Search] Search failed for ${cleanNum}:`, err.message);
      return null;
    }
  }
}

module.exports = new ShiprocketService();
