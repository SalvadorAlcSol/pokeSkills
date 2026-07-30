import { createClient } from '@supabase/supabase-js';

// Default Supabase project credentials for Pokeroutes Cloud DB
const DEFAULT_SUPABASE_URL = "https://umsupgxwnxkcrkyjrbdo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtc3VwZ3h3bnhrY3JreWpyYmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODAyNTQsImV4cCI6MjA4Njg1MjI1NH0.rSFYoUZSG5KpKCF6pthvoxKHUTeHHO1nXCpSrpe4UJU";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
