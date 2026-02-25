import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Unified Card component for "Refined Minimalist" UI.
 * Features:
 * - bg-white backdrop
 * - 16px (2xl) rounded corners
 * - Subtle border (zinc-200/50)
 * - Extra-small shadow (shadow-xs)
 * - Tactile interaction when clickable
 */
export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-zinc-200/50 shadow-xs transition-all ${
        onClick ? 'active:scale-[0.98] cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
