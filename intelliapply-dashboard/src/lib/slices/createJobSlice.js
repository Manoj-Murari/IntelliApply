
// src/lib/slices/createJobSlice.js
import { supabase } from '../supabaseClient';
import { API_BASE_URL, getAuthHeaders, getErrorMessage } from '../api';

export const createJobSlice = (set, get) => ({
    allJobs: [],
    selectedJob: null,
    selectedJobIds: new Set(),
    channel: null,

    setSelectedJob: (job) => set({ selectedJob: job }),

    toggleJobSelection: (jobId) => {
        set((state) => {
            const newSelectedIds = new Set(state.selectedJobIds);
            if (newSelectedIds.has(jobId)) newSelectedIds.delete(jobId);
            else newSelectedIds.add(jobId);
            return { selectedJobIds: newSelectedIds };
        });
    },
    clearJobSelection: () => set({ selectedJobIds: new Set() }),

    fetchJobs: async () => {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        set({ allJobs: data || [] });
    },

    handleSaveManualJob: async (jobData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/create-manual`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(jobData),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            get().addNotification('Job saved successfully!', 'success');
            get().closeAddJobModal();
            return true;
        } catch (error) {
            get().addNotification(`${error.message}`, 'error');
            return false;
        }
    },

    updateJobStatus: async (jobId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/update-status`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            get().addNotification('Job status updated!');
        } catch (error) {
            get().addNotification(`Error: ${error.message}`, 'error');
        }
    },

    updateJobDetails: async (jobId, updateData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/update-details`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(updateData),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            get().addNotification('Job details updated!');
        } catch (error) {
            get().addNotification(`Error saving details: ${error.message}`, 'error');
        }
    },

    handleDeleteJob: async (jobId) => {
        if (!jobId) return;
        if (get().selectedJob?.id === jobId) set({ selectedJob: null });
        get().addNotification('Deleting job...', 'info');
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/delete`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ job_ids: [jobId] }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            get().addNotification('Job successfully deleted.', 'success');
        } catch (error) {
            get().addNotification(`Error deleting job: ${error.message}`, 'error');
        } finally {
            get().closeConfirmationModal();
        }
    },

    handleDeleteAllJobs: async () => {
        get().addNotification('Deleting all non-tracked jobs...', 'info');
        get().closeConfirmationModal();
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/delete-all-untracked`, {
                method: 'POST',
                headers: await getAuthHeaders(),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            set({ selectedJob: null, selectedJobIds: new Set() });
            get().addNotification('All non-tracked jobs deleted.', 'success');
        } catch (error) {
            get().addNotification(`Error deleting jobs: ${error.message}`, 'error');
        }
    },

    handleDeleteSelectedJobs: async () => {
        const idsToDelete = Array.from(get().selectedJobIds);
        if (idsToDelete.length === 0) {
            get().addNotification('No jobs selected.', 'warning');
            return;
        }
        get().addNotification(`Deleting ${idsToDelete.length} selected job(s)...`, 'info');
        get().closeConfirmationModal();
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/delete`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ job_ids: idsToDelete }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            set((state) => ({
                selectedJobIds: new Set(),
                selectedJob: state.selectedJob && idsToDelete.includes(state.selectedJob.id) ? null : state.selectedJob,
            }));
            get().addNotification('Selected jobs deleted.', 'success');
        } catch (error) {
            get().addNotification(`Error deleting selected jobs: ${error.message}`, 'error');
        }
    },

    subscribeToJobs: () => {
        if (get().channel) return;
        const mergeJobUpdate = (oldJob, newPayload) => ({ ...oldJob, ...newPayload });
        const channel = supabase
            .channel('public:jobs')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'jobs' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        set((state) => ({
                            allJobs: [payload.new, ...state.allJobs],
                        }));
                        if (payload.new.search_id) {
                            get().addNotification(`New job found: ${payload.new.title}`, 'info');
                        }
                    }
                    if (payload.eventType === 'UPDATE') {
                        set((state) => ({
                            allJobs: state.allJobs.map((job) =>
                                job.id === payload.new.id ? mergeJobUpdate(job, payload.new) : job
                            ),
                            selectedJob:
                                state.selectedJob?.id === payload.new.id
                                    ? mergeJobUpdate(state.selectedJob, payload.new)
                                    : state.selectedJob,
                        }));
                        if (payload.old.description === null && payload.new.description) {
                            get().addNotification(`Description saved for: ${payload.new.title}`, 'success');
                        }
                        if (payload.old.gemini_rating === null && payload.new.gemini_rating) {
                            get().addNotification(`AI Analysis complete for: ${payload.new.title}`, 'success');
                        }
                    }
                    if (payload.eventType === 'DELETE') {
                        set((state) => ({
                            allJobs: state.allJobs.filter((job) => job.id !== payload.old.id),
                            selectedJob:
                                state.selectedJob?.id === payload.old.id ? null : state.selectedJob,
                            selectedJobIds: new Set(
                                [...state.selectedJobIds].filter((id) => id !== payload.old.id)
                            ),
                        }));
                    }
                }
            )
            .subscribe();
        set({ channel });
    },

    unsubscribeFromJobs: () => {
        const channel = get().channel;
        if (channel) {
            supabase.removeChannel(channel);
            set({ channel: null });
        }
    },
});
