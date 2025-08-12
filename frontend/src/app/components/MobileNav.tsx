"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      </svg>
    )
  },
  { 
    href: '/dashboard/queue', 
    label: 'Queue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    href: '/dashboard/appointments', 
    label: 'Appointments',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    href: '/dashboard/doctors', 
    label: 'Doctors',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
];

interface MobileNavProps { 
  onSwipeNavigate?: (dir: 'left'|'right') => void; 
}

export const MobileNav: React.FC<MobileNavProps> = ({ onSwipeNavigate }) => {
  const rawPath = usePathname();
  const router = useRouter();
  const pathname = rawPath || '';
  const [visible, setVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { 
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    touchEndY.current = e.changedTouches[0].screenY;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
      const dir = deltaX < 0 ? 'left' : 'right';
      onSwipeNavigate?.(dir);
      
      // Navigate to next/previous tab
      const currentIdx = navItems.findIndex(item => pathname.startsWith(item.href));
      if (currentIdx !== -1) {
        const nextIdx = dir === 'left' 
          ? Math.min(navItems.length - 1, currentIdx + 1) 
          : Math.max(0, currentIdx - 1);
        
        if (nextIdx !== currentIdx) {
          setIsTransitioning(true);
          router.push(navItems[nextIdx].href);
          setTimeout(() => setIsTransitioning(false), 300);
        }
      }
    }
  };

  // Auto-hide on scroll
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const current = window.scrollY;
          if (Math.abs(current - lastY) > 25) {
            setVisible(current < lastY || current < 20);
            lastY = current;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Mobile navigation"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-surface-900/95 backdrop-blur-sm border-t border-gray-700 transition-all duration-300 md:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      } ${isTransitioning ? 'opacity-75' : 'opacity-100'}`}
    >
      <div className="flex justify-around items-center py-2 px-2">
        {navItems.map((item, index) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center justify-center text-xs transition-all duration-200 rounded-lg p-2 min-w-[60px] min-h-[52px] ${
                active 
                  ? 'text-accent-400 bg-accent-600/20' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-surface-800'
              } focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-900`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="mb-1">{item.icon}</span>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Swipe indicator */}
      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-600 rounded-full"></div>
    </nav>
  );
};

export default MobileNav;
