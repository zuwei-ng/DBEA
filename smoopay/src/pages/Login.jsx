import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMockStore } from '../store/MockStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Shield, UserPlus, Lock, Building, Zap, Activity } from 'lucide-react';

export default function Login() {
  const { login, signUp } = useMockStore();
  const [uen, setUen] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!uen || !password) {
      setErrorMsg("Please enter UEN and password");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const verifyUrl = `https://personal-urfnoedc.outsystemscloud.com/Authentication/rest/Authentication/VerifyLogin?UEN=${encodeURIComponent(uen)}&Password=${encodeURIComponent(password)}`;
      const verifyRes = await fetch(verifyUrl);
      const verifyJson = await verifyRes.json();
      
      if (verifyJson.IsSuccess) {
         const returnedName = verifyJson.GivenName || uen;
         login({
           name: returnedName,
           profileData: {
             givenName: returnedName
           },
           customerId: verifyJson.CustomerId,
           uen: verifyJson.UEN || uen,
           isNewUser: false,
           onboardingStep: 5 // Fully onboarded
         });
      } else {
         setErrorMsg(verifyJson.Message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    signUp({
      name: 'New Business',
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
          <div className="space-y-6">
            <div className="text-center pb-2">
              <h2 className="text-xl font-semibold text-textPrimary">Business Login</h2>
              <p className="text-sm text-textSecondary mt-1">Enter your registered UEN and password</p>
            </div>

            <form onSubmit={submitLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">UEN</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary"><Building className="w-4 h-4"/></div>
                  <input 
                    type="text" 
                    value={uen} 
                    onChange={e => setUen(e.target.value)}
                    className="w-full bg-surface-hover/20 border border-border rounded-xl pl-10 pr-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" 
                    placeholder="e.g. TESTUEN111" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary"><Lock className="w-4 h-4"/></div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-surface-hover/20 border border-border rounded-xl pl-10 pr-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                  {errorMsg}
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
                {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="pt-4 border-t border-border flex flex-col gap-4 text-center">
              <button
                type="button"
                onClick={handleSignUp}
                className="group relative flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-hover/20 border border-border hover:bg-surface-hover/40 hover:border-purple-500/50 transition-all duration-300"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-textPrimary text-sm">Create New Account</span>
              </button>

              <p className="text-[10px] uppercase tracking-widest text-textSecondary font-semibold flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Secured by Bank-Grade Encryption
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
