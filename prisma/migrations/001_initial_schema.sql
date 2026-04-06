-- SubPay Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- Enums
CREATE TYPE "Role" AS ENUM ('CONTRACTOR', 'SUBCONTRACTOR', 'ADMIN');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'PARTIALLY_PAID');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "DocumentType" AS ENUM ('W9', 'INSURANCE_CERTIFICATE', 'LICENSE', 'CONTRACT', 'OTHER');
CREATE TYPE "ChangeOrderStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'REJECTED', 'CANCELLED');
CREATE TYPE "LienWaiverType" AS ENUM ('CONDITIONAL_PARTIAL', 'UNCONDITIONAL_PARTIAL', 'CONDITIONAL_FINAL', 'UNCONDITIONAL_FINAL');
CREATE TYPE "LienWaiverStatus" AS ENUM ('PENDING', 'SENT', 'SIGNED', 'REJECTED');

-- Users
CREATE TABLE "User" (
  "id"            TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"          TEXT,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMP(3),
  "image"         TEXT,
  "password"      TEXT,
  "role"          "Role" NOT NULL DEFAULT 'SUBCONTRACTOR',
  "phone"         TEXT,
  "company"       TEXT,
  "address"       TEXT,
  "taxId"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- NextAuth Accounts
CREATE TABLE "Account" (
  "id"                TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  UNIQUE("provider", "providerAccountId")
);

-- NextAuth Sessions
CREATE TABLE "Session" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires"      TIMESTAMP(3) NOT NULL
);

-- NextAuth Verification Tokens
CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expires"    TIMESTAMP(3) NOT NULL,
  UNIQUE("identifier", "token")
);

-- Projects
CREATE TABLE "Project" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "address"      TEXT,
  "startDate"    TIMESTAMP(3),
  "endDate"      TIMESTAMP(3),
  "budget"       DOUBLE PRECISION,
  "contractorId" TEXT NOT NULL REFERENCES "User"("id"),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project Members (subcontractor ↔ project ↔ contractor)
CREATE TABLE "ProjectMember" (
  "id"              TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId"       TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "subcontractorId" TEXT NOT NULL REFERENCES "User"("id"),
  "contractorId"    TEXT NOT NULL REFERENCES "User"("id"),
  "trade"           TEXT,
  "contractAmount"  DOUBLE PRECISION,
  "joinedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("projectId", "subcontractorId")
);

-- Invoices
CREATE TABLE "Invoice" (
  "id"              TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "invoiceNumber"   TEXT NOT NULL UNIQUE,
  "projectId"       TEXT NOT NULL REFERENCES "Project"("id"),
  "subcontractorId" TEXT NOT NULL REFERENCES "User"("id"),
  "reviewedById"    TEXT REFERENCES "User"("id"),
  "status"          "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "amount"          DOUBLE PRECISION NOT NULL,
  "tax"             DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount"     DOUBLE PRECISION NOT NULL,
  "description"     TEXT,
  "workPeriodStart" TIMESTAMP(3),
  "workPeriodEnd"   TIMESTAMP(3),
  "dueDate"         TIMESTAMP(3),
  "notes"           TEXT,
  "rejectionReason" TEXT,
  "submittedAt"     TIMESTAMP(3),
  "approvedAt"      TIMESTAMP(3),
  "paidAt"          TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items
CREATE TABLE "InvoiceLineItem" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "invoiceId"   TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "quantity"    DOUBLE PRECISION NOT NULL,
  "unit"        TEXT,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "total"       DOUBLE PRECISION NOT NULL
);

-- Payments
CREATE TABLE "Payment" (
  "id"                    TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "invoiceId"             TEXT NOT NULL REFERENCES "Invoice"("id"),
  "subcontractorId"       TEXT NOT NULL REFERENCES "User"("id"),
  "contractorId"          TEXT NOT NULL REFERENCES "User"("id"),
  "amount"                DOUBLE PRECISION NOT NULL,
  "status"                "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "method"                TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeTransferId"      TEXT,
  "notes"                 TEXT,
  "processedAt"           TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE "Document" (
  "id"            TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL REFERENCES "User"("id"),
  "invoiceId"     TEXT REFERENCES "Invoice"("id"),
  "changeOrderId" TEXT,
  "type"          "DocumentType" NOT NULL,
  "name"          TEXT NOT NULL,
  "fileUrl"       TEXT NOT NULL,
  "fileSize"      INTEGER,
  "mimeType"      TEXT,
  "expiresAt"     TIMESTAMP(3),
  "alertSentAt"   TIMESTAMP(3),
  "isVerified"    BOOLEAN NOT NULL DEFAULT false,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Change Orders
CREATE TABLE "ChangeOrder" (
  "id"                  TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderNumber"         TEXT NOT NULL UNIQUE,
  "projectId"           TEXT NOT NULL REFERENCES "Project"("id"),
  "subcontractorId"     TEXT NOT NULL REFERENCES "User"("id"),
  "status"              "ChangeOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "title"               TEXT NOT NULL,
  "description"         TEXT,
  "amount"              DOUBLE PRECISION NOT NULL,
  "reason"              TEXT,
  "signatureData"       TEXT,
  "signedAt"            TIMESTAMP(3),
  "contractorSignature" TEXT,
  "contractorSignedAt"  TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add FK from Document to ChangeOrder (after both tables exist)
ALTER TABLE "Document" ADD CONSTRAINT "Document_changeOrderId_fkey"
  FOREIGN KEY ("changeOrderId") REFERENCES "ChangeOrder"("id");

-- Lien Waivers
CREATE TABLE "LienWaiver" (
  "id"              TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId"       TEXT NOT NULL REFERENCES "Project"("id"),
  "subcontractorId" TEXT NOT NULL REFERENCES "User"("id"),
  "type"            "LienWaiverType" NOT NULL,
  "status"          "LienWaiverStatus" NOT NULL DEFAULT 'PENDING',
  "throughDate"     TIMESTAMP(3),
  "amount"          DOUBLE PRECISION,
  "signatureData"   TEXT,
  "signedAt"        TIMESTAMP(3),
  "sentAt"          TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- QuickBooks Connections
CREATE TABLE "QuickBooksConnection" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"       TEXT NOT NULL UNIQUE REFERENCES "User"("id"),
  "realmId"      TEXT NOT NULL,
  "accessToken"  TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX "Invoice_projectId_idx" ON "Invoice"("projectId");
CREATE INDEX "Invoice_subcontractorId_idx" ON "Invoice"("subcontractorId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");
CREATE INDEX "LienWaiver_projectId_idx" ON "LienWaiver"("projectId");
CREATE INDEX "ChangeOrder_projectId_idx" ON "ChangeOrder"("projectId");
