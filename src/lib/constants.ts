// Application constants
export const APP_CONFIG = {
  NAME: "ANTAM SIMBAPRO",
  VERSION: "1.0.0",
  DESCRIPTION:
    "Sistem Informasi Maintenance & Engineering Bureau Antam Pongkor",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ],
} as const;

// Department configuration
export const DEPARTMENTS = [
  {
    id: 1,
    name: "MTC&ENG Bureau",
    code: "MTCENG",
    description: "Maintenance & Engineering",
  },
  {
    id: 2,
    name: "MMTC",
    code: "MMTC",
    description: "Mine Maintenance",
  },
  {
    id: 3,
    name: "PMTC",
    code: "PMTC",
    description: "Plant Maintenance",
  },
  {
    id: 4,
    name: "ECDC",
    code: "ECDC",
    description: "Electric Control & Distribution",
  },
  {
    id: 5,
    name: "HETU",
    code: "HETU",
    description: "Heavy Equipment & Tailing Utilization",
  },
] as const;

// Equipment categories and lists
export const EQUIPMENT_CATEGORIES = {
  PROCESSING: "Processing Equipment",
  MINING: "Mining Equipment",
  TRANSPORTATION: "Transportation Equipment",
  SUPPORT: "Support Equipment",
} as const;

export const EQUIPMENT_LIST = [
  // Processing Equipment
  {
    name: "Ball Mill 1",
    code: "Ball Mill 1",
    category: EQUIPMENT_CATEGORIES.PROCESSING,
    departmentCodes: ["MMTC", "PMTC"],
  },
  {
    name: "Ball Mill 2",
    code: "Ball Mill 2",
    category: EQUIPMENT_CATEGORIES.PROCESSING,
    departmentCodes: ["MMTC", "PMTC"],
  },
  {
    name: "Crushing",
    code: "Crushing",
    category: EQUIPMENT_CATEGORIES.PROCESSING,
    departmentCodes: ["MMTC", "PMTC"],
  },
  {
    name: "Backfill Plant 1",
    code: "Backfill Plant 1",
    category: EQUIPMENT_CATEGORIES.PROCESSING,
    departmentCodes: ["PMTC"],
  },
  {
    name: "Backfill Plant 2",
    code: "Backfill Plant 2",
    category: EQUIPMENT_CATEGORIES.PROCESSING,
    departmentCodes: ["PMTC"],
  },
  {
    name: "Back Fill Dam",
    code: "Back Fill Dam",
    category: EQUIPMENT_CATEGORIES.PROCESSING,
    departmentCodes: ["PMTC"],
  },

  // Mining Equipment - Jumbo Drill
  ...Array.from({ length: 7 }, (_, i) => ({
    name: `Jumbo Drill ${String(i + 1).padStart(2, "0")}`,
    code: `08DR${String(i + 1).padStart(3, "0")}`,
    category: EQUIPMENT_CATEGORIES.MINING,
    departmentCodes: ["MMTC", "ECDC"],
  })),

  // Load Haul Dump (LHD)
  ...[1, 3, 4, 6, 7, 8, 9].map((num) => ({
    name: `Load Haul Dump ${String(num).padStart(2, "0")}`,
    code: `08LH${String(num).padStart(3, "0")}`,
    category: EQUIPMENT_CATEGORIES.MINING,
    departmentCodes: ["MMTC", "ECDC", "HETU"],
  })),

  // Mine Truck
  ...Array.from({ length: 3 }, (_, i) => ({
    name: `Mine Truck ${String(i + 1).padStart(2, "0")}`,
    code: `08MT${String(i + 1).padStart(3, "0")}`,
    category: EQUIPMENT_CATEGORIES.TRANSPORTATION,
    departmentCodes: ["MMTC", "HETU"],
  })),

  // Shortcrete
  {
    name: "Shortcrete 02",
    code: "08SC002",
    category: EQUIPMENT_CATEGORIES.SUPPORT,
    departmentCodes: ["MMTC", "ECDC"],
  },

  // Mixer Truck
  ...Array.from({ length: 2 }, (_, i) => ({
    name: `Mixer Truck ${String(i + 1).padStart(2, "0")}`,
    code: `08MIX${String(i + 1).padStart(3, "0")}`,
    category: EQUIPMENT_CATEGORIES.TRANSPORTATION,
    departmentCodes: ["PMTC", "HETU"],
  })),

  // Trolley Locomotive
  ...[2, 3, 4, 5, 6, 7].map((num) => ({
    name: `Trolley Locomotive ${String(num).padStart(3, "0")}`,
    code: `08TL${String(num).padStart(3, "0")}`,
    category: EQUIPMENT_CATEGORIES.TRANSPORTATION,
    departmentCodes: ["PMTC", "HETU"],
  })),
] as const;

// Shift types
export const SHIFT_TYPES = [
  { value: "SHIFT_1", label: "Shift 1" },
  { value: "SHIFT_2", label: "Shift 2" },
  { value: "SHIFT_3", label: "Shift 3" },
  { value: "LONG_SHIFT_1", label: "Long Shift 1" },
  { value: "LONG_SHIFT_2", label: "Long Shift 2" },
] as const;

// Status options
export const EQUIPMENT_STATUS_OPTIONS = [
  { value: "WORKING", label: "Working", color: "green" },
  { value: "STANDBY", label: "Standby", color: "yellow" },
  { value: "BREAKDOWN", label: "Breakdown", color: "red" },
] as const;

export const NOTIFICATION_URGENCY_OPTIONS = [
  { value: "NORMAL", label: "Normal", color: "blue" },
  { value: "URGENT", label: "Urgent", color: "orange" },
  { value: "EMERGENCY", label: "Emergency", color: "red" },
] as const;

