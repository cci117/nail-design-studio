import Dexie, { type EntityTable } from "dexie";
import type { Asset, Design, FavoriteAsset, Inspiration, Work } from "@/types/domain";
type LocalRecord<T> = T & { sync_status: "synced" | "pending" | "failed"; last_synced_at?: string };
class NailLocalDatabase extends Dexie {
  inspirations!: EntityTable<LocalRecord<Inspiration>, "id">;
  favoriteAssets!: EntityTable<LocalRecord<FavoriteAsset>, "id">;
  assets!: EntityTable<LocalRecord<Asset>, "id">;
  works!: EntityTable<LocalRecord<Work>, "id">;
  designs!: EntityTable<LocalRecord<Design>, "id">;
  constructor() {
    super("nail-design-studio");
    this.version(1).stores({
      inspirations: "id, user_id, updated_at, sync_status",
      favoriteAssets: "id, user_id, updated_at, sync_status",
      assets: "id, user_id, updated_at, sync_status",
      works: "id, user_id, updated_at, sync_status",
      designs: "id, user_id, updated_at, sync_status",
    });
  }
}
let database: NailLocalDatabase | null = null;
export function getLocalDatabase() {
  if (typeof window === "undefined") return null;
  database ??= new NailLocalDatabase();
  return database;
}
