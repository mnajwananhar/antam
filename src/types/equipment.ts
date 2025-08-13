import { Equipment, EquipmentCategory, EquipmentStatus, Department } from "@prisma/client";

export interface EquipmentWithStatus extends Equipment {
  currentStatus: EquipmentStatus;
  lastStatusChange: Date;
  category: EquipmentCategory;
  equipmentDepartments?: {
    department: {
      id: number;
      name: string;
      code: string;
    };
  }[];
}

export interface EquipmentWithCategory extends Equipment {
  category: EquipmentCategory;
  equipmentDepartments?: {
    department: Department;
  }[];
}