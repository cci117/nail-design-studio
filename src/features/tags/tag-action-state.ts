import type { Tag } from "./tag-types";

export interface TagActionState {
  error: string | null;
  tag?: Tag;
}

export const initialTagActionState: TagActionState = { error: null };
