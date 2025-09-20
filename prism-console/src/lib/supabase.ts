import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace with your own Supabase project URL and anon key
const supabaseUrl = 'https://cyqbzzzvkrjmngvoszaf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cWJ6enp2a3JqbW5ndm9zemFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjM5MzEsImV4cCI6MjA3MzUzOTkzMX0.DXrFOkeKSowb5q-SuWtmk5EFqBp3cvobWdsYWKU-dFo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
