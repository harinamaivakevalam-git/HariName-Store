const dns = require('dns');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// DNS Resilience for Supabase Anycast:
// Fixes Indian ISP (e.g. ACT Fibernet) transparent DNS proxy / pollution on port 53 returning local proxy IPs
const SUPABASE_ANYCAST_IPS = ['104.18.38.10', '172.64.149.246'];
let lastIpIndex = 0;

const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  if (typeof hostname === 'string' && hostname.endsWith('.supabase.co')) {
    const ip = SUPABASE_ANYCAST_IPS[lastIpIndex % SUPABASE_ANYCAST_IPS.length];
    lastIpIndex++;
    if (typeof options === 'object' && options && options.all) {
      return callback(null, [{ address: ip, family: 4 }]);
    }
    return callback(null, ip, 4);
  }
  
  return originalLookup.call(dns, hostname, options, callback);
};

// Optionally refresh Anycast IPs via Cloudflare DoH in the background
if (typeof fetch === 'function') {
  fetch('https://cloudflare-dns.com/dns-query?name=wnaqfadlxrrvvjvqqbch.supabase.co&type=A', {
    headers: { Accept: 'application/dns-json' }
  })
    .then(r => r.json())
    .then(data => {
      if (data && Array.isArray(data.Answer) && data.Answer.length > 0) {
        const freshIps = data.Answer.filter(a => a.type === 1).map(a => a.data);
        if (freshIps.length > 0) {
          SUPABASE_ANYCAST_IPS.length = 0;
          SUPABASE_ANYCAST_IPS.push(...freshIps);
        }
      }
    })
    .catch(() => {
      // Keep initial Cloudflare Anycast fallback IPs
    });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;

const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    if (supabaseServiceKey && !supabaseServiceKey.includes('your-service-role-key')) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
    console.log('[Database] Supabase client initialized with DNS resilience.');
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client:', err.message);
    supabase = null;
    supabaseAdmin = null;
  }
} else {
  console.log('[Database] Running in Local Storage Mode (Ready for Supabase PostgreSQL configuration).');
}

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured
};
