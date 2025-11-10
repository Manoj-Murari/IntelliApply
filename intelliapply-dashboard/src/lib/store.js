// src/lib/store.js
import { create } from 'zustand';
import { supabase } from './supabaseClient';

const API_BASE_URL = 'http://localhost:8000';

// --- Auth Helper (NOW ASYNC) ---
const getAuthHeaders = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    console.error('Error getting session for API request:', error);
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session.access_token}`,
  };
};

export const useStore = create((set, get) => ({
  // --- STATE ---
  view: 'dashboard',
  allJobs: [],
  newJobs: [],
  profiles: [],
  searches: [],
  selectedJob: null,
  loading: true,
  notifications: [],
  modalState: { isOpen: false, onConfirm: null, title: '', message: '' },
  isSearching: false,
  activeProfileId: null,

  // --- AI Modal State ---
  isTailorModalOpen: false,
  isCoverLetterModalOpen: false,
  isInterviewPrepModalOpen: false,
  isApplicationHelperOpen: false,

  // --- AI Generation State ---
  isGenerating: false,
  tailoringSuggestions: [],
  coverLetter: '',
  interviewPrepData: null,
  aiError: null,

  channel: null,
  isWelcomeModalOpen: false,
  isSearchModalOpen: false,
  selectedJobIds: new Set(),

  // --- ACTIONS ---
  setView: (view) => set({ view }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setActiveProfileId: (profileId) => set({ activeProfileId: profileId }),

  // --- Modal Actions ---
  openTailorModal: () =>
    set({ isTailorModalOpen: true, tailoringSuggestions: [], aiError: null }),
  closeTailorModal: () => set({ isTailorModalOpen: false }),
  openCoverLetterModal: () =>
    set({ isCoverLetterModalOpen: true, coverLetter: '', aiError: null }),
  closeCoverLetterModal: () => set({ isCoverLetterModalOpen: false }),
  openInterviewPrepModal: () =>
    set({ isInterviewPrepModalOpen: true, interviewPrepData: null, aiError: null }),
  closeInterviewPrepModal: () => set({ isInterviewPrepModalOpen: false }),
  openApplicationHelper: () => set({ isApplicationHelperOpen: true }),
  closeApplicationHelper: () => set({ isApplicationHelperOpen: false }),
  openWelcomeModal: () => set({ isWelcomeModalOpen: true }),
  closeWelcomeModal: () => set({ isWelcomeModalOpen: false }),
  openSearchModal: () => set({ isSearchModalOpen: true }),
  closeSearchModal: () => set({ isSearchModalOpen: false }),

  // Notifications & Confirmation
  addNotification: (message, type = 'success') => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  openConfirmationModal: (title, message, onConfirm) => {
    set({ modalState: { isOpen: true, title, message, onConfirm } });
  },
  closeConfirmationModal: () => {
    set({ modalState: { isOpen: false, onConfirm: null, title: '', message: '' } });
  },

  // --- Job Selection ---
  toggleJobSelection: (jobId) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedJobIds);
      if (newSelectedIds.has(jobId)) newSelectedIds.delete(jobId);
      else newSelectedIds.add(jobId);
      return { selectedJobIds: newSelectedIds };
    });
  },
  clearJobSelection: () => set({ selectedJobIds: new Set() }),

  // --- Data Fetching ---
  fetchAllData: async () => {
    set({ loading: true });
    try {
      await get().fetchProfiles();
      const profiles = get().profiles;
      
      if (profiles.length === 0) {
        set({ isWelcomeModalOpen: true });
      } else {
        if (!get().activeProfileId) {
          set({ activeProfileId: profiles[0].id });
        }
      }
      
      await Promise.all([get().fetchJobs(), get().fetchSearches()]);
    } catch (error) {
      get().addNotification(`Error fetching data: ${error.message}`, 'error');
    } finally {
      set({ loading: false });
    }
  },

  fetchJobs: async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    set({ allJobs: data || [] });
  },

  fetchProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    set({ profiles: data || [] });
  },

  fetchSearches: async () => {
    const { data, error } = await supabase
      .from('searches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    set({ searches: data || [] });
  },

  // --- Realtime ---
  subscribeToJobs: () => {
    if (get().channel) return;

    const mergeJobUpdate = (oldJob, newPayload) => ({ ...oldJob, ...newPayload });

    const channel = supabase
      .channel('public:jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('Realtime payload received:', payload);
          
          if (payload.eventType === 'INSERT') {
            set((state) => ({
              allJobs: [payload.new, ...state.allJobs],
              newJobs: [payload.new, ...state.newJobs],
              isSearching: false,
            }));
            get().addNotification(`New job found: ${payload.new.title}`, 'info');
          }
          
          if (payload.eventType === 'UPDATE') {
             set((state) => ({
                allJobs: state.allJobs.map((job) =>
                  job.id === payload.new.id ? mergeJobUpdate(job, payload.new) : job
                ),
                newJobs: state.newJobs.map((job) =>
                  job.id === payload.new.id ? mergeJobUpdate(job, payload.new) : job
                ),
                selectedJob:
                  state.selectedJob?.id === payload.new.id
                    ? mergeJobUpdate(state.selectedJob, payload.new)
                    : state.selectedJob,
              }));
              if (payload.old.gemini_rating === null && payload.new.gemini_rating) {
                 get().addNotification(`AI Analysis complete for: ${payload.new.title}`, 'success');
              }
          }
          
          if (payload.eventType === 'DELETE') {
             set((state) => ({
                allJobs: state.allJobs.filter((job) => job.id !== payload.old.id),
                newJobs: state.newJobs.filter((job) => job.id !== payload.old.id),
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

  // --- Backend API Actions ---
  handleTriggerJobSearch: async () => {
    if (get().isSearching) {
      get().addNotification('A search is already in progress.', 'info');
      return;
    }
    const searches = get().searches;
    if (!searches.length) {
      get().addNotification('No saved searches. Please add a search on the Settings page.', 'error');
      return;
    }
    set({ newJobs: [], isSearching: true });
    get().addNotification(`Starting scrape for ${searches.length} saved search(es)...`, 'info');
    
    try {
      const authHeaders = await getAuthHeaders();
      for (const search of searches) {
        await fetch(`${API_BASE_URL}/api/v1/searches/trigger-scrape`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            search_term: search.search_term,
            location: search.country,
            hours_old: search.hours_old,
            search_id: search.id,
          }),
        });
      }
      
      setTimeout(() => {
        if (get().isSearching) {
          set({ isSearching: false });
          get().addNotification(
            'Scrape complete. New jobs (if any) are in your inbox.',
            'info'
          );
        }
      }, 30000);
      
    } catch (error) {
      get().addNotification(`Error triggering scrape: ${error.message}`, 'error');
      set({ isSearching: false });
    }
  },

  handleAnalyzeJob: async (jobId, profileId) => {
    if (!jobId || profileId === null || profileId === undefined) {
      get().addNotification('Could not start analysis: No profile selected.', 'error');
      return;
    }

    get().addNotification('Sending job to AI for analysis...', 'info');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ profile_id: profileId }),
      });
      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.detail || 'Failed to start analysis.';
        throw new Error(errorMsg);
      }
    } catch (error) {
      get().addNotification(`Error: ${error.message}`, 'error');
      throw error;
    }
  },

  handleGetTailoring: async (jobDescription, profileId) => {
    set({ isGenerating: true, aiError: null, tailoringSuggestions: [] });
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/tailor-resume`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          job_description: jobDescription,
          profile_id: profileId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'AI request failed.');
      set({ tailoringSuggestions: data.suggestions || [] });
    } catch (err) {
      set({ aiError: err.message });
    } finally {
      set({ isGenerating: false });
    }
  },

  handleGetCoverLetter: async (job, profileId, jobDescription) => {
    set({ isGenerating: true, aiError: null, coverLetter: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-cover-letter`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          job_description: jobDescription,
          profile_id: profileId,
          company: job.company,
          title: job.title,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'AI request failed.');
      set({ coverLetter: data.coverLetter || '' });
    } catch (err) {
      set({ aiError: err.message });
    } finally {
      set({ isGenerating: false });
    }
  },

  generateInterviewPrep: async (job, profile, jobDescription) => {
    if (!job || !jobDescription) { /* ... (no change) ... */ }
    if (!profile) { /* ... (no change) ... */ }
    
    set({ isGenerating: true, interviewPrepData: null, aiError: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/interview-prep`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          job_description: jobDescription,
          profile_id: profile.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'AI request failed.');
      set({ interviewPrepData: data });
    } catch (err) {
      console.error('Error generating interview prep:', err);
      set({ aiError: err.message });
    } finally {
      set({ isGenerating: false });
    }
  },

  // --- CRUD Operations ---
  
  // --- UPDATED to handle file upload ---
  handleSaveProfile: async (profile, file) => {
    set({ loading: true });
    let savedData = null;
    let user = null;
    
    try {
      // 1. Get user
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) throw new Error(userError?.message || 'You must be logged in to save a profile.');
      user = authUser;

      // 2. Save text data to 'profiles' table
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
      
      // 3. Handle file upload (if a new file exists)
      if (file) {
        const fileExt = file.name.split('.').pop();
        // Secure, unguessable path: {user_id}/{profile_id}/resume.pdf
        const filePath = `${user.id}/${savedData.id}/resume.${fileExt}`;
        
        // Upload, overwriting if it exists
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(filePath);
          
        // 4. Save the URL back to the profile
        const { data: updatedProfile, error: urlSaveError } = await supabase
          .from('profiles')
          .update({ resume_file_url: urlData.publicUrl })
          .eq('id', savedData.id)
          .select()
          .single();
          
        if (urlSaveError) throw urlSaveError;
        savedData = updatedProfile; // Use the final updated profile data
      }

      get().addNotification('Profile saved!');
      
      // 5. Update state
      set((state) => ({
          profiles: state.profiles.map(p => p.id === savedData.id ? savedData : (p.id ? p : savedData)),
          loading: false
      }));
      
      // If this is the first profile, set it as active
      if (get().profiles.length === 1 && savedData) {
        set({ activeProfileId: savedData.id });
      }

    } catch (error) {
      get().addNotification(`Error saving profile: ${error.message}`, 'error');
      set({ loading: false });
    }
  },
  
  // --- NEW: Function to remove a resume ---
  handleRemoveResume: async (profile) => {
    if (!profile?.resume_file_url) return;
    
    set({ loading: true });
    try {
      // 1. Get file path from URL
      // The URL is like: .../storage/v1/object/public/resumes/USER_ID/PROFILE_ID/resume.pdf
      // The file path to delete is: USER_ID/PROFILE_ID/resume.pdf
      const url = new URL(profile.resume_file_url);
      const filePath = url.pathname.split('/resumes/')[1]; // Get everything after /resumes/

      if (!filePath) throw new Error("Could not parse file path from URL.");

      // 2. Remove from storage
      const { error: removeError } = await supabase.storage
        .from('resumes')
        .remove([filePath]);
        
      if (removeError) throw removeError;
      
      // 3. Remove from database
      const { data: updatedProfile, error: dbError } = await supabase
        .from('profiles')
        .update({ resume_file_url: null })
        .eq('id', profile.id)
        .select()
        .single();
        
      if (dbError) throw dbError;

      // 4. Update state
      get().addNotification('Resume file removed.');
      set((state) => ({
          profiles: state.profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p),
          loading: false
      }));

    } catch (error) {
      get().addNotification(`Error removing resume: ${error.message}`, 'error');
      set({ loading: false });
    }
  },
  
  handleDeleteProfile: async (id) => {
    // Note: This does not delete the file from storage, but the file becomes orphaned
    // and inaccessible. For a production app, we'd delete from storage first.
    await supabase.from('profiles').delete().eq('id', id);
    get().addNotification('Profile deleted.');
    
    const remainingProfiles = get().profiles.filter((p) => p.id !== id);
    set({ profiles: remainingProfiles });
    
    if (get().activeProfileId === id) {
      set({ activeProfileId: remainingProfiles.length > 0 ? remainingProfiles[0].id : null });
    }
    
    get().closeConfirmationModal();
  },

  handleSaveSearch: async (search) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to save a search.');

      const { id, ...searchData } = search;
      const dataToSave = { ...searchData, user_id: user.id, profile_id: null }; 

      let error;
      if (id) {
        ({ error } = await supabase.from('searches').update(dataToSave).eq('id', id));
      } else {
        ({ error } = await supabase.from('searches').insert([dataToSave]));
      }
      if (error) throw error;
      get().addNotification('Search saved!');
      await get().fetchSearches();
    } catch (error) {
      get().addNotification(`Error saving search: ${error.message}`, 'error');
    }
  },

  handleDeleteSearch: async (id) => {
    await supabase.from('searches').delete().eq('id', id);
    get().addNotification('Search deleted.');
    set((state) => ({ searches: state.searches.filter((s) => s.id !== id) }));
    get().closeConfirmationModal();
  },
  
  // --- Job Mutations (Re-routed to backend) ---
  updateJobStatus: async (jobId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/update-status`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      get().addNotification('Job status updated!');
    } catch (error) {
      get().addNotification(`Error: ${error.message}`, 'error');
    }
  },

  updateJobDetails: async (jobId, updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/update-details`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
    } catch (error) {
      get().addNotification(`Error saving notes: ${error.message}`, 'error');
    }
  },

  handleDeleteJob: async (jobId) => {
    if (!jobId) return;
    if (get().selectedJob?.id === jobId) set({ selectedJob: null });
    
    get().addNotification('Deleting job...', 'info');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/delete`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ job_ids: [jobId] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
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
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/delete-all-untracked`, {
        method: 'POST',
        headers: await getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      
      set({ newJobs: [], selectedJob: null, selectedJobIds: new Set() });
      get().addNotification('All non-tracked jobs deleted.', 'success');
    } catch (error) {
      get().addNotification(`Error deleting jobs: ${error.message}`, 'error');
    }
  },

  handleDeleteSelectedJobs: async () => {
    const idsToDelete = Array.from(get().selectedJobIds);
    if (idsToDelete.length === 0) { /* ... (no change) ... */ }
    
    get().addNotification(`Deleting ${idsToDelete.length} selected job(s)...`, 'info');
    get().closeConfirmationModal();
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/delete`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ job_ids: idsToDelete }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);

      set((state) => ({
        selectedJobIds: new Set(),
        selectedJob:
          state.selectedJob && idsToDelete.includes(state.selectedJob.id)
            ? null
            : state.selectedJob,
      }));
      get().addNotification('Selected jobs deleted.', 'success');
    } catch (error) {
      get().addNotification(`Error deleting selected jobs: ${error.message}`, 'error');
    }
  },

  // --- Sign Out Action ---
  handleSignOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      get().addNotification(`Error signing out: ${error.message}`, 'error');
      set({ loading: false });
    }
    set({
      allJobs: [],
      newJobs: [],
      profiles: [],
      searches: [],
      selectedJob: null,
      loading: false, 
      activeProfileId: null, 
    });
  },
}));