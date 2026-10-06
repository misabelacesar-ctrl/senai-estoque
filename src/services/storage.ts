import { InventoryDatabase, GitHubConfig } from '../types/inventory';
import { createEmptyDatabase } from './sampleData';

const DB_STORAGE_KEY = 'SENAI_SP_SIGE_INVENTORY_DB_V1';
const GITHUB_CONFIG_KEY = 'SENAI_SP_SIGE_GITHUB_CONFIG_V1';

/**
 * Carrega o banco de dados do armazenamento persistente.
 * Inicia estritamente vazio caso não exista nada salvo ainda.
 */
export function loadDatabase(): InventoryDatabase {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const empty = createEmptyDatabase();
      saveDatabase(empty);
      return empty;
    }
    const parsed = JSON.parse(raw) as InventoryDatabase;
    return {
      types: Array.isArray(parsed.types) ? parsed.types : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      subgroups: Array.isArray(parsed.subgroups) ? parsed.subgroups : [],
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      version: parsed.version || 1,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Falha ao carregar banco de dados local:', error);
    return createEmptyDatabase();
  }
}

/**
 * Salva o banco de dados com timestamp atualizado e dispara notificação local
 */
export function saveDatabase(db: InventoryDatabase): void {
  try {
    const updated: InventoryDatabase = {
      ...db,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(updated));
    // Dispara evento customizado para reatividade em componentes da mesma aba
    window.dispatchEvent(new CustomEvent('inventory-db-changed', { detail: updated }));
  } catch (error) {
    console.error('Falha ao salvar banco de dados local:', error);
  }
}

/**
 * Limpa todo o inventário, retornando a uma estrutura estritamente vazia
 */
export function resetDatabaseToEmpty(): InventoryDatabase {
  const empty = createEmptyDatabase();
  saveDatabase(empty);
  return empty;
}

/**
 * Configuração de persistência em Nuvem (GitHub)
 */
export function loadGitHubConfig(): GitHubConfig {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return {
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
    path: 'senai-sige-database.json',
    gistId: '',
    mode: 'gist',
    autoSync: false,
  };
}

export function saveGitHubConfig(config: GitHubConfig): void {
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Exporta os dados atuais como arquivo JSON baixável (Backup / Google Drive)
 */
export function downloadBackupFile(db: InventoryDatabase, filenamePrefix = 'backup-sige-senaisp'): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta a posição atual do estoque para formato CSV (compatível com Google Planilhas e Excel)
 */
export function exportStockToCSV(db: InventoryDatabase): void {
  const headers = [
    'Código Artigo',
    'Nome do Material',
    'Tipo',
    'Grupo',
    'Subgrupo',
    'Unidade',
    'Saldo Atual',
    'Estoque Mínimo',
    'Estoque Máximo',
    'Status Estoque',
    'Custo Médio (R$)',
    'Valor Total (R$)',
    'Galpão',
    'Corredor',
    'Prateleira',
    'Escaninho',
    'Endereço Completo'
  ];

  const tiposMap = new Map(db.types.map(t => [t.id, t.name]));
  const gruposMap = new Map(db.groups.map(g => [g.id, g.name]));
  const subgruposMap = new Map(db.subgroups.map(s => [s.id, s.name]));

  const rows = db.articles.map(art => {
    let status = 'Normal';
    if (art.currentStock <= 0) status = 'Zerado';
    else if (art.currentStock <= art.minStock) status = 'Crítico / Abaixo do Mínimo';
    else if (art.maxStock && art.currentStock >= art.maxStock) status = 'Excesso';

    const tipoNome = tiposMap.get(art.tipoId) || '';
    const grupoNome = gruposMap.get(art.grupoId) || '';
    const subgrupoNome = subgruposMap.get(art.subgrupoId) || '';
    const valorTotal = (art.currentStock * (art.averageCost || 0)).toFixed(2);

    return [
      `"${art.code}"`,
      `"${art.name.replace(/"/g, '""')}"`,
      `"${tipoNome.replace(/"/g, '""')}"`,
      `"${grupoNome.replace(/"/g, '""')}"`,
      `"${subgrupoNome.replace(/"/g, '""')}"`,
      `"${art.unit}"`,
      art.currentStock,
      art.minStock,
      art.maxStock,
      `"${status}"`,
      (art.averageCost || 0).toFixed(2),
      valorTotal,
      `"${(art.location.warehouse || '').replace(/"/g, '""')}"`,
      `"${(art.location.aisle || '').replace(/"/g, '""')}"`,
      `"${(art.location.shelf || '').replace(/"/g, '""')}"`,
      `"${(art.location.bin || '').replace(/"/g, '""')}"`,
      `"${(art.location.fullAddress || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-estoque-senaisp-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta o histórico completo de movimentações (Kardex) para CSV
 */
export function exportMovementsToCSV(db: InventoryDatabase): void {
  const headers = [
    'Data/Hora',
    'Tipo Movimento',
    'Código Artigo',
    'Nome Artigo',
    'Quantidade',
    'Saldo Anterior',
    'Novo Saldo',
    'Custo Unitário (R$)',
    'Valor Total (R$)',
    'Documento / NF / Req',
    'Origem / Destino / Setor',
    'Responsável',
    'Localização',
    'Observações'
  ];

  const rows = db.movements.map(m => {
    return [
      `"${new Date(m.date).toLocaleString('pt-BR')}"`,
      `"${m.type}"`,
      `"${m.articleCode}"`,
      `"${m.articleName.replace(/"/g, '""')}"`,
      m.quantity,
      m.previousStock,
      m.newStock,
      (m.unitCost || 0).toFixed(2),
      (m.totalCost || 0).toFixed(2),
      `"${(m.documentNumber || '').replace(/"/g, '""')}"`,
      `"${(m.partnerOrDepartment || '').replace(/"/g, '""')}"`,
      `"${(m.responsible || '').replace(/"/g, '""')}"`,
      `"${(m.location?.fullAddress || '').replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historico-movimentacoes-kardex-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
