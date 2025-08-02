import { Equipment, EquipmentCategory, EquipmentStatus } from "@prisma/client";

export interface EquipmentWithStatus extends Equipment {
  currentStatus: EquipmentStatus;
  lastStatusChange: Date;
  category: EquipmentCategory;
}

export interface EquipmentWithCategory extends Equipment {
  category: EquipmentCategory;
}