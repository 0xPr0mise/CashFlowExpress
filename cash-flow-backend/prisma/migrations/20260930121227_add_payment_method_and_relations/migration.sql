/*
  Warnings:

  - Added the required column `paymentMethod` to the `CashMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interestRate` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "description" TEXT,
    "loanId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CashMovement" ("amount", "category", "createdAt", "date", "description", "id", "type") SELECT "amount", "category", "createdAt", "date", "description", "id", "type" FROM "CashMovement";
DROP TABLE "CashMovement";
ALTER TABLE "new_CashMovement" RENAME TO "CashMovement";
CREATE TABLE "new_Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "clientId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "totalToPay" REAL NOT NULL,
    "installments" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "interestRate" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "dueDate" DATETIME,
    "days" INTEGER,
    "schedule" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Loan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("amount", "clientId", "code", "createdAt", "dueDate", "frequency", "id", "installments", "status", "totalToPay") SELECT "amount", "clientId", "code", "createdAt", "dueDate", "frequency", "id", "installments", "status", "totalToPay" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
CREATE UNIQUE INDEX "Loan_code_key" ON "Loan"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
