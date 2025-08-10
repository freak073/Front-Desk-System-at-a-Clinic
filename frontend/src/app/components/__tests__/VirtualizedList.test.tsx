import React from 'react';
import { render, screen } from '@testing-library/react';
import { VirtualizedList } from '../VirtualizedList';

describe('VirtualizedList', () => {
  it('renders all items without virtualization when below threshold', () => {
    const items = Array.from({ length: 3 }, (_,i)=>({ id:i, label:`Item ${i}` }));
    render(<VirtualizedList items={items} itemHeight={30} height={200} renderItem={(it)=> <div>{it.label}</div>} />);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
