import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/pages/Auth';
import MainDashboard from './MainDashboard'; // <-- Import the new component we just made

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // <-- Add loading state

  useEffect(() => {
    // Check for an active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // <-- Stop loading once we have a session
    });

    // Listen for changes in authentication state (sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // Show a blank page while we check for the session
  if (loading) {
    return <div className="min-h-screen bg-slate-100" />; 
  }

  // If there is no session, show the Auth page.
  // Otherwise, show the main dashboard.
  return (
    <>
      {!session ? (
        <Auth />
      ) : (
        // We pass the user's ID as a key to force a re-render on login/logout
        <MainDashboard key={session.user.id} /> 
      )}
    </>
  );
}