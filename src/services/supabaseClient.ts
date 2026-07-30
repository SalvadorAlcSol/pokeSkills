import { createClient } from '@supabase/supabase-js';

// Supabase project credentials for Pokeroutes Cloud DB
const DEFAULT_SUPABASE_URL = "https://umsupgxwnxkcrkyjrbdo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_Uau06BugT_H5FYB22qnXSg_laI1bAY7";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
