
// src/lib/api.js
import { supabase } from './supabaseClient';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api/v1';

export const getAuthHeaders = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
        console.warn('Error getting session for API request, using anonymous headers.');
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
    };
};

export const getErrorMessage = async (response) => {
    try {
        const data = await response.json();
        if (data.detail) {
            try {
                const errorObj = JSON.parse(data.detail);
                return errorObj.message || data.detail;
            } catch (e) {
                return data.detail;
            }
        }
    } catch (e) {
        // failed to parse json
    }
    return response.statusText || 'An unknown error occurred.';
};
