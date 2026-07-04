import type { ProviderHealth, ProviderKey } from "@/lib/env";

export type EventSourceKey = ProviderKey | "manual";

export type ProviderTrip = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  startsOn: Date;
  endsOn: Date;
  timezone: string;
};

export type NormalizedVenue = {
  providerId?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  url?: string;
};

export type NormalizedPerformer = {
  providerId?: string;
  name: string;
  billing?: string;
  externalIds?: Record<string, string>;
};

export type NormalizedProviderEvent = {
  provider: EventSourceKey;
  providerId?: string;
  title: string;
  startAt?: Date;
  startLocal?: string;
  timezone?: string;
  status?: string;
  providerUrl?: string;
  ticketUrl?: string;
  rawPayloadRef?: string;
  venue: NormalizedVenue;
  performers: NormalizedPerformer[];
};

export type ProviderScanResult = {
  provider: ProviderKey;
  events: NormalizedProviderEvent[];
  message?: string;
};

export type EventProviderAdapter = {
  key: ProviderKey;
  displayName: string;
  priority: number;
  health(): ProviderHealth;
  scanEvents(trip: ProviderTrip): Promise<ProviderScanResult>;
};
