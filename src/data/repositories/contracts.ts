import type { Asset, Design, DesignVersion, FavoriteAsset, Inspiration, Work } from "@/types/domain";
import type { Repository } from "./repository";
export type InspirationRepository = Repository<Inspiration>;
export type FavoriteAssetRepository = Repository<FavoriteAsset>;
export type AssetRepository = Repository<Asset>;
export type WorkRepository = Repository<Work>;
export type DesignRepository = Repository<Design>;
export type DesignVersionRepository = Repository<DesignVersion>;

// Supabase and IndexedDB implementations will conform to these boundaries.
// V0.1 intentionally does not include a sync engine or conflict resolution.
