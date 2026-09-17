const https = require('https');
const http = require('http');

// In-memory cache for ultra-fast repeated lookups
const pincodeCache = new Map();

// Built-in Indian Postal state code lookup table for instant fallback
const PIN_PREFIX_STATE_MAP = {
  '11': { state: 'Delhi', city: 'New Delhi' },
  '12': { state: 'Haryana', city: 'Gurugram / Faridabad' },
  '13': { state: 'Haryana', city: 'Ambala / Panipat' },
  '14': { state: 'Punjab', city: 'Ludhiana / Jalandhar' },
  '15': { state: 'Punjab', city: 'Bathinda / Firozpur' },
  '16': { state: 'Chandigarh', city: 'Chandigarh' },
  '17': { state: 'Himachal Pradesh', city: 'Shimla' },
  '18': { state: 'Jammu and Kashmir', city: 'Jammu' },
  '19': { state: 'Jammu and Kashmir', city: 'Srinagar' },
  '20': { state: 'Uttar Pradesh', city: 'Ghaziabad / Noida' },
  '21': { state: 'Uttar Pradesh', city: 'Allahabad / Prayagraj' },
  '22': { state: 'Uttar Pradesh', city: 'Lucknow / Varanasi' },
  '23': { state: 'Uttar Pradesh', city: 'Mirzapur' },
  '24': { state: 'Uttar Pradesh', city: 'Bareilly / Moradabad' },
  '25': { state: 'Uttar Pradesh', city: 'Meerut' },
  '26': { state: 'Uttar Pradesh', city: 'Pilibhit / Sitapur' },
  '27': { state: 'Uttar Pradesh', city: 'Gorakhpur / Faizabad' },
  '28': { state: 'Uttar Pradesh', city: 'Mathura / Agra / Jhansi' },
  '30': { state: 'Rajasthan', city: 'Jaipur' },
  '31': { state: 'Rajasthan', city: 'Udaipur' },
  '32': { state: 'Rajasthan', city: 'Kota' },
  '33': { state: 'Rajasthan', city: 'Bikaner' },
  '34': { state: 'Rajasthan', city: 'Jodhpur' },
  '36': { state: 'Gujarat', city: 'Rajkot' },
  '37': { state: 'Gujarat', city: 'Jamnagar' },
  '38': { state: 'Gujarat', city: 'Ahmedabad' },
  '39': { state: 'Gujarat', city: 'Surat / Vadodara' },
  '40': { state: 'Maharashtra', city: 'Mumbai' },
  '41': { state: 'Maharashtra', city: 'Pune' },
  '42': { state: 'Maharashtra', city: 'Nashik' },
  '43': { state: 'Maharashtra', city: 'Aurangabad' },
  '44': { state: 'Maharashtra', city: 'Nagpur' },
  '45': { state: 'Madhya Pradesh', city: 'Indore' },
  '46': { state: 'Madhya Pradesh', city: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', city: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', city: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', city: 'Raipur' },
  '50': { state: 'Telangana', city: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', city: 'Tirupati / Kadapa' },
  '52': { state: 'Andhra Pradesh', city: 'Vijayawada / Guntur' },
  '53': { state: 'Andhra Pradesh', city: 'Visakhapatnam' },
  '56': { state: 'Karnataka', city: 'Bengaluru' },
  '57': { state: 'Karnataka', city: 'Mangaluru / Mysuru' },
  '58': { state: 'Karnataka', city: 'Hubballi / Belagavi' },
  '59': { state: 'Karnataka', city: 'Belagavi' },
  '60': { state: 'Tamil Nadu', city: 'Chennai' },
  '61': { state: 'Tamil Nadu', city: 'Thanjavur' },
  '62': { state: 'Tamil Nadu', city: 'Madurai' },
  '63': { state: 'Tamil Nadu', city: 'Salem / Vellore' },
  '64': { state: 'Tamil Nadu', city: 'Coimbatore' },
  '67': { state: 'Kerala', city: 'Kozhikode' },
  '68': { state: 'Kerala', city: 'Kochi / Ernakulam' },
  '69': { state: 'Kerala', city: 'Thiruvananthapuram' },
  '70': { state: 'West Bengal', city: 'Kolkata' },
  '71': { state: 'West Bengal', city: 'Howrah' },
  '72': { state: 'West Bengal', city: 'Midnapore' },
  '73': { state: 'West Bengal', city: 'Siliguri / Darjeeling' },
  '74': { state: 'West Bengal', city: 'Mayapur / Nadia' },
  '75': { state: 'Odisha', city: 'Bhubaneswar / Puri' },
  '76': { state: 'Odisha', city: 'Cuttack / Sambalpur' },
  '78': { state: 'Assam', city: 'Guwahati' },
  '79': { state: 'Northeast', city: 'Shillong / Agartala / Imphal' },
  '80': { state: 'Bihar', city: 'Patna' },
  '81': { state: 'Bihar', city: 'Bhagalpur' },
  '82': { state: 'Bihar', city: 'Gaya' },
  '83': { state: 'Jharkhand', city: 'Ranchi / Jamshedpur' },
  '84': { state: 'Bihar', city: 'Muzaffarpur' },
  '85': { state: 'Bihar', city: 'Purnia' }
};

// Known popular spiritual and major pin codes
const SPECIAL_PINCODES = {
  '281121': {
    city: 'Mathura',
    district: 'Mathura',
    state: 'Uttar Pradesh',
    villages: ['Vrindaban', 'Raman Rati', 'Loi Bazar', 'Leela Dham', 'G.N. Bazar', 'Manav Sew Shangh', 'Sri Bankey Bihari Ji']
  },
  '281001': {
    city: 'Mathura',
    district: 'Mathura',
    state: 'Uttar Pradesh',
    villages: ['Mathura Head Post Office', 'Krishna Nagar', 'Janmabhoomi', 'Dampier Nagar']
  },
  '741313': {
    city: 'Nadia',
    district: 'Nadia',
    state: 'West Bengal',
    villages: ['Mayapur ISKCON', 'Bamanpukur', 'Nabadwip', 'Sridham Mayapur']
  },
  '752001': {
    city: 'Puri',
    district: 'Puri',
    state: 'Odisha',
    villages: ['Puri Town', 'Jagannath Temple Area', 'Grand Road', 'Sea Beach']
  },
  '517501': {
    city: 'Tirupati',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    villages: ['Tirupati City', 'Tirumala Hills', 'Bhavani Nagar', 'KT Road']
  },
  '560001': {
    city: 'Bengaluru',
    district: 'Bangalore Urban',
    state: 'Karnataka',
    villages: ['Mahatma Gandhi Road', 'Vidhana Soudha', 'High Court', 'Rajbhavan', 'Vasanthanagar']
  },
  '110001': {
    city: 'New Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    villages: ['Connaught Place', 'Janpath', 'Barakhamba Road', 'Parliament Street']
  },
  '400001': {
    city: 'Mumbai',
    district: 'Mumbai',
    state: 'Maharashtra',
    villages: ['Fort', 'Nariman Point', 'Colaba', 'Marine Lines', 'Churchgate']
  }
};

// Helper: HTTP GET JSON with timeout
function fetchJson(url, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const req = client.get(url, { headers: { 'User-Agent': 'HarinamaStore/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

// Controller: Get Pincode Details
exports.getPincodeDetails = async (req, res) => {
  try {
    const rawPin = req.params.pincode || req.query.pin || '';
    const pin = rawPin.trim().replace(/\D/g, '');

    if (pin.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Indian PIN code. Must be 6 digits.'
      });
    }

    // 1. Check in-memory cache
    if (pincodeCache.has(pin)) {
      return res.json(pincodeCache.get(pin));
    }

    // 2. Check special pre-cached locations
    if (SPECIAL_PINCODES[pin]) {
      const responseData = {
        success: true,
        pincode: pin,
        ...SPECIAL_PINCODES[pin],
        source: 'local_optimized'
      };
      pincodeCache.set(pin, responseData);
      return res.json(responseData);
    }

    let resolvedData = null;

    // 0. Primary Provider: Official Google Maps Geocoding API
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || req.query.google_key || req.query.key;
    if (googleApiKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pin)}&components=country:IN&key=${encodeURIComponent(googleApiKey)}`;
        const gData = await fetchJson(gUrl, 3000);
        if (gData && gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
          const result = gData.results[0];
          const components = result.address_components || [];
          
          let city = '';
          let district = '';
          let state = '';
          let sublocalities = [];

          for (const c of components) {
            const types = c.types || [];
            if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('sublocality_level_2') || types.includes('neighborhood')) {
              sublocalities.push(c.long_name);
            }
            if (types.includes('locality')) {
              city = c.long_name;
            } else if (!city && types.includes('administrative_area_level_2')) {
              district = c.long_name;
            } else if (!city && types.includes('postal_town')) {
              city = c.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = c.long_name;
            }
          }

          // Aggregate all sublocalities and areas across matching place results
          gData.results.forEach(r => {
            (r.address_components || []).forEach(c => {
              const types = c.types || [];
              if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood') || types.includes('point_of_interest')) {
                if (!sublocalities.includes(c.long_name)) sublocalities.push(c.long_name);
              }
            });
          });

          resolvedData = {
            success: true,
            pincode: pin,
            city: city || district || (sublocalities[0] || 'City'),
            district: district || city || '',
            state: state || '',
            formatted_address: result.formatted_address,
            villages: sublocalities.length > 0 ? sublocalities : [city || district || 'Main Area'],
            source: 'google_maps'
          };
        }
      } catch (gErr) {
        console.warn('[Google Maps Geocode Notice]:', gErr.message);
      }
    }

    // 3. Fast Provider: Zippopotam (Sub-300ms response)
    if (!resolvedData) {
      try {
        const zipRes = await fetchJson(`https://api.zippopotam.us/in/${pin}`, 1800);
        if (zipRes && Array.isArray(zipRes.places) && zipRes.places.length > 0) {
          const primary = zipRes.places[0];
          const villages = zipRes.places.map(p => p['place name']).filter(Boolean);
          resolvedData = {
            success: true,
            pincode: pin,
            city: primary['place name'] || primary.state || 'City',
            district: primary['place name'] || '',
            state: primary.state || '',
            villages: villages.length > 0 ? villages : [primary['place name']],
            source: 'fast_gateway'
          };
        }
      } catch (_) {}
    }

    // 4. Postal Pincode India Provider (if primary didn't resolve)
    if (!resolvedData) {
      try {
        const postRes = await fetchJson(`https://api.postalpincode.in/pincode/${pin}`, 2000);
        if (Array.isArray(postRes) && postRes[0] && postRes[0].Status === 'Success' && Array.isArray(postRes[0].PostOffice) && postRes[0].PostOffice.length > 0) {
          const offices = postRes[0].PostOffice;
          const primary = offices[0];
          resolvedData = {
            success: true,
            pincode: pin,
            city: primary.District || primary.Division || primary.Block || primary.Name,
            district: primary.District || primary.Division || '',
            state: primary.State || '',
            villages: [...new Set(offices.map(o => o.Name).filter(Boolean))],
            source: 'india_post'
          };
        }
      } catch (_) {}
    }

    // 5. Intelligent Fallback based on Indian Postal Region Prefix
    if (!resolvedData) {
      const prefix = pin.substring(0, 2);
      const fallback = PIN_PREFIX_STATE_MAP[prefix];
      if (fallback) {
        resolvedData = {
          success: true,
          pincode: pin,
          city: fallback.city.split('/')[0].trim(),
          district: fallback.city.split('/')[0].trim(),
          state: fallback.state,
          villages: [fallback.city.split('/')[0].trim(), 'Main Area'],
          source: 'postal_prefix_heuristics'
        };
      }
    }

    if (resolvedData) {
      pincodeCache.set(pin, resolvedData);
      return res.json(resolvedData);
    }

    return res.status(404).json({
      success: false,
      message: `No postal records found for PIN code ${pin}. Please enter City and State manually.`
    });

  } catch (error) {
    console.error('[Pincode Lookup Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to lookup PIN code. Please enter manually.'
    });
  }
};
