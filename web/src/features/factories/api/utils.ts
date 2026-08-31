import type { Factory } from '../data/schema';
import type { IFactory } from './types';

export function mapIFactoryToFactory(f: IFactory): Factory {
  return {
    id: f.id,
    name: f.name,
    address: f.address,
    description: f.description,
    createdAt: new Date(f.createdAt),
    updatedAt: new Date(f.updatedAt),
  };
}
