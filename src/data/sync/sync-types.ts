import type { EntityKind, SyncStatus } from "@/types/domain";
export interface LocalSyncMetadata { entityType: EntityKind; entityId: string; status: SyncStatus; localUpdatedAt: string; lastSyncedAt?: string; }
// TODO(V0.2+): introduce a durable queue only when offline writes are implemented.
