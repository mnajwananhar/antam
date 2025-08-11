-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PLANNER', 'INPUTTER', 'VIEWER');

-- CreateEnum
CREATE TYPE "NotificationUrgency" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PROCESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREM', 'CORM');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('WORKING', 'STANDBY', 'BREAKDOWN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'PENDING_ADMIN_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StatusTindakLanjut" AS ENUM ('OPEN', 'CLOSE');

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "departmentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "sessionToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_reports" (
    "id" SERIAL NOT NULL,
    "reportDate" DATE NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "lastUpdatedById" INTEGER,
    "totalWorking" INTEGER NOT NULL DEFAULT 0,
    "totalStandby" INTEGER NOT NULL DEFAULT 0,
    "totalBreakdown" INTEGER NOT NULL DEFAULT 0,
    "shiftType" VARCHAR(50) NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_details" (
    "id" SERIAL NOT NULL,
    "operationalReportId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "startDateTime" TIMESTAMP(3),
    "endDateTime" TIMESTAMP(3),
    "maintenanceType" VARCHAR(100),
    "description" TEXT,
    "object" VARCHAR(255),
    "cause" TEXT,
    "effect" TEXT,
    "status" "EquipmentStatus" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_status_history" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "status" "EquipmentStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "equipment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kta_kpi_data" (
    "id" SERIAL NOT NULL,
    "noRegister" VARCHAR(50) NOT NULL,
    "nppPelapor" VARCHAR(20),
    "namaPelapor" VARCHAR(100),
    "perusahaanBiro" VARCHAR(100),
    "tanggal" DATE,
    "lokasi" VARCHAR(200),
    "areaTemuan" VARCHAR(200),
    "keterangan" TEXT,
    "fotoUrl" VARCHAR(500),
    "kategori" VARCHAR(100),
    "sumberTemuan" VARCHAR(100),
    "picDepartemen" VARCHAR(100),
    "kriteriaKtaTta" VARCHAR(200),
    "perusahaanPengelola" VARCHAR(100),
    "tindakLanjutLangsung" TEXT,
    "statusTindakLanjut" "StatusTindakLanjut",
    "biro" VARCHAR(50),
    "dueDate" DATE,
    "updateStatus" VARCHAR(50),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kta_kpi_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_pic_mappings" (
    "id" SERIAL NOT NULL,
    "departmentCode" VARCHAR(10) NOT NULL,
    "picValue" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pic_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kriteria_kta_tta" (
    "id" SERIAL NOT NULL,
    "kriteria" VARCHAR(200) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kriteria_kta_tta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "uniqueNumber" VARCHAR(50) NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "reportTime" TIME NOT NULL,
    "urgency" "NotificationUrgency" NOT NULL,
    "problemDetail" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PROCESS',
    "type" "MaintenanceType" NOT NULL DEFAULT 'CORM',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "jobName" VARCHAR(255) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "description" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_activities" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "activity" VARCHAR(255) NOT NULL,
    "object" VARCHAR(255) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_routine" (
    "id" SERIAL NOT NULL,
    "uniqueNumber" VARCHAR(50) NOT NULL,
    "jobName" VARCHAR(255) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "description" TEXT,
    "type" "MaintenanceType" NOT NULL DEFAULT 'PREM',
    "departmentId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_activities" (
    "id" SERIAL NOT NULL,
    "maintenanceRoutineId" INTEGER NOT NULL,
    "activity" VARCHAR(255) NOT NULL,
    "object" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "critical_issues" (
    "id" SERIAL NOT NULL,
    "issueName" VARCHAR(255) NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "status" "EquipmentStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "critical_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_incidents" (
    "id" SERIAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "nearmiss" INTEGER NOT NULL DEFAULT 0,
    "kecAlat" INTEGER NOT NULL DEFAULT 0,
    "kecKecil" INTEGER NOT NULL DEFAULT 0,
    "kecRingan" INTEGER NOT NULL DEFAULT 0,
    "kecBerat" INTEGER NOT NULL DEFAULT 0,
    "fatality" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_targets" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "ikesTarget" DOUBLE PRECISION,
    "emissionTarget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_realizations" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "ikesRealization" DOUBLE PRECISION,
    "emissionRealization" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_realizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_consumption" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "plnConsumption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tambangConsumption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pabrikConsumption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supportingConsumption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "approverId" INTEGER,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestType" VARCHAR(100) NOT NULL,
    "tableName" VARCHAR(100) NOT NULL,
    "recordId" INTEGER,
    "oldData" JSONB,
    "newData" JSONB NOT NULL,
    "reason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_library" (
    "id" SERIAL NOT NULL,
    "jobName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_activities" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "activity" VARCHAR(255) NOT NULL,
    "objectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_objects" (
    "id" SERIAL NOT NULL,
    "materialNumber" VARCHAR(100) NOT NULL,
    "materialName" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_objects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_name_key" ON "equipment_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_code_key" ON "equipment_categories"("code");

-- CreateIndex
CREATE INDEX "equipment_categories_name_idx" ON "equipment_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_code_key" ON "equipment"("code");

-- CreateIndex
CREATE INDEX "equipment_code_idx" ON "equipment"("code");

-- CreateIndex
CREATE INDEX "equipment_categoryId_idx" ON "equipment"("categoryId");

-- CreateIndex
CREATE INDEX "operational_reports_reportDate_idx" ON "operational_reports"("reportDate");

-- CreateIndex
CREATE INDEX "operational_reports_departmentId_idx" ON "operational_reports"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "operational_reports_reportDate_equipmentId_key" ON "operational_reports"("reportDate", "equipmentId");

-- CreateIndex
CREATE INDEX "activity_details_operationalReportId_idx" ON "activity_details"("operationalReportId");

-- CreateIndex
CREATE INDEX "equipment_status_history_equipmentId_idx" ON "equipment_status_history"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_status_history_changedAt_idx" ON "equipment_status_history"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "kta_kpi_data_noRegister_key" ON "kta_kpi_data"("noRegister");

-- CreateIndex
CREATE INDEX "kta_kpi_data_tanggal_idx" ON "kta_kpi_data"("tanggal");

-- CreateIndex
CREATE INDEX "kta_kpi_data_picDepartemen_idx" ON "kta_kpi_data"("picDepartemen");

-- CreateIndex
CREATE INDEX "kta_kpi_data_statusTindakLanjut_idx" ON "kta_kpi_data"("statusTindakLanjut");

-- CreateIndex
CREATE INDEX "department_pic_mappings_departmentCode_idx" ON "department_pic_mappings"("departmentCode");

-- CreateIndex
CREATE INDEX "department_pic_mappings_isActive_idx" ON "department_pic_mappings"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "department_pic_mappings_departmentCode_picValue_key" ON "department_pic_mappings"("departmentCode", "picValue");

-- CreateIndex
CREATE UNIQUE INDEX "kriteria_kta_tta_kriteria_key" ON "kriteria_kta_tta"("kriteria");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_uniqueNumber_key" ON "notifications"("uniqueNumber");

-- CreateIndex
CREATE INDEX "notifications_departmentId_idx" ON "notifications"("departmentId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "orders_notificationId_idx" ON "orders"("notificationId");

-- CreateIndex
CREATE INDEX "order_activities_orderId_idx" ON "order_activities"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_routine_uniqueNumber_key" ON "maintenance_routine"("uniqueNumber");

-- CreateIndex
CREATE INDEX "maintenance_routine_departmentId_idx" ON "maintenance_routine"("departmentId");

-- CreateIndex
CREATE INDEX "maintenance_activities_maintenanceRoutineId_idx" ON "maintenance_activities"("maintenanceRoutineId");

-- CreateIndex
CREATE INDEX "critical_issues_departmentId_idx" ON "critical_issues"("departmentId");

-- CreateIndex
CREATE INDEX "critical_issues_status_idx" ON "critical_issues"("status");

-- CreateIndex
CREATE UNIQUE INDEX "safety_incidents_month_year_key" ON "safety_incidents"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "energy_targets_year_month_key" ON "energy_targets"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "energy_realizations_year_month_key" ON "energy_realizations"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "energy_consumption_year_month_key" ON "energy_consumption"("year", "month");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE INDEX "approval_requests_requesterId_idx" ON "approval_requests"("requesterId");

-- CreateIndex
CREATE INDEX "job_library_jobName_idx" ON "job_library"("jobName");

-- CreateIndex
CREATE INDEX "job_activities_jobId_idx" ON "job_activities"("jobId");

-- CreateIndex
CREATE INDEX "job_objects_materialNumber_idx" ON "job_objects"("materialNumber");

-- CreateIndex
CREATE INDEX "job_objects_materialName_idx" ON "job_objects"("materialName");

-- CreateIndex
CREATE UNIQUE INDEX "job_objects_materialNumber_key" ON "job_objects"("materialNumber");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "equipment_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_reports" ADD CONSTRAINT "operational_reports_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_reports" ADD CONSTRAINT "operational_reports_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_reports" ADD CONSTRAINT "operational_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_reports" ADD CONSTRAINT "operational_reports_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_details" ADD CONSTRAINT "activity_details_operationalReportId_fkey" FOREIGN KEY ("operationalReportId") REFERENCES "operational_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_details" ADD CONSTRAINT "activity_details_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_details" ADD CONSTRAINT "activity_details_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_status_history" ADD CONSTRAINT "equipment_status_history_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_status_history" ADD CONSTRAINT "equipment_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kta_kpi_data" ADD CONSTRAINT "kta_kpi_data_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_routine" ADD CONSTRAINT "maintenance_routine_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_routine" ADD CONSTRAINT "maintenance_routine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_activities" ADD CONSTRAINT "maintenance_activities_maintenanceRoutineId_fkey" FOREIGN KEY ("maintenanceRoutineId") REFERENCES "maintenance_routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "critical_issues" ADD CONSTRAINT "critical_issues_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "critical_issues" ADD CONSTRAINT "critical_issues_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_activities" ADD CONSTRAINT "job_activities_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_activities" ADD CONSTRAINT "job_activities_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "job_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
