const dns = require('dns');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// High-speed Cloudflare Anycast IPs for *.supabase.co (Direct global Anycast network)
// Bypasses local ISP transparent DNS proxies and packet drops completely
const SUPABASE_ANYCAST_IPS = [
  '104.18.38.10',
  '172.64.149.246',
  '104.18.39.10',
  '172.64.148.246'
];
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
      auth: { persistSession: false },
      global: {
        headers: { 'x-client-info': 'harinama-store-fast' }
      }
    });
    if (supabaseServiceKey && !supabaseServiceKey.includes('your-service-role-key')) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: { 'x-client-info': 'harinama-store-admin-fast' }
        }
      });
    }
    console.log('[Database] Supabase client initialized with Ultra-Fast Anycast DNS.');
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client:', err.message);
    supabase = null;
    supabaseAdmin = null;
  }
} else {
  console.log('[Database] Running in Local Storage Mode.');
}

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured
};
