import { apiService } from '../../../lib/api';
import { unwrapEnvelope, unwrapWithMeta } from '../../../lib/unwrapEnvelope';
import { QueueEntry, CreateQueueEntryDto, UpdateQueueEntryDto } from '../../../types';

export interface QueueStats {
  totalWaiting: number;
  totalWithDoctor: number;
  totalCompleted: number;
  urgentWaiting: number;
  averageWaitTime: number;
}

export const fetchQueueEntries = async (): Promise<QueueEntry[]> => {
  try {
  const response = await apiService.get<any>('/queue');
  const { data } = unwrapWithMeta<QueueEntry[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to fetch queue entries:', error);
    return [];
  }
};

export const fetchCurrentQueue = async (): Promise<QueueEntry[]> => {
  try {
  const response = await apiService.get<any>('/queue/current');
  return unwrapEnvelope<QueueEntry[]>(response) || [];
  } catch (error) {
    console.error('Failed to fetch current queue:', error);
    return [];
  }
};

export const fetchQueueStats = async (): Promise<QueueStats> => {
  try {
    const response = await apiService.get<any>('/queue/stats');
    return unwrapEnvelope<QueueStats>(response) || {
      totalWaiting: 0,
      totalWithDoctor: 0,
      totalCompleted: 0,
      urgentWaiting: 0,
      averageWaitTime: 0
    };
  } catch (error) {
    console.error('Failed to fetch queue stats:', error);
    return {
      totalWaiting: 0,
      totalWithDoctor: 0,
      totalCompleted: 0,
      urgentWaiting: 0,
      averageWaitTime: 0
    };
  }
};

export const searchQueue = async (searchTerm: string): Promise<QueueEntry[]> => {
  try {
  const response = await apiService.get<any>('/queue', { search: searchTerm });
  const { data } = unwrapWithMeta<QueueEntry[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to search queue:', error);
    return [];
  }
};

export const addToQueue = async (data: CreateQueueEntryDto): Promise<QueueEntry | null> => {
  try {
  const response = await apiService.post<any>('/queue', data);
  return unwrapEnvelope<QueueEntry | null>(response) || null;
  } catch (error) {
    console.error('Failed to add patient to queue:', error);
    return null;
  }
};

export const updateQueueEntryStatus = async (id: number, data: UpdateQueueEntryDto): Promise<QueueEntry | null> => {
  try {
  const response = await apiService.patch<any>(`/queue/${id}`, data);
  return unwrapEnvelope<QueueEntry | null>(response) || null;
  } catch (error) {
    console.error('Failed to update queue entry status:', error);
    return null;
  }
};

export const removeFromQueue = async (id: number): Promise<boolean> => {
  try {
  await apiService.delete(`/queue/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to remove patient from queue:', error);
    return false;
  }
};

export const fetchPatients = async (): Promise<any[]> => {
  try {
  console.debug('[queue.fetchPatients] Requesting /patients');
  const response = await apiService.get<any>('/patients');
  const { data } = unwrapWithMeta<any[]>(response);
  console.debug('[queue.fetchPatients] Received patients:', Array.isArray(data) ? data.length : 'non-array');
  return data;
  } catch (error) {
  console.error('[queue.fetchPatients] Failed:', error);
    return [];
  }
};

export const searchPatients = async (searchTerm: string): Promise<any[]> => {
  try {
  const response = await apiService.get<any>('/patients/search', { q: searchTerm });
  const { data } = unwrapWithMeta<any[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to search patients:', error);
    return [];
  }
};