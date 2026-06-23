-- CreateEnum
CREATE TYPE "ProcessType" AS ENUM ('STANDARD', 'AUSENTISMO');

-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "type" "ProcessType" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "AbsenceRecord" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "identification" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "requestDate" DATE NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "leaveReason" TEXT NOT NULL,
    "incapacityType" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "diagnosticCode" TEXT,
    "diagnosticConcept" TEXT,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsenceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbsenceRecord_processId_year_idx" ON "AbsenceRecord"("processId", "year");

-- CreateIndex
CREATE INDEX "AbsenceRecord_year_idx" ON "AbsenceRecord"("year");

-- AddForeignKey
ALTER TABLE "AbsenceRecord" ADD CONSTRAINT "AbsenceRecord_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
