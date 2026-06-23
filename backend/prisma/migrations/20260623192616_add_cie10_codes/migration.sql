-- CreateTable
CREATE TABLE "Cie10Code" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Cie10Code_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "Cie10Code_code_idx" ON "Cie10Code"("code");
