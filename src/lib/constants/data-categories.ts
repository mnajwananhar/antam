/**
 * Data category constants - simplified version
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