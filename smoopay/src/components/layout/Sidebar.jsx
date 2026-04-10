import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMockStore } from '../../store/MockStore';
import { LayoutDashboard, Send, ShieldCheck, UserCheck, Settings, LogOut, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Transfer', icon: Send, path: '/transfer' },
  { name: 'Escrow', icon: ShieldCheck, path: '/escrow' },
  { name: 'Transactions', icon: FileText, path: '/transactions' },
  { name: 'Currencies & Limits', icon: UserCheck, path: '/manage-currencies' },
];

export default function Sidebar() {
  const { logout, user } = useMockStore();

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-64 border-r border-border bg-surface/50 backdrop-blur-3xl hidden md:flex flex-col relative z-[150] transition-colors"
    >
      <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-glow text-sm">
            S
          </div>
          SmooPay
        </div>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group relative overflow-hidden",
              isActive 
                ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,184,217,0.1)] border border-primary/20" 
                : "text-textSecondary hover:text-textPrimary hover:bg-surface-hover/50 border border-transparent"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                   <motion.div 
                     layoutId="sidebar-active" 
                     className="absolute inset-0 bg-primary/10 rounded-xl"
                     initial={false}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   />
                )}
                <item.icon className={cn("w-5 h-5 relative z-10 transition-colors", isActive ? "stroke-primary" : "group-hover:stroke-textPrimary")} />
                <span className="relative z-10">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t border-border shrink-0 space-y-2">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-surface-hover/50 w-full transition-all group">
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Settings
        </button>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all group font-medium"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          Logout
        </button>
      </div>
    </motion.aside>
  );
}
