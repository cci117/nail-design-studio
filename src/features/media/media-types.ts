import type { EntityKind } from "@/types/domain";

export const MAX_MEDIA_PER_ENTITY = 12;
export const MAX_SOURCE_FILE_SIZE = 15 * 1024 * 1024;
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface MediaItem {
  id: string;
  user_id: string;
  storage_bucket: string;
  storage_path: string;
  media_type: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  entity_type: EntityKind | null;
  entity_id: string | null;
  role: "cover" | "attachment" | string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  signedUrl?: string;
}

export interface NewMediaMetadata {
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
}
