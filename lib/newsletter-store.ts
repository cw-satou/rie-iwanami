import { Newsletter } from "./types";
import { newsletters as staticNewsletters } from "./newsletter";

// In-memory fallback (dev / non-KV environments), seeded from static data
let memStore: Newsletter[] | null = null;

function isKVEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

async function memGet(): Promise<Newsletter[]> {
  if (!memStore) {
    memStore = [...staticNewsletters];
  }
  return memStore;
}

export async function getAllNewsletters(): Promise<Newsletter[]> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    const data = await kv.get<Newsletter[]>("newsletters");
    if (!data) {
      // First run: seed from static data
      await kv.set("newsletters", staticNewsletters);
      return [...staticNewsletters];
    }
    return data;
  }
  return memGet();
}

export async function createNewsletter(
  nl: Newsletter
): Promise<{ success: boolean; error?: string }> {
  const all = await getAllNewsletters();
  if (all.find((n) => n.id === nl.id)) {
    return { success: false, error: "同じIDの会報が既に存在します" };
  }
  // Prepend so newest appears first
  const updated = [nl, ...all];
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set("newsletters", updated);
  } else {
    memStore = updated;
  }
  return { success: true };
}

export async function updateNewsletter(
  id: string,
  updates: Partial<Omit<Newsletter, "id">>
): Promise<{ success: boolean; error?: string }> {
  const all = await getAllNewsletters();
  const idx = all.findIndex((n) => n.id === id);
  if (idx === -1) return { success: false, error: "会報が見つかりません" };

  const updated = [...all];
  updated[idx] = { ...all[idx], ...updates };

  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set("newsletters", updated);
  } else {
    memStore = updated;
  }
  return { success: true };
}

export async function deleteNewsletter(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const all = await getAllNewsletters();
  if (!all.find((n) => n.id === id)) {
    return { success: false, error: "会報が見つかりません" };
  }
  const updated = all.filter((n) => n.id !== id);
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set("newsletters", updated);
  } else {
    memStore = updated;
  }
  return { success: true };
}
