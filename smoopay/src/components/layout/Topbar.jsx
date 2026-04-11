import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMockStore } from '../../store/MockStore';

export default function Topbar() {
  const { theme, toggleTheme, user } = useMockStore();
  const displayName = user?.profileData?.givenName || user?.name || 'User';
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-16 border-b border-border bg-surface/30 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 relative z-[140] transition-colors"
    >
      <div className="flex items-center flex-1 gap-4">
        <button className="md:hidden text-textSecondary hover:text-textPrimary transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full text-textSecondary hover:bg-surface-hover/50 hover:text-textPrimary transition-all">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-3 border-l border-border pl-4 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium group-hover:text-primary transition-colors">{displayName}</span>
            <span className="text-xs text-textSecondary">Corporate</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-sm font-bold text-black">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
