import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace with your own Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
