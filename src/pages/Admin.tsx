import { useState, useEffect } from 'react';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { auth } from '@/lib/firebase'; // Import the auth instance
import { onAuthStateChanged, signOut, User } from 'firebase/auth'; // Import Firebase auth functions

const Admin = () => {
  // Use a null initial state for `user` to differentiate between
  // "not yet checked" and "not authenticated"
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // New loading state for auth check

  useEffect(() => {
    // Set up Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // currentUser will be null if not logged in, or User object if logged in
      setLoadingAuth(false); // Authentication check is complete
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // This handleLogin is now largely redundant since onAuthStateChanged handles state.
  // We'll keep it for clarity with the AdminLogin component's prop,
  // but it will simply reflect the state Firebase sets.
  const handleLogin = (success: boolean) => {
    // onAuthStateChanged will handle updating the user state automatically
    // after a successful signInWithEmailAndPassword.
    // We don't need to manually set `isAuthenticated` or `localStorage` here.
    console.log("Login attempt result propagated:", success);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user from Firebase
      // setUser(null) will be handled by the onAuthStateChanged listener
      // localStorage.removeItem('adminAuth'); // No longer needed
    } catch (error) {
      console.error("Error signing out:", error);
      // Optionally, show an error message to the user
    }
  };

  if (loadingAuth) {
    // Show a loading indicator while Firebase checks the authentication status
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Loading authentication...</p>
        {/* You could add a spinner or more elaborate loading screen here */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* If `user` is null, they are not authenticated. */}
      {!user ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Admin;