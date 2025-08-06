/**
 * Utility functions for cross-tab data synchronization
 */

/**
 * Notify other tabs that data has been updated for a specific category
 * @param categoryId - The data category that was updated
 */
export function notifyDataUpdate(categoryId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`data-updated-${categoryId}`, Date.now().toString());
  }
}

/**
 * Listen for data updates from other tabs
 * @param categoryId - The data category to listen for
 * @param callback - Function to call when data is updated
 * @returns Cleanup function to remove the listener
 */
export function listenForDataUpdates(
  categoryId: string, 
  callback: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === `data-updated-${categoryId}`) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Check if data should be refreshed based on visibility and focus events
 * @param callback - Function to call when refresh is needed
 * @returns Cleanup function to remove the listeners
 */
export function setupSmartRefresh(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleVisibilityChange = () => {
    // Refresh data when user comes back to the tab
    if (!document.hidden) {
      callback();
    }
  };

  const handleFocus = () => {
    // Refresh data when window gets focus
    callback();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
}

/**
 * Map data category IDs to their respective types for type safety
 */
export const DATA_CATEGORIES = {
  OPERATIONAL_REPORTS: 'operational-reports',
  KTA_TTA: 'kta-tta',
  KPI_UTAMA: 'kpi-utama',
  MAINTENANCE_ROUTINE: 'maintenance-routine',
  CRITICAL_ISSUES: 'critical-issues',
  SAFETY_INCIDENTS: 'safety-incidents',
  ENERGY_TARGETS: 'energy-targets',
  ENERGY_CONSUMPTION: 'energy-consumption',
} as const;

export type DataCategoryId = typeof DATA_CATEGORIES[keyof typeof DATA_CATEGORIES];