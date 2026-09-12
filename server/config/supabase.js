const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    if (supabaseServiceKey && !supabaseServiceKey.includes('your-service-role-key')) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }
    console.log('[Database] Supabase client initialized successfully.');
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
