import { create } from 'zustand';
import { supabase } from './supabase';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { MOCK_MASTER_RESUME } from './mockResume';

/**
 * Global App Store
 * Manages view navigation, shared data, and persistent history.
 */
export const useAppStore = create((set, get) => ({
    // View State: 'home', 'analysis', 'success', 'history', 'profile'
    currentView: 'home',

    // Navigation Actions
    setView: (view) => set({ currentView: view }),
    resetToHome: () => set({ currentView: 'home', jobData: null, analysisResults: null }),

    // Data State
    jobData: null, // { title, company, description, url }
    analysisResults: null, // { score, summary, gaps, tailoredResume }

    // History State
    history: [], // [{ id, title, company, date, pdfUrl? }]

    // Actions
    setJobData: (data) => set({ jobData: data }),
    setAnalysisResults: (results) => set({ analysisResults: results }),

    // History Actions
    loadHistory: async () => {
        try {
            const storedHistory = await idbGet('application_history');
            if (storedHistory) {
                set({ history: storedHistory });
            }
        } catch (e) {
            console.error("Failed to load history:", e);
        }
    },
    addToHistory: (item) => {
        const newItem = { ...item, id: Date.now(), date: new Date().toISOString() };
        set((state) => {
            const newHistory = [newItem, ...state.history];
            idbSet('application_history', newHistory).catch(err => console.error("IDB Save Failed", err)); // Persist to IDB
            return { history: newHistory };
        });
    },

    // History Checkboxes (Gap Check)
    selectedGaps: [],
    toggleGap: (gapId) => set((state) => ({
        selectedGaps: state.selectedGaps.includes(gapId)
            ? state.selectedGaps.filter(id => id !== gapId)
            : [...state.selectedGaps, gapId]
    })),

    // --- Authentication State ---
    user: null, // Supabase User
    session: null, // Supabase Session
    profile: null, // User Profile (includes resume_context)
    authError: null,
    isLoggingIn: false,

    // --- Authentication Actions ---
    initializeAuth: async () => {
        try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            set({ session, user: session?.user || null });

            if (session?.user) {
                await get().fetchProfile(session.user.id);
            }

            // Listen for changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                set({ session, user: session?.user || null });
                if (session?.user) {
                    await get().fetchProfile(session.user.id);
                } else {
                    set({ profile: null, currentView: 'home' }); // Reset on logout
                }
            });
        } catch (err) {
            console.error("Auth Init Failed:", err);
            set({ authError: "Failed to initialize: " + err.message });
        }
    },

    signIn: async (email, password) => {
        set({ isLoggingIn: true, authError: null });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            set({ authError: error.message, isLoggingIn: false });
        } else {
            set({ isLoggingIn: false });
        }
    },

    signInWithGoogle: async () => {
        set({ isLoggingIn: true, authError: null });
        try {
            console.log("--- Starting Google Login ---");
            // 1. Get the Redirect URL for the Extension
            const redirectUrl = chrome.identity.getRedirectURL();
            console.log("1. Extension Redirect URL:", redirectUrl);

            // 2. Get the OAuth Provider URL from Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true
                }
            });

            console.log("2. Supabase Response:", { data, error });

            if (error) throw error;
            if (!data?.url) throw new Error("Supabase returned no auth URL");

            console.log("3. Launching WebAuthFlow with URL:", data.url);

            // 3. Launch Chrome Web Auth Flow
            const responseUrl = await chrome.identity.launchWebAuthFlow({
                url: data.url,
                interactive: true
            });

            console.log("4. Response URL Received:", responseUrl);

            if (chrome.runtime.lastError) {
                console.error("Chrome Runtime Error:", chrome.runtime.lastError);
                throw new Error(chrome.runtime.lastError.message);
            }

            // 4. Parse tokens from the response URL (hash fragment)
            if (!responseUrl) throw new Error("No response URL received");

            const params = new URLSearchParams(responseUrl.split('#')[1]);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            console.log("5. Tokens Parsed:", { accessToken: accessToken ? 'Yes' : 'No', refreshToken: refreshToken ? 'Yes' : 'No' });

            if (!accessToken) throw new Error("No access token found in response");

            // 5. Set the session in Supabase
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            if (sessionError) throw sessionError;

            console.log("6. Session Set Successfully");

        } catch (error) {
            console.error("Google Sign-In Failed:", error);
            let msg = error.message;
            if (msg.includes('User interaction required')) msg = 'Login cancelled';
            set({ authError: "Google Login Failed: " + msg, isLoggingIn: false });
        } finally {
            // isLoggingIn will be set to false by onAuthStateChange if successful, 
            // but if we errored out, we need to reset it here. 
            // Actually, safer to reset it if error only.
            // But if success, onAuthStateChange fires? Yes.
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null, isLoggingIn: false });
    },

    fetchProfile: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                set({ profile: data });
            }
        } catch (err) {
            console.error("Fetch Profile Failed:", err);
            // Don't crash, just log. Profile stays null.
        }
    },

    // --- ATS Match Analysis ---
    isAnalyzing: false,
    matchAnalysis: null, // { match_score, gaps, summary }

    analyzeMatch: async (jobDescription) => {
        set({ isAnalyzing: true, matchAnalysis: null });
        try {
            const { profile } = get();

            // Use Real Profile Resume OR Mock Fallback
            let resumeData = profile?.resume_context || MOCK_MASTER_RESUME;

            const payload = {
                resume_data: resumeData,
                job_description: jobDescription
            };

            const response = await fetch('http://localhost:8000/api/v1/resume/analyze-gaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Analysis Failed");

            const data = await response.json();
            set({ matchAnalysis: data, isAnalyzing: false });

        } catch (error) {
            console.error(error);
            set({ isAnalyzing: false });
        }
    },

    // --- API & Resume Generation ---
    isGenerating: false,
    tailoredResume: null, // The JSON result from backend
    generationError: null,

    generateResume: async (jobDescription) => {
        set({ isGenerating: true, generationError: null });
        try {
            const { profile } = get();

            // Use Real Profile Resume OR Mock Fallback
            let resumeData = profile?.resume_context || MOCK_MASTER_RESUME;

            const payload = {
                resume_data: resumeData,
                job_description: jobDescription
            };

            const response = await fetch('http://localhost:8000/api/v1/resume/generate-tailored', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Backend Error: ${response.statusText}`);
            }

            const data = await response.json();
            set({ tailoredResume: data, isGenerating: false });
            return data;

        } catch (error) {
            console.error("Resume Generation Failed:", error);
            set({ isGenerating: false, generationError: error.message });
            throw error;
        }
    },

    downloadPDF: async () => {
        const { tailoredResume } = get();
        if (!tailoredResume) return;

        try {
            const response = await fetch('http://localhost:8000/api/v1/resume/render-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tailoredResume)
            });

            if (!response.ok) throw new Error("PDF Generation Failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `Tailored_Resume_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download Failed:", error);
            alert("Failed to download PDF. Is the backend running?");
        }
    },

    // --- Resume Maker (CrewAI) ---
    isMakerGenerating: false,
    makerError: null,
    makerResumeOutput: null,

    generateMakerResume: async (jobDescription) => {
        set({ isMakerGenerating: true, makerError: null, makerResumeOutput: null });
        try {
            const { profile } = get();

            // Need a profile to work
            if (!profile?.id) throw new Error("No active profile found. Please login.");

            const payload = {
                profile_id: profile.id,
                resume_context: profile.resume_context || MOCK_MASTER_RESUME,
                job_description: jobDescription
            };

            const response = await fetch('http://localhost:8000/api/v1/ai/generate-resume-from-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // Start Simple, assumes no Auth header check on backend or cookie handles it?
                // The dashboard uses getAuthHeaders() which includes the access token. 
                // The extension should also send auth headers if possible, or maybe the session is enough if cookie?
                // Actually the extension store has 'session.access_token'.
                body: JSON.stringify(payload)
            });

            // We should add Authorization header if we have a session
            const session = get().session;
            const headers = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            // Retry fetch with headers
            const authenticatedResponse = await fetch('http://localhost:8000/api/v1/ai/generate-resume-from-text', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });


            if (!authenticatedResponse.ok) {
                const errData = await authenticatedResponse.json();
                throw new Error(errData.detail || `Backend Error: ${authenticatedResponse.statusText}`);
            }

            const data = await authenticatedResponse.json();
            // data.optimized_resume is a STRING containing JSON.
            // We might need to parse it if we want to render it nicely, or just confirm it's a string

            let parsedOutput = null;
            try {
                parsedOutput = JSON.parse(data.optimized_resume);
            } catch (e) {
                console.warn("Could not parse CrewAI output as JSON, using raw string.", e);
                parsedOutput = { raw: data.optimized_resume };
            }

            set({ makerResumeOutput: parsedOutput, isMakerGenerating: false });

        } catch (error) {
            console.error("Maker Generation Failed:", error);
            set({ isMakerGenerating: false, makerError: error.message });
        }
    },

    downloadMakerPDF: async () => {
        const { makerResumeOutput } = get();
        if (!makerResumeOutput) return;

        // makerResumeOutput usually has { resume: {...}, rationale: "..." }
        // The render-pdf endpoint expects just the resume data (the content of "resume" key)
        // OR checks if it's the root object.
        // Let's check the structure.

        let resumeDataToRender = makerResumeOutput;
        if (makerResumeOutput.resume && !makerResumeOutput.contact_info) {
            // It's the Wrapper object { resume: ..., rationale: ... }
            resumeDataToRender = makerResumeOutput.resume;
        }

        try {
            const response = await fetch('http://localhost:8000/api/v1/resume/render-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resumeDataToRender)
            });

            if (!response.ok) throw new Error("PDF Generation Failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `Optimized_Resume_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download Failed:", error);
            alert("Failed to download PDF. Is the backend running?");
        }
    }
}));
