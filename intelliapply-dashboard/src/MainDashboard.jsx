import React, { useEffect } from 'react';
import { useStore } from './lib/store';

// --- COMPONENT IMPORTS ---
import Header from './components/layout/Header';
import Dashboard from './components/features/Dashboard';
import Analytics from './components/features/Analytics.jsx'; 
import Settings from './components/pages/Settings'; 
import JobDetailsPanel from './components/features/JobDetailsPanel';
import ConfirmationModal from './components/ui/ConfirmationModal';
import Toast from './components/ui/Toast';
import AITailoringModal from './components/features/AITailoringModal';
import AICoverLetterModal from './components/features/AICoverLetterModal';
import AIInterviewPrepModal from './components/features/AIInterviewPrepModal';
import ApplicationHelperModal from './components/features/ApplicationHelperModal.jsx';
import WelcomeModal from './components/ui/WelcomeModal'; 
import GlobalLoader from './components/ui/GlobalLoader'; 
import SearchModal from './components/features/SearchModal'; 

export default function MainDashboard() {
    // --- THIS IS THE FIX ---
    // We select every piece of state individually.
    // This looks long, but it is the correct pattern for Zustand
    // and guarantees we do not have infinite loops.
    const view = useStore((state) => state.view);
    const newJobs = useStore((state) => state.newJobs);
    const selectedJob = useStore((state) => state.selectedJob);
    const setSelectedJob = useStore((state) => state.setSelectedJob);
    const fetchAllData = useStore((state) => state.fetchAllData);
    const subscribeToJobs = useStore((state) => state.subscribeToJobs);
    const unsubscribeFromJobs = useStore((state) => state.unsubscribeFromJobs);
    const handleTriggerJobSearch = useStore((state) => state.handleTriggerJobSearch);
    const isSearching = useStore((state) => state.isSearching);
    const loading = useStore((state) => state.loading);
    const isTailorModalOpen = useStore((state) => state.isTailorModalOpen);
    const openTailorModal = useStore((state) => state.openTailorModal);
    const closeTailorModal = useStore((state) => state.closeTailorModal);
    const isCoverLetterModalOpen = useStore((state) => state.isCoverLetterModalOpen);
    const openCoverLetterModal = useStore((state) => state.openCoverLetterModal);
    const closeCoverLetterModal = useStore((state) => state.closeCoverLetterModal);
    const isInterviewPrepModalOpen = useStore((state) => state.isInterviewPrepModalOpen);
    const openInterviewPrepModal = useStore((state) => state.openInterviewPrepModal);
    const closeInterviewPrepModal = useStore((state) => state.closeInterviewPrepModal);
    const isApplicationHelperOpen = useStore((state) => state.isApplicationHelperOpen);
    const openApplicationHelper = useStore((state) => state.openApplicationHelper);
    const closeApplicationHelper = useStore((state) => state.closeApplicationHelper);
    const modalState = useStore((state) => state.modalState);
    const openConfirmationModal = useStore((state) => state.openConfirmationModal);
    const closeConfirmationModal = useStore((state) => state.closeConfirmationModal);
    const notifications = useStore((state) => state.notifications);
    const removeNotification = useStore((state) => state.removeNotification);
    const isWelcomeModalOpen = useStore((state) => state.isWelcomeModalOpen);
    const closeWelcomeModal = useStore((state) => state.closeWelcomeModal);
    const isSearchModalOpen = useStore((state) => state.isSearchModalOpen);
    const closeSearchModal = useStore((state) => state.closeSearchModal);
    const allJobs = useStore((state) => state.allJobs);
    const profiles = useStore((state) => state.profiles);
    const searches = useStore((state) => state.searches);
    const activeProfileId = useStore((state) => state.activeProfileId);
    // --- END OF FIX ---

    useEffect(() => {
        fetchAllData();
        subscribeToJobs();
        return () => {
            unsubscribeFromJobs();
        };
    }, [fetchAllData, subscribeToJobs, unsubscribeFromJobs]); // fetchAllData is stable

    // --- Simplified active profile logic ---
    const getActiveProfile = () => {
        if (!activeProfileId || !profiles.length) {
            return null; // Return null if no profiles are loaded or none is selected
        }
        // Find the profile object that matches the active ID
        return profiles.find(p => p.id === activeProfileId) || null;
    };

    const activeProfile = getActiveProfile();

    if (loading) {
        return <GlobalLoader />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            
            <Header />
            
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                 {view === 'dashboard' && (
                    <Dashboard 
                        newJobs={newJobs} 
                        setSelectedJob={setSelectedJob} 
                        onTriggerJobSearch={handleTriggerJobSearch} 
                        isSearching={isSearching} 
                    />
                 )}
                 {view === 'analytics' && <Analytics jobs={allJobs} profiles={profiles} searches={searches} />}
                 {view === 'settings' && <Settings />} 
            </main>
            
            {/* The activeProfile prop is now always correct */}
            <JobDetailsPanel 
                job={selectedJob} 
                setSelectedJob={setSelectedJob} 
                onOpenTailorModal={openTailorModal}
                onOpenCoverLetterModal={openCoverLetterModal}
                onOpenApplicationHelper={openApplicationHelper}
                activeProfile={activeProfile} 
            />
            
            {/* Modals and Toasts (unchanged) */}
            <WelcomeModal isOpen={isWelcomeModalOpen} onClose={closeWelcomeModal} />
            <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
            
            <AITailoringModal isOpen={isTailorModalOpen} onClose={closeTailorModal} job={selectedJob} profile={activeProfile} />
            <AICoverLetterModal isOpen={isCoverLetterModalOpen} onClose={closeCoverLetterModal} job={selectedJob} profile={activeProfile} />
            <AIInterviewPrepModal isOpen={isInterviewPrepModalOpen} onClose={closeInterviewPrepModal} job={selectedJob} profile={activeProfile} />
            <ApplicationHelperModal 
                isOpen={isApplicationHelperOpen} 
                onClose={closeApplicationHelper} 
                profile={activeProfile}
                jobUrl={selectedJob?.job_url}
            />
            <ConfirmationModal isOpen={modalState.isOpen} onClose={closeConfirmationModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} />
            
            <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm-items-end">
                <div className="w-full flex flex-col items-center space-y-4 sm-items-end">
                    {notifications.map(notification => ( <Toast key={notification.id} notification={notification} onDismiss={removeNotification} /> ))}
                </div>
            </div>
        </div>
    );
}