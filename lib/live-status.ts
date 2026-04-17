// ---------------------------------------------------------------------------
// Live status — manual override flag only (KV key: "live_manual")
// Auto-detection results are NOT stored here to avoid false-positive bleed.
// ---------------------------------------------------------------------------

let memManual = false;

function isKVEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

export async function getLiveStatus(): Promise<boolean> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    const val = await kv.get<boolean>("live_manual");
    return val === true;
  }
  return memManual;
}

export async function setLiveStatus(live: boolean): Promise<void> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set("live_manual", live);
  } else {
    memManual = live;
  }
}
