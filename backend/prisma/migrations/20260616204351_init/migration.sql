-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subactivity" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subactivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualTarget" (
    "id" TEXT NOT NULL,
    "subactivityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "target" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "subactivityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "subactivityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "attendees" INTEGER NOT NULL DEFAULT 0,
    "departments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityPhoto" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalPercentage" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricalPercentage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalPercentageSubactivity" (
    "id" TEXT NOT NULL,
    "subactivityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricalPercentageSubactivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Process_provinceId_key" ON "Process"("provinceId");

-- CreateIndex
CREATE INDEX "Subactivity_processId_idx" ON "Subactivity"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualTarget_subactivityId_year_key" ON "AnnualTarget"("subactivityId", "year");

-- CreateIndex
CREATE INDEX "Execution_subactivityId_year_idx" ON "Execution"("subactivityId", "year");

-- CreateIndex
CREATE INDEX "Execution_year_idx" ON "Execution"("year");

-- CreateIndex
CREATE INDEX "Activity_processId_year_idx" ON "Activity"("processId", "year");

-- CreateIndex
CREATE INDEX "Activity_subactivityId_idx" ON "Activity"("subactivityId");

-- CreateIndex
CREATE INDEX "Activity_year_idx" ON "Activity"("year");

-- CreateIndex
CREATE INDEX "ActivityPhoto_activityId_idx" ON "ActivityPhoto"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalPercentage_processId_year_key" ON "HistoricalPercentage"("processId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalPercentageSubactivity_subactivityId_year_key" ON "HistoricalPercentageSubactivity"("subactivityId", "year");

-- AddForeignKey
ALTER TABLE "Subactivity" ADD CONSTRAINT "Subactivity_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualTarget" ADD CONSTRAINT "AnnualTarget_subactivityId_fkey" FOREIGN KEY ("subactivityId") REFERENCES "Subactivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_subactivityId_fkey" FOREIGN KEY ("subactivityId") REFERENCES "Subactivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_subactivityId_fkey" FOREIGN KEY ("subactivityId") REFERENCES "Subactivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityPhoto" ADD CONSTRAINT "ActivityPhoto_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalPercentage" ADD CONSTRAINT "HistoricalPercentage_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalPercentageSubactivity" ADD CONSTRAINT "HistoricalPercentageSubactivity_subactivityId_fkey" FOREIGN KEY ("subactivityId") REFERENCES "Subactivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
