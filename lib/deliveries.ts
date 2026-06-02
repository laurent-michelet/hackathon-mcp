export interface Drive {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

export interface Client {
  id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

export type DeliverySize = "s" | "m" | "l" | "xl";
export type DeliveryTransport = "car" | "bike" | "walk" | "cargo_bike" | "electric_bike";

export interface Delivery {
  id?: string;
  internal_reference?: string;
  reference?: string;
  withdrawal_start?: string;
  withdrawal_end?: string;
  delivery_start?: string;
  delivery_end?: string;
  tips?: number;
  devise?: string;
  size?: DeliverySize;
  volume?: number;
  transport_type?: DeliveryTransport;
  drive?: Drive;
  client?: Client;
  trip?: {
    duration?: number;
    distance?: number;
  };
  is_regular_trip?: boolean;
  additional_info?: string;
  frozen?: boolean;
}

// ── Mock data (replace with real API call later) ─────────────────────────────

export const mockDeliveries: Delivery[] = [
  {
    id: "294337",
    internal_reference: "NB3R",
    reference: "DX321317",
    tips: 7.80,
    devise: "EUR",
    size: "m",
    transport_type: "car",
    withdrawal_start: "2026-06-10T14:30:00",
    withdrawal_end: "2026-06-10T16:30:00",
    delivery_start: "2026-06-10T15:00:00",
    delivery_end: "2026-06-10T18:00:00",
    drive: { name: "Leclerc Paridis", address: "Route de Paris", city: "Nantes", postal_code: "44300" },
    client: { city: "Rezé", postal_code: "44400" },
    trip: { duration: 480, distance: 3800 },
    is_regular_trip: false,
  },
  {
    id: "294338",
    internal_reference: "294338",
    reference: "DX321318",
    tips: 9.20,
    devise: "EUR",
    size: "l",
    transport_type: "car",
    withdrawal_start: "2026-06-10T09:30:00",
    withdrawal_end: "2026-06-10T12:00:00",
    delivery_start: "2026-06-10T10:00:00",
    delivery_end: "2026-06-10T13:00:00",
    drive: { name: "Carrefour Atlantis", city: "Nantes", postal_code: "44800" },
    client: { city: "Bouguenais", postal_code: "44340" },
    trip: { duration: 720, distance: 5200 },
    is_regular_trip: true,
  },
  {
    id: "294339",
    internal_reference: "294339",
    reference: "DX321319",
    tips: 6.40,
    devise: "EUR",
    size: "s",
    transport_type: "bike",
    withdrawal_start: "2026-06-10T10:00:00",
    withdrawal_end: "2026-06-10T11:30:00",
    delivery_start: "2026-06-10T10:30:00",
    delivery_end: "2026-06-10T12:00:00",
    drive: { name: "Super U Pont-Rousseau", city: "Rezé", postal_code: "44400" },
    client: { city: "Rezé", postal_code: "44400" },
    trip: { duration: 300, distance: 1600 },
    is_regular_trip: false,
    additional_info: "Digicode : 1234",
  },
];
