import React from 'react';
import { render, fireEvent } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/appointments',
  useRouter: () => ({ push: jest.fn() })
}));

import MobileNav from '../MobileNav';

describe('MobileNav', () => {
  it('triggers onSwipeNavigate on swipe', () => {
    const spy = jest.fn();
    const { getByLabelText } = render(<MobileNav onSwipeNavigate={spy} /> as any);
    const nav = getByLabelText('Mobile navigation');
    fireEvent.touchStart(nav, { changedTouches: [{ screenX: 200 }] });
    fireEvent.touchEnd(nav, { changedTouches: [{ screenX: 100 }] }); // left swipe
    expect(spy).toHaveBeenCalledWith('left');
  });
});
