import { EquipmentStatus, UserRole } from "@prisma/client"

export interface Equipment {
  id: number
  name: string
  code: string
  categoryId: number
  category: {
    id: number
    name: string
    code: string
  }
}

export interface Department {
  id: number
  name: string
  code: string
  description?: string
}

export interface User {
  id: number
  username: string
  role: UserRole
  departmentId?: number
  department?: Department
}

export interface ActivityDetail {
  id: number
  operationalReportId: number
  equipmentId: number
  startDateTime?: Date
  endDateTime?: Date
  duration?: number // Duration in hours (endDateTime - startDateTime)
  maintenanceType?: string
  description?: string
  object?: string
  cause?: string
  effect?: string
  status: EquipmentStatus
  createdById: number
  createdBy: User
  createdAt: Date
  updatedAt: Date
}

export interface OperationalReport {
  id: number
  reportDate: Date
  equipmentId: number
  departmentId: number
  createdById: number
  lastUpdatedById?: number
  totalWorking: number
  totalStandby: number
  totalBreakdown: number
  shiftType: string
  isComplete: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
  equipment: Equipment
  department: Department
  createdBy: User
  lastUpdatedBy?: User
  activityDetails: ActivityDetail[]
}

export interface CreateActivityDetailInput {
  startDateTime?: Date
  endDateTime?: Date
  duration?: number // Duration in hours (endDateTime - startDateTime)
  maintenanceType?: string
  description?: string
  object?: string
  cause?: string
  effect?: string
  status: EquipmentStatus
}

export interface UpdateOperationalReportInput {
  totalWorking?: number
  totalStandby?: number
  totalBreakdown?: number
  isComplete?: boolean
  notes?: string
  activityDetails?: CreateActivityDetailInput[]
}

export interface DailyActivityFormData {
  reportDate: string
  equipmentId: number
  totalWorking: number
  totalStandby: number
  totalBreakdown: number
  shiftType: string
  notes?: string
  workingActivities: CreateActivityDetailInput[]
  standbyActivities: CreateActivityDetailInput[]
  breakdownActivities: CreateActivityDetailInput[]
}

export type ActivityStatus = 'WORKING' | 'STANDBY' | 'BREAKDOWN'

export interface ActivityDetailFormData {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  maintenanceType: string
  description: string
  object: string
  cause: string
  effect: string
}

export const SHIFT_TYPES = [
  { value: 'shift-1', label: 'Shift 1', targetHours: 12 },
  { value: 'shift-2', label: 'Shift 2', targetHours: 12 },
  { value: 'shift-3', label: 'Shift 3', targetHours: 12 },
  { value: 'long-shift-1', label: 'Long Shift 1', targetHours: 12 },
  { value: 'long-shift-2', label: 'Long Shift 2', targetHours: 12 }
] as const

export type ShiftType = typeof SHIFT_TYPES[number]['value']
