import type { BaseEntity } from "@/types/domain";
export interface Repository<T extends BaseEntity, TCreate = Partial<T>, TUpdate = Partial<T>> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(input: TCreate): Promise<T>;
  update(id: string, input: TUpdate): Promise<T>;
  remove(id: string): Promise<void>;
}
