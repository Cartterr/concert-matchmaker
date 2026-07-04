import {
  getProviderHealth,
  providerDefinitions,
  type ProviderHealth,
  type ProviderKey,
} from "@/lib/env";
import { fetchJson, firstUrl, isoWithoutMs, numberFrom, textFrom } from "./http";
import type {
  EventProviderAdapter,
  NormalizedPerformer,
  NormalizedProviderEvent,
  NormalizedVenue,
  ProviderScanResult,
  ProviderTrip,
} from "./types";

type UnknownRecord = Record<string, unknown>;

export function getProviderAdapters(): EventProviderAdapter[] {
  return [
    createAdapter("jambase", scanJamBase),
    createAdapter("ticketmaster", scanTicketmaster),
    createAdapter("seatgeek", scanSeatGeek),
    createAdapter("predicthq", scanPredictHq),
    createAdapter("eventbrite", scanEventbrite),
    createDisabledAdapter("songkick"),
    createDisabledAdapter("bandsintown"),
  ].sort((a, b) => a.priority - b.priority);
}

function createAdapter(
  key: ProviderKey,
  scan: (trip: ProviderTrip) => Promise<ProviderScanResult>,
): EventProviderAdapter {
  const definition = providerDefinitions[key];
  return {
    key,
    displayName: definition.name,
    priority: definition.priority,
    health: () => getProviderHealth().find((provider) => provider.key === key)!,
    async scanEvents(trip) {
      const health = this.health();
      if (health.status !== "ready") {
        return {
          provider: key,
          events: [],
          message: health.message,
        };
      }
      return scan(trip);
    },
  };
}

function createDisabledAdapter(key: ProviderKey): EventProviderAdapter {
  const definition = providerDefinitions[key];
  return {
    key,
    displayName: definition.name,
    priority: definition.priority,
    health: () => getProviderHealth().find((provider) => provider.key === key)!,
    async scanEvents() {
      return {
        provider: key,
        events: [],
        message: definition.message,
      };
    },
  };
}

async function scanTicketmaster(
  trip: ProviderTrip,
): Promise<ProviderScanResult> {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", process.env.TICKETMASTER_API_KEY!);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("latlong", `${trip.latitude},${trip.longitude}`);
  url.searchParams.set("radius", String(Math.round(trip.radiusMiles)));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("startDateTime", isoWithoutMs(trip.startsOn));
  url.searchParams.set("endDateTime", isoWithoutMs(trip.endsOn));
  url.searchParams.set("size", "200");
  url.searchParams.set("sort", "date,asc");

  const payload = await fetchJson<UnknownRecord>(url);
  const events = arrayAt(payload, ["_embedded", "events"]);

  return {
    provider: "ticketmaster",
    events: events.map(mapTicketmasterEvent).filter(isEvent),
  };
}

async function scanJamBase(trip: ProviderTrip): Promise<ProviderScanResult> {
  const url = new URL(
    process.env.JAMBASE_API_BASE_URL ?? "https://data.jambase.com/v3/events",
  );
  url.searchParams.set("apikey", process.env.JAMBASE_API_KEY!);
  url.searchParams.set("lat", String(trip.latitude));
  url.searchParams.set("lon", String(trip.longitude));
  url.searchParams.set("radius", String(trip.radiusMiles));
  url.searchParams.set("startDate", trip.startsOn.toISOString().slice(0, 10));
  url.searchParams.set("endDate", trip.endsOn.toISOString().slice(0, 10));
  url.searchParams.set("category", "music");

  const payload = await fetchJson<UnknownRecord>(url, {
    headers: {
      Authorization: `Bearer ${process.env.JAMBASE_API_KEY}`,
    },
  });
  const events = firstArrayAt(payload, [["events"], ["results"], ["data"]]);

  return {
    provider: "jambase",
    events: events.map(mapJamBaseEvent).filter(isEvent),
  };
}

