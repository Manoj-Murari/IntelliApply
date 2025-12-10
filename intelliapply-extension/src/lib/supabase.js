
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://clrmyzkwdkxqawxqnsnx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscm15emt3ZGt4cWF3eHFuc254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTUxMTksImV4cCI6MjA2OTM5MTExOX0.2b7pOp4N54TDA4L-KRx9vb0V-3FxoNNe0HmLetFrceo';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Key missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: localStorage, // Explicitly set storage just in case
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // Disable for extension to prevent URL messing
    }
});
