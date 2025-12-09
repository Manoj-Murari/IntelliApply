
// src/lib/slices/createAuthSlice.js
import { supabase } from '../supabaseClient';

export const createAuthSlice = (set, get) => ({
    handleSignOut: async () => {
        set({ loading: true });
        const { error } = await supabase.auth.signOut();
        if (error) {
            get().addNotification(`Error signing out: ${error.message}`, 'error');
            set({ loading: false });
        } else {
            window.location.pathname = '/';
        }
        // Clear state
        set({
            allJobs: [],
            profiles: [],
            searches: [],
            selectedJob: null,
            loading: false,
            activeProfileId: null,
        });
    },
});
