const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const serviceHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

// ============================================================
// Items query
// ============================================================

export interface ItemRow {
  id: number;
  name: string;
  slot: string;
  rarity: string;
  image_url: string | null;
}

/**
 * Fetch items from the items table (via service_role).
 * Optionally filter by slot, limit results.
 */
export async function fetchItems(
  slot?: string,
  limit = 10
): Promise<ItemRow[]> {
  let url = `${SUPABASE_URL}/rest/v1/items?select=id,name,slot,rarity,image_url&order=id.asc&limit=${limit}`;
  if (slot) url += `&slot=eq.${slot}`;

  const res = await fetch(url, { headers: serviceHeaders });
  if (!res.ok) throw new Error(`fetchItems failed: ${res.status}`);
  return res.json();
}

// ============================================================
// Seed inventory
// ============================================================

/**
 * Insert an item into user_inventory for a given user.
 * Uses resolution=ignore-duplicates (UNIQUE user_id+item_id).
 */
export async function seedUserInventory(
  userId: string,
  itemId: number,
  source = "chest"
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_inventory`, {
    method: "POST",
    headers: {
      ...serviceHeaders,
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      item_id: itemId,
      source,
      obtained_at: new Date().toISOString(),
    }),
  });
  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    throw new Error(`seedUserInventory failed: ${res.status} ${body}`);
  }
}

// ============================================================
// Seed pending chest
// ============================================================

/**
 * Insert a pending (unclaimed) chest for a user.
 */
export async function seedPendingChest(
  userId: string,
  sourceType: string,
  sourceId: string
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_chests`, {
    method: "POST",
    headers: {
      ...serviceHeaders,
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      source_type: sourceType,
      source_id: sourceId,
      claimed: false,
      granted_at: new Date().toISOString(),
    }),
  });
  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    throw new Error(`seedPendingChest failed: ${res.status} ${body}`);
  }
}

// ============================================================
// Auth — sign in as user (get access_token)
// ============================================================

/**
 * Sign in with email/password using anon key.
 * Returns the access_token for use in RPC/REST calls as that user.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`signIn failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ============================================================
// Call RPC as user (with user's access_token, NOT service_role)
// ============================================================

/**
 * Call a Supabase RPC as the authenticated user.
 * Returns { data, error } shape.
 */
export async function callRpcAsUser(
  accessToken: string,
  rpcName: string,
  params: Record<string, unknown>
): Promise<{ data: unknown; error: string | null; status: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpcName}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const body = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    data = body;
  }

  const error =
    !res.ok && typeof data === "object" && data !== null && "message" in data
      ? (data as { message: string }).message
      : !res.ok
        ? body
        : null;

  return { data, error, status: res.status };
}

// ============================================================
// Direct table insert as user (to test RLS blocks)
// ============================================================

/**
 * Attempt a direct INSERT into a table using the user's access_token.
 * Used to verify RLS blocks direct writes.
 */
export async function directInsertAsUser(
  accessToken: string,
  table: string,
  row: Record<string, unknown>
): Promise<{ error: string | null; status: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  let error: string | null = null;
  if (!res.ok) {
    const body = await res.text();
    error = body;
  }
  return { error, status: res.status };
}
