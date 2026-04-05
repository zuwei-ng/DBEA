import React from 'react';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMockStore } from '../../store/MockStore';

export default function Topbar() {
  const { theme, toggleTheme } = useMockStore();
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
        <div className="relative w-full max-w-md hidden sm:block group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search transfers, invoices..." 
              className="w-full bg-surface-hover/20 border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none text-textPrimary placeholder-textSecondary shadow-inner"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full text-textSecondary hover:bg-surface-hover/50 hover:text-textPrimary transition-all">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="relative p-2 rounded-full text-textSecondary hover:bg-surface-hover/50 hover:text-textPrimary transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-glow animate-pulse"></span>
        </button>
        <div className="flex items-center gap-3 border-l border-border pl-4 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium group-hover:text-primary transition-colors">Alex Chen</span>
            <span className="text-xs text-textSecondary">Admin Pro</span>
          </div>
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-secondary">
             <img 
               src="https://i.pravatar.cc/150?u=alex" 
               alt="User avatar" 
               className="w-9 h-9 rounded-full border-2 border-background"
             />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