async function scanSeatGeek(trip: ProviderTrip): Promise<ProviderScanResult> {
  const url = new URL("https://api.seatgeek.com/2/events");
  url.searchParams.set("client_id", process.env.SEATGEEK_CLIENT_ID!);
  if (process.env.SEATGEEK_CLIENT_SECRET) {
    url.searchParams.set("client_secret", process.env.SEATGEEK_CLIENT_SECRET);
  }
  url.searchParams.set("lat", String(trip.latitude));
  url.searchParams.set("lon", String(trip.longitude));
  url.searchParams.set("range", `${Math.round(trip.radiusMiles)}mi`);
  url.searchParams.set("datetime_local.gte", trip.startsOn.toISOString());
  url.searchParams.set("datetime_local.lte", trip.endsOn.toISOString());
  url.searchParams.set("taxonomies.name", "concert");
  url.searchParams.set("per_page", "100");

  const payload = await fetchJson<UnknownRecord>(url);
  const events = arrayAt(payload, ["events"]);

  return {
    provider: "seatgeek",
    events: events.map(mapSeatGeekEvent).filter(isEvent),
  };
}

async function scanPredictHq(trip: ProviderTrip): Promise<ProviderScanResult> {
  const url = new URL("https://api.predicthq.com/v1/events/");
  url.searchParams.set("category", "concerts,festivals,performing-arts");
  url.searchParams.set("within", `${trip.radiusMiles}mi@${trip.latitude},${trip.longitude}`);
  url.searchParams.set("start.gte", isoWithoutMs(trip.startsOn));
  url.searchParams.set("start.lte", isoWithoutMs(trip.endsOn));
  url.searchParams.set("limit", "100");
  url.searchParams.set("sort", "start");

  const payload = await fetchJson<UnknownRecord>(url, {
    headers: {
      Authorization: `Bearer ${process.env.PREDICTHQ_ACCESS_TOKEN}`,
    },
  });
  const events = arrayAt(payload, ["results"]);

  return {
    provider: "predicthq",
    events: events.map(mapPredictHqEvent).filter(isEvent),
  };
}

async function scanEventbrite(trip: ProviderTrip): Promise<ProviderScanResult> {
  const url = new URL("https://www.eventbriteapi.com/v3/events/search/");
  url.searchParams.set("location.latitude", String(trip.latitude));
  url.searchParams.set("location.longitude", String(trip.longitude));
  url.searchParams.set("location.within", `${Math.round(trip.radiusMiles)}mi`);
  url.searchParams.set("start_date.range_start", trip.startsOn.toISOString());
  url.searchParams.set("start_date.range_end", trip.endsOn.toISOString());
  url.searchParams.set("categories", "103");
  url.searchParams.set("expand", "venue");

  const payload = await fetchJson<UnknownRecord>(url, {
    headers: {
      Authorization: `Bearer ${process.env.EVENTBRITE_TOKEN}`,
    },
  });
  const events = arrayAt(payload, ["events"]);

  return {
    provider: "eventbrite",
    events: events.map(mapEventbriteEvent).filter(isEvent),
  };
}

export function getAdapterHealth(): ProviderHealth[] {
  return getProviderAdapters().map((adapter) => adapter.health());
}

function mapTicketmasterEvent(event: UnknownRecord): NormalizedProviderEvent | null {
  const venues = arrayAt(event, ["_embedded", "venues"]);
  const venue = asRecord(venues[0]);
  const attractions = arrayAt(event, ["_embedded", "attractions"]);
  const title = textFrom(event.name);
  if (!title || !venue) return null;

  return {
    provider: "ticketmaster",
    providerId: textFrom(event.id),
    title,
    startAt: parseDate(path(event, ["dates", "start", "dateTime"])),
    startLocal: textFrom(path(event, ["dates", "start", "localDate"])),
    timezone: textFrom(path(event, ["dates", "timezone"])),
    status: textFrom(path(event, ["dates", "status", "code"])) ?? "scheduled",
    providerUrl: textFrom(event.url),
    ticketUrl: textFrom(event.url),
    venue: {
      providerId: textFrom(venue.id) ?? textFrom(venue.name),
      name: textFrom(venue.name) ?? "Unknown venue",
      latitude: numberFrom(path(venue, ["location", "latitude"])),
      longitude: numberFrom(path(venue, ["location", "longitude"])),
      address: textFrom(path(venue, ["address", "line1"])),
      city: textFrom(path(venue, ["city", "name"])),
      region: textFrom(path(venue, ["state", "stateCode"])),
      country: textFrom(path(venue, ["country", "countryCode"])),
      url: textFrom(venue.url),
    },
    performers: attractions
      .map((attraction) => asRecord(attraction))
      .filter(Boolean)
      .map((attraction) => ({
        providerId: textFrom(attraction!.id),
        name: textFrom(attraction!.name) ?? title,
        externalIds: { ticketmasterId: textFrom(attraction!.id) ?? "" },
      }))
      .filter((performer) => performer.name),
  };
}

