export interface ItemLocation {
  warehouse: string; // Ex: Galpão Central, Almoxarifado Didático
  aisle: string;     // Ex: Corredor A, Rua 02
  shelf: string;     // Ex: Prateleira 03, Nível 2
  bin: string;       // Ex: Escaninho 14, Box B-05
  fullAddress?: string;
}

export interface Tipo {
  id: string;
  code: string;       // Ex: TIP-01
  name: string;       // Ex: Matéria-Prima Metálica
  description?: string;
  createdAt: string;
}

export interface Grupo {
  id: string;
  tipoId: string;
  code: string;       // Ex: GRP-0101
  name: string;       // Ex: Aços e Ligas
  description?: string;
  createdAt: string;
}

export interface Subgrupo {
  id: string;
  tipoId: string;
  grupoId: string;
  code: string;       // Ex: SUB-010101
  name: string;       // Ex: Barras Redondas Laminadas
  description?: string;
  createdAt: string;
}

export interface Artigo {
  id: string;
  tipoId: string;
  grupoId: string;
  subgrupoId: string;
  code: string;       // Ex: ART-010101001
  name: string;       // Ex: Barra Aço 1045 Ø 1" x 3000mm
  description?: string;
  unit: string;       // UN, KG, M, M2, L, CX, PC, PAR, etc.
  currentStock: number;
  minStock: number;
  maxStock: number;
  averageCost: number; // R$ custo médio unitário
  location: ItemLocation;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA';

export interface StockMovement {
  id: string;
  articleId: string;
  articleCode: string;
  articleName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalCost?: number;
  documentNumber?: string;       // NF ou Requisição
  partnerOrDepartment: string;  // Fornecedor ou Setor/Turma/Docente
  location: ItemLocation;
  responsible: string;          // Almoxarife / Usuário
  date: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryDatabase {
  types: Tipo[];
  groups: Grupo[];
  subgroups: Subgrupo[];
  articles: Artigo[];
  movements: StockMovement[];
  version: number;
  lastUpdated: string;
}

export interface GitHubConfig {
  token: string;
  owner?: string;
  repo?: string;
  branch?: string;
  path?: string;
  gistId?: string;
  mode: 'gist' | 'repo';
  autoSync: boolean;
  lastSync?: string;
}

export interface GitHubVersion {
  id: string;
  committedAt: string;
  author: string;
  description: string;
  itemsCount: number;
  movementsCount: number;
}
