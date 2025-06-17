import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff, Shield, Mail } from 'lucide-react'; // Added Mail icon for password reset message

// --- Firebase Authentication Imports ---
import { auth } from '@/lib/firebase'; // Import the auth instance from your firebase config
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // Import sendPasswordResetEmail
// --- End Firebase Authentication Imports ---

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
}

export const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  // 'username' state will now hold the admin's email address
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState(''); // New state for password reset feedback

  // Basic client-side email validation
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    setPasswordResetMessage(''); // Clear any password reset messages
    setIsLoading(true);

    if (!validateEmail(username)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      // Attempt to sign in with Firebase Authentication
      await signInWithEmailAndPassword(auth, username, password);
      onLogin(true); // Call onLogin with true on successful authentication
    } catch (err: any) {
      console.error("Firebase Login Error:", err); // Log the full error for debugging

      // Provide user-friendly error messages based on Firebase error codes
      let errorMessage = "An unexpected error occurred. Please try again.";
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Newer Firebase versions might use this for incorrect username/password
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          // For other unhandled Firebase errors, or if 'code' is not present
          errorMessage = `Login failed: ${err.message || "Please check your credentials."}`;
          break;
      }
      setError(errorMessage);
      onLogin(false); // Call onLogin with false on failed authentication
    } finally {
      setIsLoading(false); // Always set loading to false after attempt
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setPasswordResetMessage('');

    if (!validateEmail(username)) {
      setError('Please enter your email address in the field above to reset your password.');
      return;
    }

    setIsLoading(true); // Set loading while sending reset email

    try {
      await sendPasswordResetEmail(auth, username);
      setPasswordResetMessage('Password reset email sent! Check your inbox.');
      setUsername(''); // Optionally clear email field after sending for security/UX
    } catch (err: any) {
      console.error("Firebase Password Reset Error:", err);
      let errorMessage = "Failed to send password reset email. Please try again.";
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with that email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = `Error sending reset email: ${err.message || "Please try again."}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">
            Admin Portal
          </CardTitle>
          <p className="text-blue-100/80 text-lg">Madras Villa Management</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Admin Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-amber-500 focus:ring-amber-500/20 h-12 pl-4"
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-amber-500 focus:ring-amber-500/20 h-12 pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            {passwordResetMessage && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-200 text-sm text-center flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> {passwordResetMessage}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Sign In
                </div>
              )}
            </Button>

            <Button
              type="button" // Important: set type to "button" to prevent form submission
              variant="link"
              onClick={handleForgotPassword}
              disabled={isLoading} // Disable while loading
              className="w-full text-blue-200 hover:text-blue-100 text-sm py-2 px-4 rounded-md disabled:opacity-50"
            >
              Forgot Password?
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};