function mapJamBaseEvent(event: UnknownRecord): NormalizedProviderEvent | null {
  const venue = asRecord(event.venue) ?? asRecord(path(event, ["location"]));
  const title = textFrom(event.name) ?? textFrom(event.title);
  if (!title || !venue) return null;

  const performers = [
    ...arrayAt(event, ["performers"]),
    ...arrayAt(event, ["performances"]).map((performance) =>
      asRecord(performance.artist) ?? performance,
    ),
  ];

  return {
    provider: "jambase",
    providerId: textFrom(event.id) ?? textFrom(event.identifier),
    title,
    startAt: parseDate(event.startDate ?? event.date),
    startLocal: textFrom(event.startDateLocal) ?? textFrom(event.date),
    timezone: textFrom(event.timezone),
    status: textFrom(event.status) ?? "scheduled",
    providerUrl: textFrom(event.url) ?? firstUrl(event.sameAs),
    ticketUrl: textFrom(event.ticketUrl) ?? firstUrl(event.offers),
    venue: mapGenericVenue(venue),
    performers: performers.map(mapGenericPerformer).filter(isPerformer),
  };
}

function mapSeatGeekEvent(event: UnknownRecord): NormalizedProviderEvent | null {
  const venue = asRecord(event.venue);
  const title = textFrom(event.title) ?? textFrom(event.short_title);
  if (!title || !venue) return null;

  return {
    provider: "seatgeek",
    providerId: textFrom(event.id),
    title,
    startAt: parseDate(event.datetime_utc),
    startLocal: textFrom(event.datetime_local),
    timezone: textFrom(event.timezone),
    status: textFrom(event.status) ?? "scheduled",
    providerUrl: textFrom(event.url),
    ticketUrl: textFrom(event.url),
    venue: {
      providerId: textFrom(venue.id) ?? textFrom(venue.name),
      name: textFrom(venue.name) ?? "Unknown venue",
      latitude: numberFrom(path(venue, ["location", "lat"])) ?? numberFrom(venue.lat),
      longitude:
        numberFrom(path(venue, ["location", "lon"])) ?? numberFrom(venue.lon),
      address: textFrom(venue.address),
      city: textFrom(venue.city),
      region: textFrom(venue.state),
      country: textFrom(venue.country),
      url: textFrom(venue.url),
    },
    performers: arrayAt(event, ["performers"])
      .map((performer) => asRecord(performer))
      .filter(Boolean)
      .map((performer) => ({
        providerId: textFrom(performer!.id),
        name: textFrom(performer!.name) ?? title,
        externalIds: { seatgeekId: textFrom(performer!.id) ?? "" },
      }))
      .filter((performer) => performer.name),
  };
}

function mapPredictHqEvent(event: UnknownRecord): NormalizedProviderEvent | null {
  const title = textFrom(event.title);
  if (!title) return null;
  const location = Array.isArray(event.location) ? event.location : [];
  const entities = arrayAt(event, ["entities"]);

  return {
    provider: "predicthq",
    providerId: textFrom(event.id),
    title,
    startAt: parseDate(event.start),
    startLocal: textFrom(event.start_local) ?? textFrom(event.start),
    timezone: textFrom(event.timezone),
    status: textFrom(event.state) ?? "scheduled",
    providerUrl: textFrom(event.phq_attendance_url),
    ticketUrl: textFrom(event.ticketing_url),
    venue: {
      providerId: textFrom(event.place_id) ?? textFrom(event.venue_id) ?? title,
      name:
        textFrom(path(event, ["geo", "address", "formatted_address"])) ??
        textFrom(event.place_id) ??
        "Unknown venue",
      latitude: numberFrom(location[1]),
      longitude: numberFrom(location[0]),
      address: textFrom(path(event, ["geo", "address", "formatted_address"])),
      city: textFrom(path(event, ["geo", "address", "locality"])),
      region: textFrom(path(event, ["geo", "address", "region"])),
      country: textFrom(path(event, ["geo", "address", "country_code"])),
    },
    performers: entities.map(mapGenericPerformer).filter(isPerformer),
  };
}

