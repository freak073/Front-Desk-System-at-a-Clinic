'use client';

import React, { useState } from 'react';
import ResponsiveTable from '../components/ResponsiveTable';
import TouchFriendlyButton from '../components/TouchFriendlyButton';
import SwipeableStatusUpdate from '../components/SwipeableStatusUpdate';
import ResponsiveLayout from '../components/ResponsiveLayout';

const ResponsiveTestPage = () => {
  const [currentStatus, setCurrentStatus] = useState('waiting');

  const columns = [
    { key: 'name', label: 'Patient Name' },
    { key: 'status', label: 'Status', mobileHidden: true },
    { key: 'priority', label: 'Priority', tabletHidden: true },
    { key: 'time', label: 'Arrival Time', desktopOnly: true },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: () => (
        <div className="flex space-x-2">
          <TouchFriendlyButton size="sm" variant="primary">Edit</TouchFriendlyButton>
          <TouchFriendlyButton size="sm" variant="danger">Remove</TouchFriendlyButton>
        </div>
      )
    }
  ];

  const data = [
    { name: 'John Doe', status: 'waiting', priority: 'normal', time: '10:30 AM' },
    { name: 'Jane Smith', status: 'with_doctor', priority: 'urgent', time: '10:45 AM' },
    { name: 'Bob Johnson', status: 'completed', priority: 'normal', time: '11:00 AM' }
  ];

  const statuses = [
    { value: 'waiting', label: 'Waiting', color: 'bg-yellow-600' },
    { value: 'with_doctor', label: 'With Doctor', color: 'bg-blue-600' },
    { value: 'completed', label: 'Completed', color: 'bg-green-600' }
  ];

  return (
    <ResponsiveLayout>
      <div className="space-y-8">
        <div>
          <h1 className="responsive-text-2xl font-bold text-white mb-4">
            Responsive Design Test Page
          </h1>
          <p className="responsive-text-base text-gray-400 mb-6">
            This page demonstrates the responsive components and design patterns implemented for mobile, tablet, and desktop views.
          </p>
        </div>

        {/* Responsive Breakpoint Indicators */}
        <div className="responsive-card">
          <h2 className="responsive-text-lg font-semibold text-white mb-4">Current Breakpoint</h2>
          <div className="flex space-x-4">
            <div className="mobile-only bg-red-600 text-white px-3 py-2 rounded">
              📱 Mobile (320px-767px)
            </div>
            <div className="tablet-only bg-yellow-600 text-white px-3 py-2 rounded">
              📱 Tablet (768px-1023px)
            </div>
            <div className="desktop-only bg-green-600 text-white px-3 py-2 rounded">
              🖥️ Desktop (1024px+)
            </div>
          </div>
        </div>

        {/* Touch-Friendly Buttons */}
        <div className="responsive-card">
          <h2 className="responsive-text-lg font-semibold text-white mb-4">Touch-Friendly Buttons</h2>
          <div className="responsive-form-actions">
            <TouchFriendlyButton variant="primary" size="sm">
              Small Button
            </TouchFriendlyButton>
            <TouchFriendlyButton variant="secondary" size="md">
              Medium Button
            </TouchFriendlyButton>
            <TouchFriendlyButton variant="danger" size="lg">
              Large Button
            </TouchFriendlyButton>
            <TouchFriendlyButton variant="ghost" loading={true}>
              Loading Button
            </TouchFriendlyButton>
          </div>
        </div>

        {/* Swipeable Status Update */}
        <div className="responsive-card">
          <h2 className="responsive-text-lg font-semibold text-white mb-4">Swipeable Status Update</h2>
          <p className="text-gray-400 text-sm mb-4">
            On mobile: Swipe left/right to change status. On desktop: Use dropdown.
          </p>
          <SwipeableStatusUpdate
            currentStatus={currentStatus}
            statuses={statuses}
            onStatusChange={setCurrentStatus}
          />
          <p className="text-gray-300 text-sm mt-2">Current status: {currentStatus}</p>
        </div>

        {/* Responsive Table */}
        <div className="responsive-card">
          <h2 className="responsive-text-lg font-semibold text-white mb-4">Responsive Table</h2>
          <p className="text-gray-400 text-sm mb-4">
            Mobile: Card view with essential info. Desktop: Full table with all columns.
          </p>
          <ResponsiveTable
            columns={columns}
            data={data}
            mobileCardView={true}
            onRowClick={(row) => alert(`Clicked on ${row.name}`)}
          />
        </div>

        {/* Responsive Grid */}
        <div className="responsive-card">
          <h2 className="responsive-text-lg font-semibold text-white mb-4">Responsive Grid</h2>
          <div className="responsive-grid">
            <div className="bg-surface-700 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Card 1</h3>
              <p className="text-gray-400 text-sm">This is a responsive card that adapts to screen size.</p>
            </div>
            <div className="bg-surface-700 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Card 2</h3>
              <p className="text-gray-400 text-sm">Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns.</p>
            </div>
            <div className="bg-surface-700 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Card 3</h3>
              <p className="text-gray-400 text-sm">Responsive spacing and typography adjust automatically.</p>
            </div>
            <div className="bg-surface-700 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Card 4</h3>
              <p className="text-gray-400 text-sm">Desktop hover effects are applied only on desktop devices.</p>
            </div>
            <div className="bg-surface-700 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Card 5</h3>
              <p className="text-gray-400 text-sm">Touch targets meet the minimum 44px requirement.</p>
            </div>
            <div className="bg-surface-700 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Card 6</h3>
              <p className="text-gray-400 text-sm">All interactive elements are optimized for touch and mouse.</p>
            </div>
          </div>
        </div>

        {/* Responsive Typography */}
        <div className="responsive-card">
          <h2 className="responsive-text-lg font-semibold text-white mb-4">Responsive Typography</h2>
          <div className="responsive-space-y-4">
            <h1 className="responsive-text-2xl font-bold text-white">Heading 1 - Responsive</h1>
            <h2 className="responsive-text-xl font-semibold text-white">Heading 2 - Responsive</h2>
            <h3 className="responsive-text-lg font-medium text-white">Heading 3 - Responsive</h3>
            <p className="responsive-text-base text-gray-300">
              This is body text that scales appropriately across different screen sizes. 
              The text size adjusts to maintain readability on mobile devices while 
              providing optimal reading experience on larger screens.
            </p>
            <p className="responsive-text-sm text-gray-400">
              This is smaller text that also responds to screen size changes.
            </p>
          </div>
        </div>

        {/* Mobile Navigation Test */}
        <div className="responsive-card md:hidden">
          <h2 className="responsive-text-lg font-semibold text-white mb-4">Mobile Navigation</h2>
          <p className="text-gray-400 text-sm mb-4">
            The mobile navigation is visible at the bottom of the screen on mobile devices.
            It includes swipe gesture support for quick navigation between sections.
          </p>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default ResponsiveTestPage;