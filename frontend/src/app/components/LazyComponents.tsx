import { lazy, Suspense } from 'react';
import { SkeletonListItem } from './LoadingStates';

// Lazy load heavy components
export const LazyAppointmentForm = lazy(() => import('./AppointmentForm'));
export const LazyDoctorScheduleForm = lazy(() => import('./DoctorScheduleForm'));
export const LazyMonthlyCalendar = lazy(() => import('../dashboard/components/MonthlyCalendar'));
export const LazyVirtualizedList = lazy(() => import('./VirtualizedList'));
export const LazyPerformanceDashboard = lazy(() => import('./PerformanceMonitoringDashboard'));

// HOC for wrapping lazy components with suspense
export function withLazyLoading(
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
  fallback?: React.ReactNode
) {
  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={fallback || <SkeletonListItem />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-configured lazy components with loading states
export const AppointmentFormWithLoading = withLazyLoading(LazyAppointmentForm);
export const DoctorScheduleFormWithLoading = withLazyLoading(LazyDoctorScheduleForm);
export const MonthlyCalendarWithLoading = withLazyLoading(LazyMonthlyCalendar);
export const VirtualizedListWithLoading = withLazyLoading(LazyVirtualizedList);
export const PerformanceDashboardWithLoading = withLazyLoading(LazyPerformanceDashboard);