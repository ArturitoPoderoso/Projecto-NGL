import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nyvlmeuwiyulnnrgblte.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dmxtZXV3aXl1bG5ucmdibHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNTMyNTYsImV4cCI6MjEwNzgyOTI1Nn0.hXo49rZQq8VwPtSt2ya9b2WIiF7YrgSBMImd2pmGlSA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
