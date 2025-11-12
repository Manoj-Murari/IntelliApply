// src/MainDashboard.jsx
import React, { useEffect } from 'react';
import { useStore } from './lib/store';

// --- COMPONENT IMPORTS ---
import Header from './components/layout/Header';
import Dashboard from './components/features/Dashboard';
import AllJobs from './components/features/AllJobs';
import KanbanTracker from './components/features/KanbanTracker';
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
import AddJobModal from './components/features/AddJobModal';
import OptimizedResumeModal from './components/features/OptimizedResumeModal';

export default function MainDashboard() {
    // Get all state from the store
    const {
        view,
        selectedJob, setSelectedJob,
        fetchAllData, subscribeToJobs, unsubscribeFromJobs,
        handleTriggerJobSearch,
        isSearching,
        loading,
        // --- All Modal State ---
        isTailorModalOpen, openTailorModal, closeTailorModal,
        isCoverLetterModalOpen, openCoverLetterModal, closeCoverLetterModal,
        isInterviewPrepModalOpen, openInterviewPrepModal, closeInterviewPrepModal,
        isApplicationHelperOpen, openApplicationHelper, closeApplicationHelper,
        isOptimizedResumeModalOpen, openOptimizedResumeModal, closeOptimizedResumeModal,
        // --- End Modal State ---
        modalState, closeConfirmationModal,
        notifications, removeNotification,
        isWelcomeModalOpen, closeWelcomeModal,
        isSearchModalOpen, closeSearchModal, 
        isAddJobModalOpen, closeAddJobModal,
        allJobs, profiles, searches,
        activeProfileId,
        updateJobStatus
    } = useStore();

    useEffect(() => {
        fetchAllData();
        subscribeToJobs();
        return () => {
            unsubscribeFromJobs();
        };
    }, [fetchAllData, subscribeToJobs, unsubscribeFromJobs]);

    const getActiveProfile = () => {
        if (!activeProfileId || !profiles.length) {
            return null;
        }
        return profiles.find(p => p.id === activeProfileId) || null;
    };

    const activeProfile = getActiveProfile();

    if (loading) {
        return <GlobalLoader />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            
            <Header />
            
            {/* --- THIS IS THE FIX ---
              - We are ADDING BACK 'max-w-7xl' and 'mx-auto'.
              - This will create the "gaps" on the left and right
              - and align your main content with the header.
            */}
            <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                
                {/* --- Main Page Router --- */}
                {view === 'inbox' && (
                  <Dashboard 
                      setSelectedJob={setSelectedJob} 
                      onTriggerJobSearch={handleTriggerJobSearch} 
                      isSearching={isSearching} 
                  />
                )}
                {view === 'library' && (
                  <AllJobs 
                      jobs={allJobs} 
                      setSelectedJob={setSelectedJob} 
                  />
                )}
                {view === 'tracker' && (
                  <KanbanTracker 
                      jobs={allJobs} 
                      updateJobStatus={updateJobStatus} 
                      setSelectedJob={setSelectedJob} 
                  />
                )}
                {view === 'analytics' && <Analytics jobs={allJobs} profiles={profiles} searches={searches} />}
                {view === 'settings' && <Settings />} 
            </main>
            
            <JobDetailsPanel 
                job={selectedJob} 
                setSelectedJob={setSelectedJob} 
                onOpenTailorModal={openTailorModal}
                onOpenCoverLetterModal={openCoverLetterModal}
                onOpenApplicationHelper={openApplicationHelper}
                onOpenOptimizedResumeModal={openOptimizedResumeModal}
                activeProfile={activeProfile} 
            />
            
            {/* --- Modals and Toasts --- */}
            <WelcomeModal isOpen={isWelcomeModalOpen} onClose={closeWelcomeModal} />
            <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
            <AddJobModal isOpen={isAddJobModalOpen} onClose={closeAddJobModal} />
            
            <AITailoringModal isOpen={isTailorModalOpen} onClose={closeTailorModal} job={selectedJob} profile={activeProfile} />
            <AICoverLetterModal isOpen={isCoverLetterModalOpen} onClose={closeCoverLetterModal} job={selectedJob} profile={activeProfile} />
            <AIInterviewPrepModal isOpen={isInterviewPrepModalOpen} onClose={closeInterviewPrepModal} job={selectedJob} profile={activeProfile} />
            <OptimizedResumeModal isOpen={isOptimizedResumeModalOpen} onClose={closeOptimizedResumeModal} job={selectedJob} profile={activeProfile} /> 

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