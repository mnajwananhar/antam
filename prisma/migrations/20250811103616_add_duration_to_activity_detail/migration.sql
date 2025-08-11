/*
  Warnings:

  - The values [PENDING_ADMIN_APPROVAL] on the enum `ApprovalStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reason` on the `approval_requests` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "approval_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "approval_requests" ALTER COLUMN "status" TYPE "ApprovalStatus_new" USING ("status"::text::"ApprovalStatus_new");
ALTER TYPE "ApprovalStatus" RENAME TO "ApprovalStatus_old";
ALTER TYPE "ApprovalStatus_new" RENAME TO "ApprovalStatus";
DROP TYPE "ApprovalStatus_old";
ALTER TABLE "approval_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "activity_details" ADD COLUMN     "duration" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "approval_requests" DROP COLUMN "reason";
