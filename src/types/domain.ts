export type EntityId = string;
export type SyncStatus = "synced" | "pending" | "failed";
export type LibraryItemStatus = "draft" | "active";
export type WorkRestorationLevel = "very_close" | "adjusted" | "major_changes";
export type WorkChangeReason = "material_limit" | "production_difficulty" | "aesthetic_change" | "color_adjustment" | "composition_adjustment" | "decoration_adjustment" | "shape_length_adjustment" | "other";
export type WorkMediaKind = "press_on" | "worn" | "detail" | "other";
export type EntityKind = "inspiration" | "favorite_asset" | "asset" | "work" | "design" | "design_version";
export interface BaseEntity { id: EntityId; user_id: string; created_at: string; updated_at: string; deleted_at: string | null; version: number; }
export interface Inspiration extends BaseEntity { title: string | null; status: LibraryItemStatus; notes: string | null; source_url: string | null; }
export interface FavoriteAsset extends BaseEntity { name: string | null; status: LibraryItemStatus; category: string | null; notes: string | null; source_url: string | null; }
export interface Asset extends BaseEntity { name: string | null; category: string | null; status: LibraryItemStatus; brand: string | null; color: string | null; quantity: number | null; unit: string | null; notes: string | null; }
export interface Work extends BaseEntity { title: string | null; status: LibraryItemStatus; notes: string | null; completed_at: string | null; source_design_version_id: string | null; restoration_level: WorkRestorationLevel | null; change_reasons: WorkChangeReason[]; feedback_notes: string | null; }
export interface Design extends BaseEntity { title: string; status: "draft" | "active" | "completed" | "archived"; notes: string | null; }
export interface DesignVersion extends BaseEntity { design_id: string; version_number: number; version_type: "concept" | "ten_finger_plan" | "final_render" | "revision"; description: string | null; structured_data: Record<string, unknown>; }
