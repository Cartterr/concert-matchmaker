-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'AMBIGUOUS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "ArtistCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "spotifyId" TEXT,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "spotifyUrl" TEXT,
    "likedTrackCount" INTEGER NOT NULL DEFAULT 0,
    "sampleTracks" JSONB,
    "aliases" JSONB,
    "externalIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMiles" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "startAt" TIMESTAMP(3),
    "startLocal" TEXT,
    "timezone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "providerUrl" TEXT,
    "ticketUrl" TEXT,
    "rawPayloadRef" TEXT,
    "venueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "billing" TEXT,
    "providerId" TEXT,
    "externalIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderRun" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tripId" TEXT,
    "catalogId" TEXT,
    "startedById" TEXT,
    "paramsJson" JSONB,
    "errorClass" TEXT,
    "skippedReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "eventsFetched" INTEGER NOT NULL DEFAULT 0,
    "matchesCreated" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "ProviderRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "providerRunId" TEXT,
    "confidence" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reasons" JSONB NOT NULL,
    "sourceProvider" TEXT NOT NULL,
    "distanceMiles" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualImport" (
    "id" TEXT NOT NULL,
    "filename" TEXT,
    "sourceNote" TEXT,
    "eventId" TEXT,
    "createdById" TEXT,
    "payloadJson" JSONB,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ArtistCatalog_createdById_idx" ON "ArtistCatalog"("createdById");

-- CreateIndex
CREATE INDEX "Artist_spotifyId_idx" ON "Artist"("spotifyId");

-- CreateIndex
CREATE INDEX "Artist_normalizedName_idx" ON "Artist"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_catalogId_normalizedName_key" ON "Artist"("catalogId", "normalizedName");

-- CreateIndex
CREATE INDEX "TripProfile_isActive_idx" ON "TripProfile"("isActive");

-- CreateIndex
CREATE INDEX "TripProfile_createdById_idx" ON "TripProfile"("createdById");

-- CreateIndex
CREATE INDEX "TripProfile_startsOn_endsOn_idx" ON "TripProfile"("startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "Venue_normalizedName_idx" ON "Venue"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_provider_providerId_key" ON "Venue"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_dedupeKey_key" ON "Event"("dedupeKey");

-- CreateIndex
CREATE INDEX "Event_provider_providerId_idx" ON "Event"("provider", "providerId");

-- CreateIndex
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");

-- CreateIndex
CREATE INDEX "Event_normalizedTitle_idx" ON "Event"("normalizedTitle");

-- CreateIndex
CREATE INDEX "Performer_normalizedName_idx" ON "Performer"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Performer_eventId_normalizedName_key" ON "Performer"("eventId", "normalizedName");

-- CreateIndex
CREATE INDEX "ProviderRun_tripId_startedAt_idx" ON "ProviderRun"("tripId", "startedAt");

-- CreateIndex
CREATE INDEX "ProviderRun_catalogId_startedAt_idx" ON "ProviderRun"("catalogId", "startedAt");

-- CreateIndex
CREATE INDEX "ProviderRun_status_startedAt_idx" ON "ProviderRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ProviderRun_provider_startedAt_idx" ON "ProviderRun"("provider", "startedAt");

-- CreateIndex
CREATE INDEX "Match_tripId_status_confidence_idx" ON "Match"("tripId", "status", "confidence");

-- CreateIndex
CREATE INDEX "Match_providerRunId_idx" ON "Match"("providerRunId");

-- CreateIndex
CREATE INDEX "Match_confidence_idx" ON "Match"("confidence");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Match_eventId_artistId_tripId_key" ON "Match"("eventId", "artistId", "tripId");

-- CreateIndex
CREATE INDEX "ManualImport_eventId_idx" ON "ManualImport"("eventId");

-- CreateIndex
CREATE INDEX "ManualImport_createdById_idx" ON "ManualImport"("createdById");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistCatalog" ADD CONSTRAINT "ArtistCatalog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "ArtistCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripProfile" ADD CONSTRAINT "TripProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performer" ADD CONSTRAINT "Performer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderRun" ADD CONSTRAINT "ProviderRun_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderRun" ADD CONSTRAINT "ProviderRun_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "ArtistCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderRun" ADD CONSTRAINT "ProviderRun_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_providerRunId_fkey" FOREIGN KEY ("providerRunId") REFERENCES "ProviderRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImport" ADD CONSTRAINT "ManualImport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImport" ADD CONSTRAINT "ManualImport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
