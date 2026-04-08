import React from 'react';
import { motion } from 'framer-motion';
import { useMockStore } from '../store/MockStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Shield, UserPlus, UserCheck, Zap } from 'lucide-react';

export default function Login() {
  const { login, signUp } = useMockStore();

  const handleLogin = (isNewUser) => {
    if (isNewUser) {
      signUp({
        name: 'New Business',
        email: 'onboarding@smoopay.fi',
        isNewUser: true
      });
    } else {
      login({
        name: 'Alex Chen',
        email: 'alex@smoopay.fi',
        isNewUser: false,
        onboardingStep: 5 // Fully onboarded
      });
    }
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
              <p className="text-sm text-textSecondary mt-1">Choose an account to continue for the demo</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => handleLogin(false)}
                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-surface-hover/20 border border-border hover:bg-surface-hover/40 hover:border-primary/50 transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-textPrimary">Existing User</div>
                  <div className="text-xs text-textSecondary">Alex Chen • Verified Portfolio</div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                   <Shield className="w-4 h-4 text-primary" />
                </div>
              </button>

              <button
                onClick={() => handleLogin(true)}
                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-surface-hover/20 border border-border hover:bg-surface-hover/40 hover:border-purple-500/50 transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-bold text-textPrimary">New User</div>
                  <div className="text-xs text-textSecondary">Requires KYC/AML Onboarding</div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                   <Shield className="w-4 h-4 text-purple-400" />
                </div>
              </button>
            </div>

            <div className="pt-4 text-center">
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
