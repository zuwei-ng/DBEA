import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className, 
  pulse = false,
  ...props 
}) {
  const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white dark:text-background hover:opacity-90 shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)] border border-transparent font-bold tracking-wide",
    secondary: "bg-surface text-textPrimary hover:bg-surface-hover/80 border border-white/10 dark:border-white/10 shadow-glass hover:shadow-[0_0_20px_rgba(0,184,217,0.1)]",
    ghost: "text-textSecondary hover:text-textPrimary hover:bg-surface-hover/50",
    destructive: "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5",
    lg: "px-8 py-3.5 text-lg",
    icon: "p-2.5"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={pulse ? { scale: 1.02 } : {}}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Pulse effect overlay */}
      {pulse && (
        <span className="absolute inset-0 rounded-xl bg-primary opacity-0 hover:opacity-20 hover:animate-ping transition-opacity" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
