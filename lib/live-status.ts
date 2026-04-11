// ---------------------------------------------------------------------------
// Live status — KV/memory backed flag
// ---------------------------------------------------------------------------

let memLive = false;

function isKVEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

export async function getLiveStatus(): Promise<boolean> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    const val = await kv.get<boolean>("live_status");
    return val === true;
  }
  return memLive;
}

export async function setLiveStatus(live: boolean): Promise<void> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set("live_status", live);
  } else {
    memLive = live;
  }
}
