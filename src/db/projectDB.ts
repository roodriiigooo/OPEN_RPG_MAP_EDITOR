import Dexie, { Table } from 'dexie';
import { CustomAsset, Project } from '../types/map';

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  blob: Blob;
  fileName: string;
}

export class ProjectDatabase extends Dexie {
  customAssets!: Table<CustomAsset>;
  projects!: Table<Project>;
  customFonts!: Table<CustomFont>;

  constructor() {
    super('OpenRPGMapsDB');
    this.version(3).stores({
      customAssets: 'id, name, category, type',
      projects: 'id, name',
      customFonts: 'id, name, family'
    });
  }
}

export const db = new ProjectDatabase();
