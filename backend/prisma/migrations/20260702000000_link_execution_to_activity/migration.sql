-- AlterTable
ALTER TABLE "Execution" ADD COLUMN "activityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Execution_activityId_key" ON "Execution"("activityId");

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: cada Activity ya existente que no tenga ejecución obtiene una
-- (count=1) para que su avance se refleje sin tener que re-registrarla.
INSERT INTO "Execution" ("id", "subactivityId", "activityId", "year", "date", "count", "createdAt")
SELECT gen_random_uuid(), a."subactivityId", a."id", a."year", a."date", 1, now()
FROM "Activity" a
WHERE NOT EXISTS (SELECT 1 FROM "Execution" e WHERE e."activityId" = a."id");
