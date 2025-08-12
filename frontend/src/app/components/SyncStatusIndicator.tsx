'use client';

import React from 'react';
import { useGlobalState } from '../../context/GlobalStateContext';

interface SyncStatusIndicatorProps {
  dataType?: keyof ReturnType<typeof useGlobalState>['state']['syncStatus'];
  showLabel?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  dataType,
  showLabel = false,
  className = ''
}) => {
  const { state, isSyncing } = useGlobalState();
  
  // If no specific data type, show overall sync status
  const isAnySyncing = dataType ? state.syncStatus[dataType] === 'syncing' : isSyncing();
  const hasAnyError = dataType 
    ? state.syncStatus[dataType] === 'error'
    : Object.values(state.syncStatus).some(status => status === 'error');
  
  const getStatusInfo = () => {
    if (!state.isOnline) {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-400/20',
        icon: '⚠️',
        label: 'Offline',
        pulse: false
      };
    }
    
    if (isAnySyncing) {
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/20',
        icon: '🔄',
        label: 'Syncing',
        pulse: true
      };
    }
    
    if (hasAnyError) {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-400/20',
        icon: '❌',
        label: 'Sync Error',
        pulse: false
      };
    }
    
    return {
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
      icon: '✅',
      label: 'Synced',
      pulse: false
    };
  };
  
  const statusInfo = getStatusInfo();
  
  const formatLastSyncTime = () => {
    if (!state.lastSyncTime) return 'Never';
    
    const now = Date.now();
    const diff = now - state.lastSyncTime;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${statusInfo.bgColor} ${statusInfo.pulse ? 'animate-pulse' : ''}`}
        title={`Status: ${statusInfo.label}${state.lastSyncTime ? ` | Last sync: ${formatLastSyncTime()}` : ''}`}
      />
      {showLabel && (
        <span className={`text-xs ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      )}
    </div>
  );
};

// Detailed sync status component for debugging/admin
export const DetailedSyncStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { state } = useGlobalState();
  
  return (
    <div className={`bg-surface-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-200 mb-3">Sync Status</h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Connection:</span>
          <span className={state.isOnline ? 'text-green-400' : 'text-red-400'}>
            {state.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Last Sync:</span>
          <span className="text-gray-300">
            {state.lastSyncTime 
              ? new Date(state.lastSyncTime).toLocaleTimeString()
              : 'Never'
            }
          </span>
        </div>
        
        <div className="border-t border-gray-600 pt-2 mt-2">
          {Object.entries(state.syncStatus).map(([key, status]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-gray-400 capitalize">{key}:</span>
              <span className={
                status === 'syncing' ? 'text-blue-400' :
                status === 'error' ? 'text-red-400' :
                'text-green-400'
              }>
                {status === 'syncing' && <span className="animate-pulse">●</span>}
                {status}
              </span>
            </div>
          ))}
        </div>
        
        {Object.values(state.optimisticUpdates).length > 0 && (
          <div className="border-t border-gray-600 pt-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Pending Updates:</span>
              <span className="text-yellow-400">
                {Object.values(state.optimisticUpdates).length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};