import { get, set, del } from 'idb-keyval'
import { supabase } from '../lib/supabase'

export const storageService = {
    // Local File Storage (IndexedDB)
    async saveFileLocal(id, file) {
        try {
            await set(`resume_${id}`, file)
            console.log('File saved locally:', id)
            return true
        } catch (error) {
            console.error('Error saving file locally:', error)
            return false
        }
    },

    async getFileLocal(id) {
        return await get(`resume_${id}`)
    },

    async deleteFileLocal(id) {
        await del(`resume_${id}`)
    },

    // Cloud Metadata & Text Storage (Supabase)
    async syncProfileToCloud(profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
            .select()

        if (error) throw error
        return data
    },

    async getProfileFromCloud(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) throw error
        return data
    }
}
