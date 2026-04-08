import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockStore } from '../store/MockStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Shield, UserPlus, LogIn, Zap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const { login, signUp } = useMockStore();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError('Please enter both User ID and Password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Authenticate against SMUtBank API
      const token = btoa("12173e30ec556fe4a951:2fbbd75fd60a8389b82719d2dbc37f1eb9ed226f3eb43cfa7d9240c72fd5+bfc89ad4-c17f-4fe9-82c2-918d29d59fe0");
      const res = await fetch(`https://smuedu-dev.outsystemsenterprise.com/Gateway/rest/Customer/?CustomerID=&CertificateNo=`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Try to find the customer by searching
      const searchRes = await fetch(`https://smuedu-dev.outsystemsenterprise.com/Gateway/rest/Customer/customers?page=1&size=100`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferredUserld: userId,
          password: password,
          tenantId: "600"
        })
      });

      const searchData = await searchRes.json();
      let parsed = typeof searchData === 'string' ? JSON.parse(searchData) : searchData;

      // Check if customer found
      if (parsed?.Customers && parsed.Customers.length > 0) {
        const customer = parsed.Customers[0];
        login({
          name: customer.givenName || userId,
          email: customer.emailAddress || '',
          isNewUser: false,
          onboardingStep: 5,
          profileData: {
            givenName: customer.givenName || userId,
            preferredUserld: userId,
            emailAddress: customer.emailAddress || '',
            customerId: customer.customerID || ''
          }
        });
      } else if (parsed?.Errors) {
        setError(parsed.Errors[0] || 'Invalid credentials. Please try again.');
      } else {
        // Fallback: try matching against locally stored onboarding data
        const storedUser = JSON.parse(localStorage.getItem('lastOnboardedUser') || 'null');
        if (storedUser && storedUser.preferredUserld === userId && storedUser.password === password) {
          login({
            name: storedUser.givenName || userId,
            email: storedUser.emailAddress || '',
            isNewUser: false,
            onboardingStep: 5,
            profileData: storedUser
          });
        } else {
          setError('Invalid User ID or Password.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback to local credential check
      const storedUser = JSON.parse(localStorage.getItem('lastOnboardedUser') || 'null');
      if (storedUser && storedUser.preferredUserld === userId && storedUser.password === password) {
        login({
          name: storedUser.givenName || userId,
          email: storedUser.emailAddress || '',
          isNewUser: false,
          onboardingStep: 5,
          profileData: storedUser
        });
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    signUp({
      name: 'New Business',
      email: 'onboarding@smoopay.fi',
      isNewUser: true
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background transition-colors duration-500">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 shadow-glow mb-4">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-textPrimary mb-2">SmooPay</h1>
          <p className="text-textSecondary">Next-Gen Multi-Currency FinTech</p>
        </motion.div>

        <GlassCard className="p-8 border-border" hoverEffect>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center pb-2">
              <h2 className="text-xl font-semibold text-textPrimary">Welcome Back</h2>
              <p className="text-sm text-textSecondary mt-1">Sign in to your corporate account</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl text-sm border border-red-500/20 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setError(''); }}
                  placeholder="Enter your User ID"
                  className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all placeholder-textSecondary/40"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password"
                    className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 pr-12 focus:border-primary outline-none text-textPrimary transition-all placeholder-textSecondary/40"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full font-bold" 
              disabled={isLoading}
              pulse={!isLoading && userId && password}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> Sign In</>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-3 text-textSecondary tracking-widest font-semibold">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignUp}
              className="group w-full relative flex items-center justify-center gap-3 p-4 rounded-2xl bg-surface-hover/20 border border-border hover:bg-surface-hover/40 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-bold text-textPrimary text-sm">Register New Business</div>
                <div className="text-xs text-textSecondary">Corporate KYC Onboarding</div>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
            </button>

            <div className="pt-2 text-center">
              <p className="text-[10px] uppercase tracking-widest text-textSecondary font-semibold">
                Secured by Bank-Grade Encryption
              </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