export const NOTIFICATION_STATUS_OPTIONS = [
  { value: "PROCESS", label: "In Process", color: "yellow" },
  { value: "COMPLETE", label: "Complete", color: "green" },
] as const;

// Maintenance types
export const MAINTENANCE_TYPE_OPTIONS = [
  { value: "PREM", label: "Preventive Maintenance" },
  { value: "CORM", label: "Corrective Maintenance" },
] as const;

// User role options
export const USER_ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrator" },
  { value: "PLANNER", label: "Planner" },
  { value: "INPUTTER", label: "Inputter" },
  { value: "VIEWER", label: "Viewer" },
] as const;

// Department features configuration
export const DEPARTMENT_FEATURES = {
  "MTC&ENG Bureau": [
    "KPI_UTAMA",
    "CRITICAL_ISSUE",
    "SAFETY_INCIDENT",
    "ENERGY_IKES",
    "ENERGY_CONSUMPTION",
  ],
  MMTC: ["EQUIPMENT_STATUS", "DAILY_ACTIVITY", "KTA_TTA", "CRITICAL_ISSUE"],
  PMTC: ["EQUIPMENT_STATUS", "DAILY_ACTIVITY", "KTA_TTA", "CRITICAL_ISSUE"],
  ECDC: ["EQUIPMENT_STATUS", "DAILY_ACTIVITY", "KTA_TTA", "CRITICAL_ISSUE"],
  HETU: ["EQUIPMENT_STATUS", "DAILY_ACTIVITY", "KTA_TTA", "CRITICAL_ISSUE"],
} as const;

// Feature labels
export const FEATURE_LABELS = {
  EQUIPMENT_STATUS: "Status Alat",
  DAILY_ACTIVITY: "Aktivitas Harian",
  KTA_TTA: "KTA & TTA",
  KPI_UTAMA: "KPI Utama",
  CRITICAL_ISSUE: "Critical Issue",
  MAINTENANCE_ROUTINE: "Maintenance Rutin",
  SAFETY_INCIDENT: "Pelaporan Insiden Keselamatan",
  ENERGY_IKES: "Input IKES & Emisi",
  ENERGY_CONSUMPTION: "Input Konsumsi Energi Listrik",
} as const;

// Dashboard configuration
export const DASHBOARD_CHARTS = {
  SAFETY_INCIDENTS: "safety_incidents",
  ENERGY_TARGET_VS_REALIZATION: "energy_target_vs_realization",
  ENERGY_CONSUMPTION: "energy_consumption",
  EQUIPMENT_STATUS: "equipment_status",
  OPERATIONAL_SUMMARY: "operational_summary",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: "/api/auth/signin",
    SIGNOUT: "/api/auth/signout",
    SESSION: "/api/auth/session",
  },
  USERS: {
    LIST: "/api/users",
    CREATE: "/api/users",
    UPDATE: "/api/users",
    DELETE: "/api/users",
    RESET_PASSWORD: "/api/users/reset-password",
  },
  DEPARTMENTS: {
    LIST: "/api/departments",
    EQUIPMENT: "/api/departments/equipment",
  },
  EQUIPMENT: {
    LIST: "/api/equipment",
    STATUS: "/api/equipment/status",
    BULK_UPDATE: "/api/equipment/bulk-update",
  },
  OPERATIONAL: {
    REPORTS: "/api/operational/reports",
    ACTIVITIES: "/api/operational/activities",
  },
  KTA_KPI: {
    LIST: "/api/kta-kpi",
    CREATE: "/api/kta-kpi",
    BULK_IMPORT: "/api/kta-kpi/bulk-import",
  },
  NOTIFICATIONS: {
    LIST: "/api/notifications",
    CREATE: "/api/notifications",
    UPDATE: "/api/notifications",
  },
  ORDERS: {
    LIST: "/api/orders",
    CREATE: "/api/orders",
    UPDATE: "/api/orders",
  },
  MAINTENANCE: {
    ROUTINE: "/api/maintenance/routine",
    ACTIVITIES: "/api/maintenance/activities",
  },
  SAFETY: {
    INCIDENTS: "/api/safety/incidents",
  },
  ENERGY: {
    TARGETS: "/api/energy/targets",
    REALIZATIONS: "/api/energy/realizations",
    CONSUMPTION: "/api/energy/consumption",
  },
  DASHBOARD: {
    SUMMARY: "/api/dashboard/summary",
    CHARTS: "/api/dashboard/charts",
  },
} as const;

// File upload configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ],
  UPLOAD_PATH: "/uploads",
} as const;

// Pagination configuration
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Date/Time configuration
export const DATE_TIME = {
  DATE_FORMAT: "yyyy-MM-dd",
  TIME_FORMAT: "HH:mm",
  DATETIME_FORMAT: "yyyy-MM-dd HH:mm:ss",
  DISPLAY_DATE_FORMAT: "dd/MM/yyyy",
  DISPLAY_DATETIME_FORMAT: "dd/MM/yyyy HH:mm",
} as const;

// Validation rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  DESCRIPTION_MIN_LENGTH: 10,
  PROBLEM_DETAIL_MIN_LENGTH: 10,
} as const;

// Color themes for charts and status indicators
export const COLORS = {
  PRIMARY: "#2563eb",
  SUCCESS: "#059669",
  WARNING: "#d97706",
  DANGER: "#dc2626",
  INFO: "#0891b2",
  GRAY: "#6b7280",
  CHART_COLORS: [
    "#2563eb",
    "#059669",
    "#d97706",
    "#dc2626",
    "#0891b2",
    "#7c3aed",
    "#db2777",
    "#065f46",
  ],
} as const;
