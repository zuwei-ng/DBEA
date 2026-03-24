import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function GlassCard({ children, className, delay = 0, hoverEffect = false, animate = true }) {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] } }
  };

  return (
    <motion.div
      variants={animate ? containerVariants : {}}
      initial={animate ? "hidden" : false}
      animate={animate ? "visible" : false}
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        "glass-panel p-6 relative group transform-gpu",
        hoverEffect && "hover:shadow-[0_20px_40px_-15px_var(--glow-color)] hover:border-primary/20 transition-all duration-300",
        className
      )}
    >
      {/* Subtle shine effect on hover */}
      {hoverEffect && (
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
