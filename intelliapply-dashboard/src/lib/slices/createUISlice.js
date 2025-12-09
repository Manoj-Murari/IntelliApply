
// src/lib/slices/createUISlice.js

export const createUISlice = (set, get) => ({
    loading: true,
    notifications: [],
    modalState: { isOpen: false, onConfirm: null, title: '', message: '' },

    // Modal Open States
    isTailorModalOpen: false,
    isCoverLetterModalOpen: false,
    isInterviewPrepModalOpen: false,
    isApplicationHelperOpen: false,
    isAddJobModalOpen: false,
    isOptimizedResumeModalOpen: false,
    isWelcomeModalOpen: false,
    // isSearchModalOpen REMOVED

    // Actions
    openTailorModal: () => set({ isTailorModalOpen: true, tailoringSuggestions: [], aiError: null }),
    closeTailorModal: () => set({ isTailorModalOpen: false }),
    openCoverLetterModal: () => set({ isCoverLetterModalOpen: true, coverLetter: '', aiError: null }),
    closeCoverLetterModal: () => set({ isCoverLetterModalOpen: false }),
    openInterviewPrepModal: () => set({ isInterviewPrepModalOpen: true, interviewPrepData: null, aiError: null }),
    closeInterviewPrepModal: () => set({ isInterviewPrepModalOpen: false }),
    openApplicationHelper: () => set({ isApplicationHelperOpen: true }),
    closeApplicationHelper: () => set({ isApplicationHelperOpen: false }),
    openWelcomeModal: () => set({ isWelcomeModalOpen: true }),
    closeWelcomeModal: () => set({ isWelcomeModalOpen: false }),
    openAddJobModal: () => set({ isAddJobModalOpen: true }),
    closeAddJobModal: () => set({ isAddJobModalOpen: false }),
    openOptimizedResumeModal: () => set({ isOptimizedResumeModalOpen: true, optimizedResume: '', aiError: null }),
    closeOptimizedResumeModal: () => set({ isOptimizedResumeModalOpen: false }),

    // Notifications
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

    // Confirmation Modal
    openConfirmationModal: (title, message, onConfirm) => {
        set({ modalState: { isOpen: true, title, message, onConfirm } });
    },
    closeConfirmationModal: () => {
        set({ modalState: { isOpen: false, onConfirm: null, title: '', message: '' } });
    },

    // Global Data Fetch
    fetchAllData: async () => {
        set({ loading: true });
        try {
            await get().fetchProfiles();
            const profiles = get().profiles;

            if (profiles.length === 0) {
                set({ isWelcomeModalOpen: true });
            } else {
                const activeId = get().activeProfileId || profiles[0].id;
                if (!get().activeProfileId) {
                    set({ activeProfileId: activeId });
                }
            }

            await Promise.all([get().fetchJobs(), get().fetchSearches()]);
        } catch (error) {
            get().addNotification(`Error fetching data: ${error.message}`, 'error');
        } finally {
            set({ loading: false });
        }
    },
});
