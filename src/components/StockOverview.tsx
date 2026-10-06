import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  AlertTriangle, 
  MapPin, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  DollarSign, 
  Edit2, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { 
  Artigo, 
  InventoryDatabase, 
  ItemLocation 
} from '../types/inventory';
import { formatFullAddress } from '../services/codeGenerator';
import { exportStockToCSV } from '../services/storage';

interface StockOverviewProps {
  db: InventoryDatabase;
  onOpenEntry: (article: Artigo) => void;
  onOpenExit: (article: Artigo) => void;
  onUpdateArticle: (article: Artigo) => void;
}

export const StockOverview: React.FC<StockOverviewProps> = ({
  db,
  onOpenEntry,
  onOpenExit,
  onUpdateArticle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'ZERO' | 'NORMAL'>('ALL');
  const [selectedTipoId, setSelectedTipoId] = useState<string>('ALL');
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('ALL');

  // Estado para edição rápida de localização
  const [editingLocArticleId, setEditingLocArticleId] = useState<string | null>(null);
  const [editLocWarehouse, setEditLocWarehouse] = useState('');
  const [editLocAisle, setEditLocAisle] = useState('');
  const [editLocShelf, setEditLocShelf] = useState('');
  const [editLocBin, setEditLocBin] = useState('');

  // Mapas auxiliares para busca de nomes
  const tiposMap = useMemo(() => new Map(db.types.map(t => [t.id, t])), [db.types]);
  const gruposMap = useMemo(() => new Map(db.groups.map(g => [g.id, g])), [db.groups]);
  const subgruposMap = useMemo(() => new Map(db.subgroups.map(s => [s.id, s])), [db.subgroups]);

  // Filtros combinados
  const filteredArticles = useMemo(() => {
    return db.articles.filter(art => {
      // Filtro de texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = art.name.toLowerCase().includes(term);
        const matchesCode = art.code.toLowerCase().includes(term);
        const matchesLoc = art.location.fullAddress?.toLowerCase().includes(term);
        const matchesBarcode = art.barcode?.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesLoc && !matchesBarcode) return false;
      }

      // Filtro de status
      if (statusFilter === 'CRITICAL' && (art.currentStock > art.minStock || art.currentStock <= 0)) return false;
      if (statusFilter === 'ZERO' && art.currentStock > 0) return false;
      if (statusFilter === 'NORMAL' && (art.currentStock <= art.minStock || art.currentStock <= 0)) return false;

      // Filtro hierárquico
      if (selectedTipoId !== 'ALL' && art.tipoId !== selectedTipoId) return false;
      if (selectedGrupoId !== 'ALL' && art.grupoId !== selectedGrupoId) return false;

      return true;
    });
  }, [db.articles, searchTerm, statusFilter, selectedTipoId, selectedGrupoId]);

  // Métricas agregadas dos artigos filtrados
  const totalFilteredQuantity = filteredArticles.reduce((acc, a) => acc + a.currentStock, 0);
  const totalFilteredValue = filteredArticles.reduce((acc, a) => acc + (a.currentStock * (a.averageCost || 0)), 0);

  const startEditLocation = (art: Artigo) => {
    setEditingLocArticleId(art.id);
    setEditLocWarehouse(art.location.warehouse || '');
    setEditLocAisle(art.location.aisle || '');
    setEditLocShelf(art.location.shelf || '');
    setEditLocBin(art.location.bin || '');
  };

  const saveEditLocation = (art: Artigo) => {
    const newLoc: ItemLocation = {
      warehouse: editLocWarehouse.trim() || 'Almoxarifado Geral',
      aisle: editLocAisle.trim(),
      shelf: editLocShelf.trim(),
      bin: editLocBin.trim(),
    };
    newLoc.fullAddress = formatFullAddress(newLoc);

    onUpdateArticle({
      ...art,
      location: newLoc,
      updatedAt: new Date().toISOString(),
    });

    setEditingLocArticleId(null);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Controle e Busca */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-neutral-900 text-white rounded">
                <Boxes className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight uppercase">
                Posição do Estoque em Tempo Real
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Consulta dinâmica de saldos físicos, limites de segurança, valores financeiros e endereçamento logístico.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportStockToCSV(db)}
              className="flex items-center space-x-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded text-xs font-bold border border-neutral-300 transition-colors cursor-pointer"
              title="Exportar planilha CSV da posição de estoque"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-600" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Pesquisa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Campo de Busca Livre */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código ART, descrição, galpão, corredor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
            />
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={selectedTipoId}
              onChange={e => setSelectedTipoId(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
            >
              <option value="ALL">Todos os Tipos</option>
              {db.types.map(t => (
                <option key={t.id} value={t.id}>[{t.code}] {t.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Status de Estoque */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full text-xs p-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
            >
              <option value="ALL">Todos os Status</option>
              <option value="CRITICAL">⚠️ Crítico / Abaixo do Mínimo</option>
              <option value="ZERO">⛔ Saldo Zerado (0)</option>
              <option value="NORMAL">✅ Estoque Normal</option>
            </select>
          </div>
        </div>

        {/* Resumo com métricas dinâmicas */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
          <div>
            Exibindo <strong>{filteredArticles.length}</strong> de <strong>{db.articles.length}</strong> artigos catalogados
          </div>
          <div className="flex items-center space-x-4">
            <span>
              Saldo Total Filtrado: <strong className="text-neutral-900 font-bold">{totalFilteredQuantity.toLocaleString('pt-BR')}</strong>
            </span>
            <span className="text-neutral-300">|</span>
            <span>
              Valor Total: <strong className="text-neutral-900 font-bold">{totalFilteredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Artigos em Tempo Real */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-2xs overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <Boxes className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
            <p className="text-sm font-semibold text-neutral-700">Nenhum artigo encontrado com estes filtros.</p>
            <p className="text-xs text-neutral-400 mt-1">Ajuste os termos de pesquisa ou cadastre novos artigos no menu Hierarquia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white font-bold uppercase text-[11px] tracking-wider border-b border-neutral-800">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Material / Especificação</th>
                  <th className="py-3 px-3">Hierarquia</th>
                  <th className="py-3 px-3 text-center">Saldo Atual</th>
                  <th className="py-3 px-3 text-center">Mínimo</th>
                  <th className="py-3 px-3 text-right">Custo Médio</th>
                  <th className="py-3 px-3 text-right">Valor Total</th>
                  <th className="py-3 px-3">Localização Física</th>
                  <th className="py-3 px-3 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredArticles.map((art) => {
                  const isZero = art.currentStock <= 0;
                  const isCritical = art.currentStock <= art.minStock && !isZero;
                  const tipo = tiposMap.get(art.tipoId);
                  const grupo = gruposMap.get(art.grupoId);
                  const subgrupo = subgruposMap.get(art.subgrupoId);
                  const totalValue = art.currentStock * (art.averageCost || 0);

                  const isEditingLoc = editingLocArticleId === art.id;

                  return (
                    <tr key={art.id} className="hover:bg-neutral-50 transition-colors">
                      {/* Código */}
                      <td className="py-2.5 px-3 font-mono font-extrabold text-neutral-900 whitespace-nowrap">
                        <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded border border-neutral-300">
                          {art.code}
                        </span>
                      </td>

                      {/* Nome do Material */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-neutral-900 max-w-xs sm:max-w-md">
                          {art.name}
                        </div>
                        {art.description && (
                          <div className="text-[11px] text-neutral-500 truncate max-w-xs">
                            {art.description}
                          </div>
                        )}
                      </td>

                      {/* Hierarquia */}
                      <td className="py-2.5 px-3 text-[11px] text-neutral-600 whitespace-nowrap">
                        <div>{tipo?.name || '—'}</div>
                        <div className="text-neutral-400 text-[10px]">&gt; {grupo?.name || '—'}</div>
                      </td>

                      {/* Saldo Atual com Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black ${
                          isZero 
                            ? 'bg-neutral-200 text-neutral-700' 
                            : isCritical 
                              ? 'bg-red-100 text-red-800 border border-red-300' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {art.currentStock} {art.unit}
                        </span>
                        {isCritical && (
                          <span className="block text-[10px] text-red-600 font-bold mt-0.5">
                            Abaixo do Mínimo
                          </span>
                        )}
                        {isZero && (
                          <span className="block text-[10px] text-neutral-500 font-bold mt-0.5">
                            Esgotado
                          </span>
                        )}
                      </td>

                      {/* Estoque Mínimo */}
                      <td className="py-2.5 px-3 text-center text-neutral-500 whitespace-nowrap">
                        {art.minStock} {art.unit}
                      </td>

                      {/* Custo Médio Unitário */}
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-700 whitespace-nowrap">
                        {(art.averageCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Valor Total em Estoque */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Localização Física (com edição inline) */}
                      <td className="py-2.5 px-3">
                        {isEditingLoc ? (
                          <div className="space-y-1 bg-white p-2 rounded border border-neutral-300 shadow-sm">
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <input
                                type="text"
                                placeholder="Galpão"
                                value={editLocWarehouse}
                                onChange={e => setEditLocWarehouse(e.target.value)}
                                className="p-1 border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Corredor"
                                value={editLocAisle}
                                onChange={e => setEditLocAisle(e.target.value)}
                                className="p-1 border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Prateleira"
                                value={editLocShelf}
                                onChange={e => setEditLocShelf(e.target.value)}
                                className="p-1 border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Box/Escaninho"
                                value={editLocBin}
                                onChange={e => setEditLocBin(e.target.value)}
                                className="p-1 border rounded"
                              />
                            </div>
                            <div className="flex justify-end space-x-1 pt-1">
                              <button
                                onClick={() => setEditingLocArticleId(null)}
                                className="p-1 text-neutral-500 hover:text-black rounded"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => saveEditLocation(art)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                title="Salvar Localização"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-neutral-700">
                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span className="truncate max-w-[160px] text-[11px]" title={art.location.fullAddress}>
                              {art.location.fullAddress || 'Não alocado'}
                            </span>
                            <button
                              onClick={() => startEditLocation(art)}
                              className="p-1 text-neutral-400 hover:text-neutral-800 rounded cursor-pointer"
                              title="Alterar endereço de armazenagem"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Ações Rápidas */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenEntry(art)}
                            className="p-1 bg-neutral-900 hover:bg-black text-white rounded transition-colors cursor-pointer"
                            title="Registrar Entrada (+)"
                          >
                            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => onOpenExit(art)}
                            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                            title="Registrar Saída (-)"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
