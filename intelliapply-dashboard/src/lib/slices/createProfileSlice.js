
// src/lib/slices/createProfileSlice.js
import { supabase } from '../supabaseClient';
import { API_BASE_URL, getAuthHeaders, getErrorMessage } from '../api';

export const createProfileSlice = (set, get) => ({
    profiles: [],
    searches: [], // Kept for legacy compatibility if needed to delete, but UI won't use it much
    activeProfileId: null,

    setActiveProfileId: (profileId) => set({ activeProfileId: profileId }),

    fetchProfiles: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        set({ profiles: data || [] });
    },

    fetchSearches: async () => {
        // Kept to not break load logic, but might be empty
        const { data, error } = await supabase
            .from('searches')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        set({ searches: data || [] });
    },

    handleSaveProfile: async (profile, file) => {
        set({ loading: true });
        let savedData = null;
        let user = null;
        try {
            const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
            if (userError || !authUser) throw new Error(userError?.message || 'You must be logged in to save a profile.');
            user = authUser;
            const { id, ...profileData } = profile;
            const dataToSave = { ...profileData, user_id: user.id };
            let error;
            if (id) {
                const { data, error: updateError } = await supabase.from('profiles').update(dataToSave).eq('id', id).select().single();
                error = updateError;
                savedData = data;
            } else {
                const { data, error: insertError } = await supabase.from('profiles').insert([dataToSave]).select().single();
                error = insertError;
                savedData = data;
            }
            if (error) throw error;

            if (file) {
                console.warn("File upload is being deprecated, but a file was passed. Ignoring file.");
            }

            get().addNotification('Profile saved!');
            if (id) {
                set((state) => ({
                    profiles: state.profiles.map(p => p.id === savedData.id ? savedData : p),
                    loading: false
                }));
            } else {
                set((state) => ({
                    profiles: [savedData, ...state.profiles],
                    loading: false
                }));
            }
            if (get().profiles.length === 1 && savedData) {
                set({ activeProfileId: savedData.id });
            }
        } catch (error) {
            get().addNotification(`Error saving profile: ${error.message}`, 'error');
            set({ loading: false });
        }
    },

    handleDeleteProfile: async (id) => {
        await supabase.from('profiles').delete().eq('id', id);
        get().addNotification('Profile deleted.');
        const remainingProfiles = get().profiles.filter((p) => p.id !== id);
        set({ profiles: remainingProfiles });
        if (get().activeProfileId === id) {
            set({ activeProfileId: remainingProfiles.length > 0 ? remainingProfiles[0].id : null });
        }
        get().closeConfirmationModal();
    },

    // Legacy search handling - kept minimal for deletion if user wants to clean up
    handleDeleteSearch: async (id) => {
        await supabase.from('searches').delete().eq('id', id);
        get().addNotification('Search deleted.');
        set((state) => ({ searches: state.searches.filter((s) => s.id !== id) }));
        get().closeConfirmationModal();
    },

    handleSaveSearch: async (search) => {
        // Deprecated but kept to avoid crash if UI calls it
        get().addNotification('Saved searches are deprecated.', 'warning');
    }
});
