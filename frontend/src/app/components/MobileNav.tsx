"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard/appointments', label: 'Appointments' },
  { href: '/dashboard/queue', label: 'Queue' },
  { href: '/dashboard', label: 'Dashboard' }
];

interface MobileNavProps { onSwipeNavigate?: (dir: 'left'|'right') => void; }

export const MobileNav: React.FC<MobileNavProps> = ({ onSwipeNavigate }) => {
  const rawPath = usePathname();
  const router = useRouter();
  const pathname = rawPath || '';
  const [visible, setVisible] = useState(true);
  let touchStartX = 0; let touchEndX = 0;

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX = e.changedTouches[0].screenX;
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) > 60) {
      const dir = delta < 0 ? 'left' : 'right';
      onSwipeNavigate?.(dir);
      // derive current index
      const idx = navItems.findIndex(i => pathname.startsWith(i.href));
      if (idx !== -1) {
        const nextIdx = dir === 'left' ? Math.min(navItems.length -1, idx + 1) : Math.max(0, idx -1);
        if (nextIdx !== idx) router.push(navItems[nextIdx].href);
      }
    }
  };

  useEffect(()=>{
    let lastY = window.scrollY; const onScroll = () => {
      const current = window.scrollY; if (Math.abs(current - lastY) > 25) { setVisible(current < lastY || current < 20); lastY = current; }
    }; window.addEventListener('scroll', onScroll); return ()=> window.removeEventListener('scroll', onScroll);
  },[]);

  return (
    <nav
      aria-label="Mobile navigation"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-gray-800/95 backdrop-blur border-t border-gray-700 flex justify-around py-2 transition-transform md:hidden ${visible? 'translate-y-0' : 'translate-y-full'}`}
    >
      {navItems.map(item => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center text-xs ${active? 'text-blue-400' : 'text-gray-300'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
