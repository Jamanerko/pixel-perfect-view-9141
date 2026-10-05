import { createServerFn } from "@tanstack/react-start";

import type { Driver, Order } from "@/lib/types";
import { ADMIN_PHONE } from "@/lib/types";

/** Deterministic PIN hash — the raw PIN never reaches the database. */
async function hashPin(phone: string, pin: string) {
  const data = new TextEncoder().encode(`routeopt:${phone}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type DriverRow = {
  id: string;
  phone: string;
  name: string;
  created_at: string;
  orders_total: number;
  pro_until: string | null;
  last_seen?: string;
  blocked?: boolean;
  admin_note?: string;
};

type OrderRow = {
  id: string;
  address: string;
  phone: string;
  paid: boolean;
  amount: number;
  note: string;
  delivered: boolean;
  deferred: boolean;
  seq: number;
  removed: boolean;
  created_at: number;
  updated_at: number;
};

function toDriver(row: DriverRow): Driver {
  return {
    phone: row.phone,
    name: row.name,
    pin: "",
    createdAt: new Date(row.created_at).getTime(),
    ordersTotal: row.orders_total,
    proUntil: row.pro_until ? new Date(row.pro_until).getTime() : null,
    lastSeen: row.last_seen ? new Date(row.last_seen).getTime() : undefined,
    blocked: !!row.blocked,
    adminNote: row.admin_note ?? "",
  };
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    address: row.address,
    phone: row.phone,
    paid: row.paid,
    amount: Number(row.amount),
    note: row.note,
    delivered: row.delivered,
    deferred: row.deferred,
    seq: row.seq,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    removed: row.removed,
  };
}

const DRIVER_COLS =
  "id, phone, name, created_at, orders_total, pro_until, last_seen, blocked, admin_note";
const ORDER_COLS =
  "id, address, phone, paid, amount, note, delivered, deferred, seq, removed, created_at, updated_at";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Verifies phone + PIN and returns the driver row, or null. */
async function authenticate(phone: string, pin: string) {
  const db = await admin();
  const { data } = await db
    .from("drivers")
    .select(`${DRIVER_COLS}, pin_hash`)
    .eq("phone", phone)
    .maybeSingle();
  if (!data) return null;
  const hash = await hashPin(phone, pin);
  if ((data as { pin_hash: string }).pin_hash !== hash) return null;
  return data as unknown as DriverRow & { pin_hash: string };
}

type Creds = { phone: string; pin: string };

/** Sign in, or register the phone number when it is new. */
export const cloudAuth = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { name?: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: existing } = await db
      .from("drivers")
      .select(`${DRIVER_COLS}, pin_hash`)
      .eq("phone", data.phone)
      .maybeSingle();

    if (existing) {
      const hash = await hashPin(data.phone, data.pin);
      if ((existing as { pin_hash: string }).pin_hash !== hash) {
        return { status: "wrong_pin" as const };
      }
      if ((existing as { blocked?: boolean }).blocked) return { status: "blocked" as const };
      await db.from("drivers").update({ last_seen: new Date().toISOString() }).eq("phone", data.phone);
      return { status: "ok" as const, driver: toDriver(existing as unknown as DriverRow) };
    }

    if (!data.name?.trim()) return { status: "need_name" as const };

    const proUntil =
      data.phone === ADMIN_PHONE
        ? new Date(Date.now() + 3650 * 864e5).toISOString()
        : null;

    const { data: created, error } = await db
      .from("drivers")
      .insert({
        phone: data.phone,
        name: data.name.trim(),
        pin_hash: await hashPin(data.phone, data.pin),
        pro_until: proUntil,
      })
      .select(DRIVER_COLS)
      .single();

    if (error || !created) return { status: "error" as const };
    return { status: "ok" as const, driver: toDriver(created as unknown as DriverRow) };
  });

/**
 * Two-way sync: pushes locally queued changes, then returns the merged set.
 * Last write wins per order, compared on updatedAt.
 */
export const cloudSync = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { orders: Order[] }) => d)
  .handler(async ({ data }) => {
    const me = await authenticate(data.phone, data.pin);
    if (!me) return { status: "unauthorized" as const };
    if (me.blocked) return { status: "blocked" as const };
    const db = await admin();

    const { data: remoteRows } = await db
      .from("orders")
      .select(ORDER_COLS)
      .eq("driver_id", me.id);
    const remote = new Map(
      ((remoteRows ?? []) as unknown as OrderRow[]).map((r) => [r.id, r]),
    );

    const toUpsert = data.orders
      .filter((o) => {
        const r = remote.get(o.id);
        return !r || (o.updatedAt ?? 0) > Number(r.updated_at);
      })
      .map((o) => ({
        id: o.id,
        driver_id: me.id,
        address: o.address,
        phone: o.phone,
        paid: o.paid,
        amount: o.amount,
        note: o.note,
        delivered: o.delivered,
        deferred: o.deferred,
        seq: o.seq,
        removed: o.removed ?? false,
        created_at: o.createdAt,
        updated_at: o.updatedAt ?? o.createdAt,
      }));

    if (toUpsert.length) {
      const { error } = await db.from("orders").upsert(toUpsert);
      if (error) return { status: "error" as const, message: error.message };
    }

    const { data: merged } = await db
      .from("orders")
      .select(ORDER_COLS)
      .eq("driver_id", me.id);
    const all = ((merged ?? []) as unknown as OrderRow[]).map(toOrder);

    await db
      .from("drivers")
      .update({ orders_total: all.length, last_seen: new Date().toISOString() })
      .eq("id", me.id);

    const { data: fresh } = await db
      .from("drivers")
      .select(DRIVER_COLS)
      .eq("id", me.id)
      .single();

    return {
      status: "ok" as const,
      orders: all.filter((o) => !o.removed),
      driver: fresh ? toDriver(fresh as unknown as DriverRow) : null,
    };
  });

/** Admin-only driver registry, visible from any device. */
export const cloudDrivers = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }) => {
    const me = await authenticate(data.phone, data.pin);
    if (!me || me.phone !== ADMIN_PHONE) return { status: "unauthorized" as const };
    const db = await admin();
    const { data: rows } = await db
      .from("drivers")
      .select(DRIVER_COLS)
      .order("created_at", { ascending: true });
    return {
      status: "ok" as const,
      drivers: ((rows ?? []) as unknown as DriverRow[]).map(toDriver),
    };
  });

/** Admin-only: give a driver 30 days of Pro. */
export const cloudActivatePro = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { target: string }) => d)
  .handler(async ({ data }) => {
    const me = await authenticate(data.phone, data.pin);
    if (!me || me.phone !== ADMIN_PHONE) return { status: "unauthorized" as const };
    const db = await admin();
    const until = new Date(Date.now() + 30 * 864e5).toISOString();
    await db.from("drivers").update({ pro_until: until }).eq("phone", data.target);
    return { status: "ok" as const };
  });

type AdminAction =
  | { kind: "extend"; days: number }
  | { kind: "set_until"; until: number | null }
  | { kind: "block" }
  | { kind: "unblock" }
  | { kind: "reset_pin"; newPin: string }
  | { kind: "rename"; name: string }
  | { kind: "note"; note: string }
  | { kind: "reset_orders" }
  | { kind: "delete" };

/** Admin-only: manage a driver's subscription, access and account. */
export const cloudAdminAction = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { target: string; action: AdminAction }) => d)
  .handler(async ({ data }) => {
    const me = await authenticate(data.phone, data.pin);
    if (!me || me.phone !== ADMIN_PHONE) return { status: "unauthorized" as const };
    const a = data.action;
    if (data.target === ADMIN_PHONE && (a.kind === "block" || a.kind === "delete")) {
      return { status: "forbidden" as const };
    }
    const db = await admin();
    const { data: row } = await db
      .from("drivers")
      .select("id, pro_until")
      .eq("phone", data.target)
      .maybeSingle();
    if (!row) return { status: "not_found" as const };

    let patch: Record<string, unknown> | null = null;
    switch (a.kind) {
      case "extend": {
        const cur = row.pro_until ? new Date(row.pro_until).getTime() : 0;
        const base = Math.max(cur, Date.now());
        const days = Math.max(1, Math.min(3650, Math.round(a.days)));
        patch = { pro_until: new Date(base + days * 864e5).toISOString() };
        break;
      }
      case "set_until":
        patch = { pro_until: a.until ? new Date(a.until).toISOString() : null };
        break;
      case "block":
        patch = { blocked: true };
        break;
      case "unblock":
        patch = { blocked: false };
        break;
      case "reset_pin":
        if (!/^\d{4}$/.test(a.newPin)) return { status: "bad_input" as const };
        patch = { pin_hash: await hashPin(data.target, a.newPin) };
        break;
      case "rename":
        if (!a.name.trim()) return { status: "bad_input" as const };
        patch = { name: a.name.trim().slice(0, 80) };
        break;
      case "note":
        patch = { admin_note: a.note.slice(0, 500) };
        break;
      case "reset_orders":
        patch = { orders_total: 0 };
        break;
      case "delete": {
        await db.from("orders").delete().eq("driver_id", row.id);
        await db.from("drivers").delete().eq("id", row.id);
        return { status: "ok" as const };
      }
    }
    const { error } = await db.from("drivers").update(patch).eq("id", row.id);
    if (error) return { status: "error" as const };
    return { status: "ok" as const };
  });
