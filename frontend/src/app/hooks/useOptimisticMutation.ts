import { useMutation, useQueryClient } from 'react-query';
import { useCallback } from 'react';
import { useGlobalState } from '../../context/GlobalStateContext';
import { useToast } from '../components/ToastProvider';

interface OptimisticMutationOptions<TData, TVariables> {
  // Query key to update optimistically
  queryKey: string | unknown[];
  
  // Function to update the cached data optimistically
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  
  // Function to rollback the optimistic update
  rollbackFn?: (oldData: TData | undefined, variables: TVariables) => TData;
  
  // Success/error callbacks
  onSuccess?: (data: any, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables, rollbackData: TData | undefined) => void;
  
  // Notification settings
  showNotifications?: boolean;
  successMessage?: string | ((data: any, variables: TVariables) => string);
  errorMessage?: string | ((error: Error, variables: TVariables) => string);
  
  // Optimistic update settings
  optimisticUpdateType?: 'create' | 'update' | 'delete';
  
  // Whether to invalidate queries after successful mutation
  invalidateQueries?: boolean | string[];
}

/**
 * Hook for mutations with optimistic updates and global state integration
 */
export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: OptimisticMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { addOptimisticUpdate, removeOptimisticUpdate } = useGlobalState();
  const { success: showSuccess, error: showError } = useToast();
  
  const {
    queryKey,
    updateFn,
    rollbackFn,
    onSuccess,
    onError,
    showNotifications = true,
    successMessage,
    errorMessage,
    optimisticUpdateType = 'update',
    invalidateQueries = true,
  } = options;
  
  const mutation = useMutation<TData, TError, TVariables, { previousData: TData | undefined; updateId: string }>(
    mutationFn,
    {
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(queryKey);
        
        // Snapshot the previous value
        const previousData = queryClient.getQueryData<TData>(queryKey);
        
        // Generate unique ID for this optimistic update
        const updateId = `${JSON.stringify(queryKey)}-${Date.now()}`;
        
        // Add to optimistic updates tracking
        addOptimisticUpdate(updateId, optimisticUpdateType, variables);
        
        // Optimistically update the cache
        queryClient.setQueryData<TData>(queryKey, (oldData) => 
          updateFn(oldData, variables)
        );
        
        // Return context with previous data and update ID
        return { previousData, updateId };
      },
      
      onSuccess: (data, variables, context) => {
        // Remove from optimistic updates tracking
        if (context?.updateId) {
          removeOptimisticUpdate(context.updateId);
        }
        
        // Show success notification
        if (showNotifications) {
          const message = typeof successMessage === 'function' 
            ? successMessage(data, variables)
            : successMessage || 'Operation completed successfully';
          showSuccess(message);
        }
        
        // Invalidate and refetch queries
        if (invalidateQueries === true) {
          queryClient.invalidateQueries(queryKey);
        } else if (Array.isArray(invalidateQueries)) {
          invalidateQueries.forEach(key => {
            queryClient.invalidateQueries(key);
          });
        }
        
        // Call custom success handler
        onSuccess?.(data, variables);
      },
      
      onError: (error, variables, context) => {
        // Remove from optimistic updates tracking
        if (context?.updateId) {
          removeOptimisticUpdate(context.updateId);
        }
        
        // Rollback the optimistic update
        if (context?.previousData !== undefined) {
          if (rollbackFn) {
            queryClient.setQueryData<TData>(queryKey, (oldData) => 
              rollbackFn(oldData, variables)
            );
          } else {
            queryClient.setQueryData<TData>(queryKey, context.previousData);
          }
        }
        
        // Show error notification
        if (showNotifications) {
          const message = typeof errorMessage === 'function'
            ? errorMessage(error as Error, variables)
            : errorMessage || `Operation failed: ${(error as Error).message}`;
          showError(message);
        }
        
        // Call custom error handler
        onError?.(error as Error, variables, context?.previousData);
      },
    }
  );
  
  return mutation;
}

/**
 * Convenience hook for create operations
 */
export function useOptimisticCreate<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<OptimisticMutationOptions<TData[], TVariables>, 'optimisticUpdateType' | 'updateFn'> & {
    updateFn?: (oldData: TData[] | undefined, variables: TVariables) => TData[];
  }
) {
  const defaultUpdateFn = useCallback((oldData: TData[] | undefined, variables: TVariables) => {
    if (options.updateFn) {
      return options.updateFn(oldData, variables);
    }
    // Default: add new item to the beginning of the list
    return [variables as unknown as TData, ...(oldData || [])];
  }, [options.updateFn]);
  
  return useOptimisticMutation<TData[], TError, TVariables>(mutationFn as (variables: TVariables) => Promise<TData[]>, {
    ...options,
    optimisticUpdateType: 'create',
    updateFn: defaultUpdateFn,
    successMessage: options.successMessage || 'Item created successfully',
  });
}

/**
 * Convenience hook for update operations
 */
export function useOptimisticUpdate<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<OptimisticMutationOptions<TData[], TVariables>, 'optimisticUpdateType' | 'updateFn'> & {
    updateFn?: (oldData: TData[] | undefined, variables: TVariables) => TData[];
    getId: (item: TData) => string | number;
    getUpdatedItem: (variables: TVariables) => Partial<TData> & { id: string | number };
  }
) {
  const defaultUpdateFn = useCallback((oldData: TData[] | undefined, variables: TVariables) => {
    if (options.updateFn) {
      return options.updateFn(oldData, variables);
    }
    
    const updatedItem = options.getUpdatedItem(variables);
    return (oldData || []).map(item => 
      options.getId(item) === updatedItem.id 
        ? { ...item, ...updatedItem }
        : item
    );
  }, [options.updateFn, options.getId, options.getUpdatedItem]);
  
  return useOptimisticMutation<TData[], TError, TVariables>(mutationFn as (variables: TVariables) => Promise<TData[]>, {
    ...options,
    optimisticUpdateType: 'update',
    updateFn: defaultUpdateFn,
    successMessage: options.successMessage || 'Item updated successfully',
  });
}

/**
 * Convenience hook for delete operations
 */
export function useOptimisticDelete<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<OptimisticMutationOptions<TData[], TVariables>, 'optimisticUpdateType' | 'updateFn'> & {
    updateFn?: (oldData: TData[] | undefined, variables: TVariables) => TData[];
    getId: (item: TData) => string | number;
    getDeleteId: (variables: TVariables) => string | number;
  }
) {
  const defaultUpdateFn = useCallback((oldData: TData[] | undefined, variables: TVariables) => {
    if (options.updateFn) {
      return options.updateFn(oldData, variables);
    }
    
    const deleteId = options.getDeleteId(variables);
    return (oldData || []).filter(item => options.getId(item) !== deleteId);
  }, [options.updateFn, options.getId, options.getDeleteId]);
  
  return useOptimisticMutation<TData[], TError, TVariables>(mutationFn as (variables: TVariables) => Promise<TData[]>, {
    ...options,
    optimisticUpdateType: 'delete',
    updateFn: defaultUpdateFn,
    successMessage: options.successMessage || 'Item deleted successfully',
  });
}