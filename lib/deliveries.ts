export type Delivery = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  customer_name: string;
  distance_km: number;
  price_eur: number;
  slot: string;
  items_count: number;
};

export const mockDeliveries: Delivery[] = [
  {
    id: "SHO-2026-0001",
    pickup_address: "Carrefour City — 45 rue Oberkampf, Paris 11e",
    dropoff_address: "12 rue des Pyrénées, Paris 20e",
    customer_name: "Marie L.",
    distance_km: 4.2,
    price_eur: 8.5,
    slot: "Aujourd'hui · 18:00 — 19:00",
    items_count: 3,
  },
  {
    id: "SHO-2026-0002",
    pickup_address: "Monoprix — 22 cours Lafayette, Lyon 3e",
    dropoff_address: "8 place Bellecour, Lyon 2e",
    customer_name: "Antoine D.",
    distance_km: 2.8,
    price_eur: 6.9,
    slot: "Aujourd'hui · 19:30 — 20:30",
    items_count: 5,
  },
  {
    id: "SHO-2026-0003",
    pickup_address: "Auchan — 117 cours Saint-Louis, Bordeaux",
    dropoff_address: "34 rue Notre-Dame, Bordeaux Chartrons",
    customer_name: "Sofia K.",
    distance_km: 5.6,
    price_eur: 10.2,
    slot: "Demain · 11:00 — 12:00",
    items_count: 7,
  },
];
