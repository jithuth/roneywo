import { createClient } from '@supabase/supabase-js';

// Configuration for Supabase
// Replace these with your actual Project URL and Anon Key from Supabase Dashboard
const supabaseUrl = process.env.SUPABASE_URL || 'https://kllivcbepxbrymyiulcf.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbGl2Y2JlcHhicnlteWl1bGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NzU5MDMsImV4cCI6MjA3OTQ1MTkwM30.K4wSJLxIRLFKp2zmDr1-YDOVTO_QW4W9NPMnUByLBxI';

export const supabase = createClient(supabaseUrl, supabaseKey);