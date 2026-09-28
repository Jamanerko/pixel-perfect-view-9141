import type { Order } from "./types";

/**
 * Address-only optimizer: without geocoding we cluster stops by the district /
 * street token in the address, then walk clusters from the largest to the
 * smallest and keep house numbers ascending inside a street. Deferred stops are
 * always pushed behind the rest, and the driver's home is the final stop.
 */

const NOISE = new Set([
  "ул",
  "улица",
  "көше",
  "кошесі",
  "көшесі",
  "д",
  "дом",
  "кв",
  "пр",
  "проспект",
  "мкр",
  "ықшамаудан",
  "г",
  "город",
  "қала",
]);

export function districtOf(address: string): string {
  const cleaned = address
    .toLowerCase()
    .replace(/[.,/\\-]+/g, " ")
    .replace(/\d+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !NOISE.has(w));
  return cleaned[0] ?? "—";
}

function houseNumber(address: string): number {
  const m = address.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export function districtBreakdown(orders: Order[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.delivered) continue;
    const d = districtOf(o.address);
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function optimize(orders: Order[]): Order[] {
  const done = orders.filter((o) => o.delivered);
  const active = orders.filter((o) => !o.delivered);

  const groups = new Map<string, Order[]>();
  for (const o of active) {
    const key = districtOf(o.address);
    const list = groups.get(key);
    if (list) list.push(o);
    else groups.set(key, [o]);
  }

  const ordered = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .flatMap(([, list]) =>
      [...list].sort(
        (a, b) => houseNumber(a.address) - houseNumber(b.address) || a.createdAt - b.createdAt,
      ),
    );

  const queue = [
    ...ordered.filter((o) => !o.deferred),
    ...ordered.filter((o) => o.deferred),
  ];

  return [...done, ...queue.map((o, i) => ({ ...o, seq: i }))];
}

export function sortForDisplay(orders: Order[]): Order[] {
  const active = orders
    .filter((o) => !o.delivered)
    .sort((a, b) => Number(a.deferred) - Number(b.deferred) || a.seq - b.seq);
  const done = orders.filter((o) => o.delivered).sort((a, b) => a.seq - b.seq);
  return [...active, ...done];
}

export function mapLinks(address: string) {
  const q = encodeURIComponent(address);
  return {
    dgis: `https://2gis.kz/search/${q}`,
    yandex: `https://yandex.kz/maps/?text=${q}&rtext=~${q}&rtt=auto`,
  };
}
