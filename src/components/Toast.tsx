import { useEffect } from 'react';
import type { ToastProps } from '../types'; // Centralized import

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000); 
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="bg-surface border-l-4 border-accent-primary p-4 shadow-2xl flex items-center gap-4 min-w-[300px]">
        {/* The "Status Indicator" dot */}
        <div className="h-2 w-2 bg-accent-primary animate-pulse" />
        <div>
          <p className="font-mono text-[10px] text-accent-primary uppercase tracking-widest mb-1">
            SYSTEM_NOTIFICATION // OK
          </p>
          <p className="font-sans font-medium text-text-primary text-sm uppercase">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}