function mapEventbriteEvent(event: UnknownRecord): NormalizedProviderEvent | null {
  const venue = asRecord(event.venue);
  const title = textFrom(path(event, ["name", "text"])) ?? textFrom(event.name);
  if (!title) return null;

  return {
    provider: "eventbrite",
    providerId: textFrom(event.id),
    title,
    startAt: parseDate(path(event, ["start", "utc"])),
    startLocal: textFrom(path(event, ["start", "local"])),
    timezone: textFrom(path(event, ["start", "timezone"])),
    status: textFrom(event.status) ?? "scheduled",
    providerUrl: textFrom(event.url),
    ticketUrl: textFrom(event.url),
    venue: venue ? mapGenericVenue(venue) : { providerId: title, name: "Unknown venue" },
    performers: [{ name: title, billing: "event_title" }],
  };
}

function mapGenericVenue(venue: UnknownRecord): NormalizedVenue {
  return {
    providerId:
      textFrom(venue.id) ??
      textFrom(venue.identifier) ??
      textFrom(venue.name) ??
      "unknown",
    name:
      textFrom(venue.name) ??
      textFrom(venue.title) ??
      textFrom(path(venue, ["address", "localized_address_display"])) ??
      "Unknown venue",
    latitude:
      numberFrom(venue.latitude) ??
      numberFrom(venue.lat) ??
      numberFrom(path(venue, ["geo", "latitude"])),
    longitude:
      numberFrom(venue.longitude) ??
      numberFrom(venue.lon) ??
      numberFrom(path(venue, ["geo", "longitude"])),
    address:
      textFrom(venue.address) ??
      textFrom(path(venue, ["address", "line1"])) ??
      textFrom(path(venue, ["address", "localized_address_display"])),
    city: textFrom(venue.city) ?? textFrom(path(venue, ["address", "city"])),
    region: textFrom(venue.region) ?? textFrom(path(venue, ["address", "region"])),
    country:
      textFrom(venue.country) ?? textFrom(path(venue, ["address", "country"])),
    url: textFrom(venue.url),
  };
}

function mapGenericPerformer(value: unknown): NormalizedPerformer | null {
  const record = asRecord(value);
  if (!record) return null;
  const name =
    textFrom(record.name) ??
    textFrom(record.title) ??
    textFrom(record.label) ??
    textFrom(record.formatted_address);
  if (!name) return null;

  return {
    providerId: textFrom(record.id) ?? textFrom(record.identifier),
    name,
    billing: textFrom(record.role) ?? textFrom(record.type),
    externalIds: {
      musicbrainzId: textFrom(record.musicbrainzId) ?? "",
      jambaseId: textFrom(record.identifier) ?? textFrom(record.id) ?? "",
    },
  };
}

function arrayAt(record: UnknownRecord, keys: string[]) {
  const value = path(record, keys);
  return Array.isArray(value) ? value : [];
}

function firstArrayAt(record: UnknownRecord, paths: string[][]) {
  for (const keys of paths) {
    const value = arrayAt(record, keys);
    if (value.length > 0) return value;
  }
  return [];
}

function path(record: unknown, keys: string[]) {
  let current: unknown = record;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as UnknownRecord)[key];
  }
  return current;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function isEvent(
  value: NormalizedProviderEvent | null,
): value is NormalizedProviderEvent {
  return Boolean(value?.title && value.venue?.name);
}

function isPerformer(
  value: NormalizedPerformer | null,
): value is NormalizedPerformer {
  return Boolean(value?.name);
}
