export interface PondRecord {
  id: string;
  pondName: string;
  seedCount: number;
  feedExpense: number;
  sales: number;
  growthNotes: string;
  lastUpdated: string;
}

export interface TreeRecord {
  id: string;
  type: string;
  count: number;
  harvestCount: number;
  income: number;
  expense: number;
  lastFertilized: string;
}

export interface CattleRecord {
  id: string;
  tagId: string;
  milkProduction: number;
  healthStatus: string;
  expense: number;
  date: string;
}

export interface LaborRecord {
  id: string;
  name: string;
  workDescription: string;
  wage: number;
  laborType: 'দৈনিক' | 'মাসিক';
  attendance: boolean;
  date: string;
}

export interface Transaction {
  id: string;
  type: 'আয়' | 'ব্যয়';
  category: 'পুকুর' | 'গরু' | 'শ্রমিক' | 'বাগান' | 'অন্যান্য';
  subCategory?: string;
  amount: number;
  date: string;
}

export type AppData = {
  ponds: PondRecord[];
  trees: TreeRecord[];
  cattle: CattleRecord[];
  labor: LaborRecord[];
  transactions: Transaction[];
};
