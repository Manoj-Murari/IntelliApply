import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { storageService } from '../services/storageService'
import { resumeParserService } from '../services/resumeParserService'

export const useProfileStore = create((set, get) => ({
    profiles: [],
    isLoading: false,
    error: null,

    fetchProfiles: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            set({ profiles: data || [] })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ isLoading: false })
        }
    },

    addProfile: async (file) => {
        set({ isLoading: true })
        try {
            // 1. Generate ID (can use UUID or simple timestamp for now if no user session, 
            // but usually Supabase RLS requires auth. Assuming User is logged in or using generic flow).
            // We'll let Supabase generate ID or use a UUID lib. 
            // For now, let's parse first.

            // 2. Parse Text
            const text = await resumeParserService.parseFile(file)

            // 3. Create Metadata
            const newProfile = {
                filename: file.name,
                resume_context: text,
                // user_id: ... // Managed by Supabase Auth Context usually
                updated_at: new Date().toISOString(),
            }

            // 4. Save to Cloud to get ID
            const [savedData] = await storageService.syncProfileToCloud(newProfile)
            if (!savedData) throw new Error('Failed to save to cloud')

            // 5. Save File Locally using Cloud ID
            await storageService.saveFileLocal(savedData.id, file)

            // 6. Update State
            set(state => ({ profiles: [savedData, ...state.profiles] }))
            return savedData
        } catch (error) {
            console.error(error)
            set({ error: error.message })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    loadProfileFile: async (id) => {
        return await storageService.getFileLocal(id)
    }
}))
