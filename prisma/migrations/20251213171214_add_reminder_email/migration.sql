-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "orderNumber" TEXT,
    "orderAmount" REAL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voucherCode" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'cashback',
    "amount" INTEGER NOT NULL,
    "voucherCode" TEXT,
    "redeemed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reward_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RewardSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "defaultAmount" INTEGER NOT NULL DEFAULT 5000,
    "defaultPercentage" REAL NOT NULL DEFAULT 0,
    "valueType" TEXT NOT NULL DEFAULT 'fixed',
    "rewardType" TEXT NOT NULL DEFAULT 'cashback',
    "voucherType" TEXT NOT NULL DEFAULT 'percentage_first_order',
    "discountPercentage" REAL NOT NULL DEFAULT 30.0,
    "currency" TEXT NOT NULL DEFAULT 'DKK',
    "widgetTitle" TEXT NOT NULL DEFAULT '🎁 Del & Få Rabat',
    "widgetSubtitle" TEXT NOT NULL DEFAULT 'Del din ordre på sociale medier og få din reward',
    "widgetButtonLabel" TEXT NOT NULL DEFAULT 'Læs mere',
    "widgetModalTitle" TEXT NOT NULL DEFAULT '🎁 Del & Få Rabat',
    "widgetModalBody" TEXT NOT NULL DEFAULT 'Upload et screenshot af din story, så sender vi din reward',
    "backgroundColor" TEXT NOT NULL DEFAULT '#a855f7',
    "accentColor" TEXT NOT NULL DEFAULT '#ec4899',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "buttonColor" TEXT NOT NULL DEFAULT '#a855f7',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "borderRadius" INTEGER NOT NULL DEFAULT 8,
    "designStyle" TEXT NOT NULL DEFAULT 'gradient',
    "emailSubject" TEXT NOT NULL DEFAULT '🎁 Din rabat er klar!',
    "emailFromName" TEXT NOT NULL DEFAULT 'ShareJoy',
    "emailBodyHTML" TEXT NOT NULL DEFAULT '<p>Tak for dit bidrag! Din rabat er klar.</p>',
    "emailButtonText" TEXT NOT NULL DEFAULT 'Shop nu',
    "emailBrandColor" TEXT NOT NULL DEFAULT '#a855f7',
    "cashbackEmailSubject" TEXT NOT NULL DEFAULT '💰 Din cashback er på vej!',
    "cashbackEmailFromName" TEXT NOT NULL DEFAULT 'ShareJoy',
    "cashbackEmailBodyHTML" TEXT NOT NULL DEFAULT '<p>Tak for at dele! Vi behandler din cashback.</p>',
    "cashbackEmailBrandColor" TEXT NOT NULL DEFAULT '#10b981',
    "cashbackProcessingTime" TEXT NOT NULL DEFAULT '3-5 hverdage',
    "widgetStep1Text" TEXT NOT NULL DEFAULT '1. Del din ordre på sociale medier',
    "widgetStep2Text" TEXT NOT NULL DEFAULT '2. Upload et screenshot af din story',
    "widgetStep3Text" TEXT NOT NULL DEFAULT '3. Modtag din reward!',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReminderEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "sendAt" DATETIME NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Reward_submissionId_key" ON "Reward"("submissionId");
