import { apiService } from '../../../lib/api';
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
    const response = await apiService.get<QueueEntry[]>('/queue');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch queue entries:', error);
    return [];
  }
};

export const fetchCurrentQueue = async (): Promise<QueueEntry[]> => {
  try {
    const response = await apiService.get<QueueEntry[]>('/queue/current');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch current queue:', error);
    return [];
  }
};

export const fetchQueueStats = async (): Promise<QueueStats> => {
  try {
    const response = await apiService.get<QueueStats>('/queue/stats');
    return response.data || {
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
    const response = await apiService.get<QueueEntry[]>('/queue', { search: searchTerm });
    return response.data || [];
  } catch (error) {
    console.error('Failed to search queue:', error);
    return [];
  }
};

export const addToQueue = async (data: CreateQueueEntryDto): Promise<QueueEntry | null> => {
  try {
    const response = await apiService.post<QueueEntry>('/queue', data);
    return response.data || null;
  } catch (error) {
    console.error('Failed to add patient to queue:', error);
    return null;
  }
};

export const updateQueueEntryStatus = async (id: number, data: UpdateQueueEntryDto): Promise<QueueEntry | null> => {
  try {
    const response = await apiService.patch<QueueEntry>(`/queue/${id}`, data);
    return response.data || null;
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
    const response = await apiService.get<any[]>('/patients');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return [];
  }
};

export const searchPatients = async (searchTerm: string): Promise<any[]> => {
  try {
    const response = await apiService.get<any[]>('/patients/search', { q: searchTerm });
    return response.data || [];
  } catch (error) {
    console.error('Failed to search patients:', error);
    return [];
  }
};