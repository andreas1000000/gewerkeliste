import { createClient } from "@supabase/supabase-js";
import { assertWritesAllowed } from "./runtime/write-guard.ts";

const QUERY_WRITE_METHODS = new Set<PropertyKey>(["insert", "update", "upsert", "delete"]);
const STORAGE_WRITE_METHODS = new Set<PropertyKey>(["upload", "remove", "move", "copy"]);
const AUTH_ADMIN_WRITE_METHODS = new Set<PropertyKey>([
  "createUser",
  "updateUser",
  "updateUserById",
  "deleteUser",
  "inviteUserByEmail",
  "generateLink",
]);

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return createWriteGuardedSupabaseClient(client);
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createWriteGuardedSupabaseClient<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === "from") {
        return (table: string) => {
          const from = Reflect.get(target, property, receiver) as (table: string) => object;
          const builder = from.call(target, table);
          return createWriteGuardedQueryBuilder(builder, table);
        };
      }

      if (property === "rpc") {
        return (functionName: string, ...args: unknown[]) => {
          assertWritesAllowed({ operation: "supabase.rpc", target: functionName });
          const rpc = Reflect.get(target, property, receiver) as (functionName: string, ...args: unknown[]) => unknown;
          return rpc.call(target, functionName, ...args);
        };
      }

      if (property === "storage") {
        const storage = Reflect.get(target, property, receiver) as object;
        return createWriteGuardedStorage(storage);
      }

      if (property === "auth") {
        const auth = Reflect.get(target, property, receiver) as object;
        return createWriteGuardedAuth(auth);
      }

      return Reflect.get(target, property, receiver);
    },
  });
}

function createWriteGuardedQueryBuilder<T extends object>(builder: T, table: string): T {
  return new Proxy(builder, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (QUERY_WRITE_METHODS.has(property) && typeof value === "function") {
        return (...args: unknown[]) => {
          assertWritesAllowed({ operation: `supabase.${String(property)}`, target: table });
          return value.apply(target, args);
        };
      }

      return value;
    },
  });
}

function createWriteGuardedStorage<T extends object>(storage: T): T {
  return new Proxy(storage, {
    get(target, property, receiver) {
      if (property === "from") {
        return (bucket: string) => {
          const from = Reflect.get(target, property, receiver) as (bucket: string) => object;
          const bucketClient = from.call(target, bucket);
          return createWriteGuardedStorageBucket(bucketClient, bucket);
        };
      }

      return Reflect.get(target, property, receiver);
    },
  });
}

function createWriteGuardedStorageBucket<T extends object>(bucketClient: T, bucket: string): T {
  return new Proxy(bucketClient, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (STORAGE_WRITE_METHODS.has(property) && typeof value === "function") {
        return (...args: unknown[]) => {
          assertWritesAllowed({ operation: `supabase.storage.${String(property)}`, target: bucket });
          return value.apply(target, args);
        };
      }

      return value;
    },
  });
}

function createWriteGuardedAuth<T extends object>(auth: T): T {
  return new Proxy(auth, {
    get(target, property, receiver) {
      if (property === "admin") {
        const admin = Reflect.get(target, property, receiver) as object;
        return createWriteGuardedAuthAdmin(admin);
      }

      return Reflect.get(target, property, receiver);
    },
  });
}

function createWriteGuardedAuthAdmin<T extends object>(admin: T): T {
  return new Proxy(admin, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (AUTH_ADMIN_WRITE_METHODS.has(property) && typeof value === "function") {
        return (...args: unknown[]) => {
          assertWritesAllowed({ operation: `supabase.auth.admin.${String(property)}` });
          return value.apply(target, args);
        };
      }

      return value;
    },
  });
}
