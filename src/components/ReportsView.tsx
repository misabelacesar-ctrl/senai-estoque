import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Filter, 
  Boxes, 
  ArrowDownRight, 
  ArrowUpRight, 
  MapPin, 
  FileText,
  UserCheck
} from 'lucide-react';
import { InventoryDatabase, MovementType } from '../types/inventory';
import { exportStockToCSV, exportMovementsToCSV } from '../services/storage';

interface ReportsViewProps {
  db: InventoryDatabase;
}

type ReportSubTab = 'position' | 'movements';

export const ReportsView: React.FC<ReportsViewProps> = ({ db }) => {
  const [subTab, setSubTab] = useState<ReportSubTab>('position');

  // Filtros para o Histórico de Movimentações
  const [filterType, setFilterType] = useState<'ALL' | MovementType>('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterArticleId, setFilterArticleId] = useState('ALL');
  const [filterSearch, setFilterSearch] = useState('');

  // Mapas para resolução de hierarquia
  const tiposMap = useMemo(() => new Map(db.types.map(t => [t.id, t.name])), [db.types]);
  const gruposMap = useMemo(() => new Map(db.groups.map(g => [g.id, g.name])), [db.groups]);
  const subgruposMap = useMemo(() => new Map(db.subgroups.map(s => [s.id, s.name])), [db.subgroups]);

  // Movimentações filtradas
  const filteredMovements = useMemo(() => {
    return db.movements.filter(m => {
      if (filterType !== 'ALL' && m.type !== filterType) return false;
      if (filterArticleId !== 'ALL' && m.articleId !== filterArticleId) return false;

      if (filterStartDate) {
        const start = new Date(filterStartDate).getTime();
        const movDate = new Date(m.date).getTime();
        if (movDate < start) return false;
      }

      if (filterEndDate) {
        const end = new Date(filterEndDate).getTime() + 86400000; // Final do dia
        const movDate = new Date(m.date).getTime();
        if (movDate > end) return false;
      }

      if (filterSearch.trim()) {
        const term = filterSearch.toLowerCase();
        const matchCode = m.articleCode.toLowerCase().includes(term);
        const matchName = m.articleName.toLowerCase().includes(term);
        const matchDoc = m.documentNumber?.toLowerCase().includes(term);
        const matchPartner = m.partnerOrDepartment.toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchDoc && !matchPartner) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [db.movements, filterType, filterArticleId, filterStartDate, filterEndDate, filterSearch]);

  // Totais de Inventário
  const totalStockQuantity = db.articles.reduce((acc, a) => acc + a.currentStock, 0);
  const totalStockValue = db.articles.reduce((acc, a) => acc + (a.currentStock * (a.averageCost || 0)), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo de Relatórios (Oculto na Impressão) */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-red-600 text-white rounded">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight uppercase">
                Emissão de Relatórios & Kardex
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Relatórios operacionais e analíticos para inventário físico, localização e auditoria de movimentações.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-neutral-900 hover:bg-black text-white px-3.5 py-2 rounded text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Imprimir relatório formatado com cabeçalho oficial do SENAI-SP"
            >
              <Printer className="w-4 h-4 text-neutral-300" />
              <span>Imprimir / Gerar PDF</span>
            </button>

            <button
              onClick={() => {
                if (subTab === 'position') exportStockToCSV(db);
                else exportMovementsToCSV(db);
              }}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Exportar planilha CSV compatível com Google Planilhas e Excel"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Planilha (CSV)</span>
            </button>
          </div>
        </div>

        {/* Abas dos Relatórios */}
        <div className="flex items-center space-x-2 border-b border-neutral-200 pt-2">
          <button
            onClick={() => setSubTab('position')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              subTab === 'position'
                ? 'border-red-600 text-red-600 bg-red-50/50'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            1. Posição Completa do Estoque e Localizações ({db.articles.length} itens)
          </button>
          <button
            onClick={() => setSubTab('movements')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              subTab === 'movements'
                ? 'border-red-600 text-red-600 bg-red-50/50'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            2. Histórico de Movimentações / Kardex ({db.movements.length} registros)
          </button>
        </div>
      </div>

      {/* CABEÇALHO INSTITUCIONAL EXCLUSIVO PARA IMPRESSÃO (Visível apenas ao imprimir) */}
      <div className="hidden print-only mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-600 text-white flex flex-col items-center justify-center font-black">
              <span className="text-xs">SENAI</span>
              <span className="text-[8px]">SP</span>
            </div>
            <div>
              <h1 className="text-base font-black text-black uppercase">
                SENAI-SP — Serviço Nacional de Aprendizagem Industrial
              </h1>
              <p className="text-xs text-neutral-700">
                SIGE • Sistema Integrado de Gestão e Controle de Estoques
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p><strong>Emissão:</strong> {new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Responsável:</strong> M. Isabela Cesar</p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-neutral-300 flex justify-between items-center text-xs">
          <span className="font-bold uppercase text-neutral-900">
            {subTab === 'position' 
              ? 'Relatório Oficial de Posição de Estoque Físico e Localização' 
              : 'Relatório Oficial de Movimentações de Entrada e Saída (Kardex)'}
          </span>
          <span>Página 1 de 1</span>
        </div>
      </div>

      {/* --- RELATÓRIO 1: POSIÇÃO COMPLETA DO ESTOQUE --- */}
      {subTab === 'position' && (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-2xs overflow-hidden print-card">
          {/* Resumo do Relatório */}
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-neutral-700">Total de Artigos:</span>{' '}
              <strong className="text-neutral-900">{db.articles.length}</strong>
            </div>
            <div>
              <span className="font-bold text-neutral-700">Quantidade Físico Geral:</span>{' '}
              <strong className="text-neutral-900">{totalStockQuantity.toLocaleString('pt-BR')} unidades</strong>
            </div>
            <div>
              <span className="font-bold text-neutral-700">Valor Total do Estoque:</span>{' '}
              <strong className="text-neutral-900 font-mono">
                {totalStockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </div>

          {db.articles.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Boxes className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm font-semibold text-neutral-700">Nenhum artigo cadastrado no inventário.</p>
              <p className="text-xs text-neutral-400 mt-1">Cadastre artigos na aba Hierarquia ou carregue os dados didáticos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Artigo / Especificação Técnica</th>
                    <th className="py-2.5 px-3">Tipo / Grupo / Subgrupo</th>
                    <th className="py-2.5 px-3 text-center">Saldo</th>
                    <th className="py-2.5 px-3 text-center">Mínimo</th>
                    <th className="py-2.5 px-3 text-right">Custo Médio</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3">Localização (Galpão / Corredor / Prat. / Box)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {db.articles.map((art) => {
                    const totalVal = art.currentStock * (art.averageCost || 0);
                    const isCritical = art.currentStock <= art.minStock;

                    return (
                      <tr key={art.id} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 font-mono font-bold whitespace-nowrap">
                          {art.code}
                        </td>
                        <td className="py-2 px-3 font-semibold text-neutral-900">
                          {art.name}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-neutral-600">
                          {tiposMap.get(art.tipoId)} &gt; {gruposMap.get(art.grupoId)} &gt; {subgruposMap.get(art.subgrupoId)}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap font-bold">
                          <span className={isCritical ? 'text-red-600' : 'text-neutral-900'}>
                            {art.currentStock} {art.unit}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-neutral-500 whitespace-nowrap">
                          {art.minStock} {art.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-700 whitespace-nowrap">
                          {(art.averageCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                          {totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-2 px-3 text-neutral-700 whitespace-nowrap text-[11px]">
                          📍 {art.location.fullAddress || 'Não alocado'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- RELATÓRIO 2: HISTÓRICO DE MOVIMENTAÇÕES (KARDEX) --- */}
      {subTab === 'movements' && (
        <div className="space-y-4">
          {/* Painel de Filtros para Movimentações (Oculto na impressão) */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs no-print space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700 uppercase">Filtros do Kardex</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Tipo de Movimento</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as any)}
                  className="w-full p-2 border border-neutral-300 rounded bg-white"
                >
                  <option value="ALL">Todas as Movimentações</option>
                  <option value="ENTRADA">Apenas Entradas (+)</option>
                  <option value="SAIDA">Apenas Saídas (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Filtrar por Artigo</label>
                <select
                  value={filterArticleId}
                  onChange={e => setFilterArticleId(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded bg-white"
                >
                  <option value="ALL">Todos os Artigos</option>
                  {db.articles.map(a => (
                    <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full p-1.5 border border-neutral-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Data Final</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full p-1.5 border border-neutral-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Busca Textual</label>
                <input
                  type="text"
                  placeholder="NF, Fornecedor, Turma..."
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="w-full p-1.5 border border-neutral-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Tabela do Kardex */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-2xs overflow-hidden print-card">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <FileText className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-semibold text-neutral-700">Nenhuma movimentação registrada com estes filtros.</p>
                <p className="text-xs text-neutral-400 mt-1">Utilize as ações de Entrada e Saída no menu para gerar movimentações.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                      <th className="py-2.5 px-3">Data/Hora</th>
                      <th className="py-2.5 px-3 text-center">Tipo</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Artigo</th>
                      <th className="py-2.5 px-3 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-center">Saldo Anterior</th>
                      <th className="py-2.5 px-3 text-center">Novo Saldo</th>
                      <th className="py-2.5 px-3">Documento / NF</th>
                      <th className="py-2.5 px-3">Origem / Destino / Setor</th>
                      <th className="py-2.5 px-3">Responsável</th>
                      <th className="py-2.5 px-3">Endereço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredMovements.map((mov) => {
                      const isEntry = mov.type === 'ENTRADA';
                      return (
                        <tr key={mov.id} className="hover:bg-neutral-50">
                          <td className="py-2 px-3 whitespace-nowrap text-neutral-600 font-mono text-[11px]">
                            {new Date(mov.date).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isEntry 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {isEntry ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              <span>{mov.type}</span>
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold whitespace-nowrap">
                            {mov.articleCode}
                          </td>
                          <td className="py-2 px-3 font-semibold text-neutral-900">
                            {mov.articleName}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap font-bold">
                            <span className={isEntry ? 'text-emerald-700' : 'text-red-700'}>
                              {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-neutral-500 whitespace-nowrap">
                            {mov.previousStock}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-neutral-900 whitespace-nowrap">
                            {mov.newStock}
                          </td>
                          <td className="py-2 px-3 text-neutral-600 whitespace-nowrap font-mono">
                            {mov.documentNumber || '—'}
                          </td>
                          <td className="py-2 px-3 text-neutral-800">
                            {mov.partnerOrDepartment}
                          </td>
                          <td className="py-2 px-3 text-neutral-600 whitespace-nowrap text-[11px]">
                            {mov.responsible}
                          </td>
                          <td className="py-2 px-3 text-neutral-500 text-[10px] whitespace-nowrap">
                            {mov.location?.fullAddress || '—'}
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
      )}

      {/* RODAPÉ INSTITUCIONAL DE ASSINATURA PARA IMPRESSÃO (Visível apenas na impressão) */}
      <div className="hidden print-only mt-12 pt-6 border-t border-neutral-400 text-xs">
        <div className="grid grid-cols-2 gap-8 text-center pt-8">
          <div>
            <div className="border-t border-black w-48 mx-auto mb-1"></div>
            <p className="font-bold">Almoxarife Responsável</p>
            <p className="text-neutral-500 text-[10px]">SENAI-SP • Controle de Materiais</p>
          </div>
          <div>
            <div className="border-t border-black w-48 mx-auto mb-1"></div>
            <p className="font-bold">M. Isabela Cesar</p>
            <p className="text-neutral-500 text-[10px]">Responsável Técnico / Engenharia de Software</p>
          </div>
        </div>
      </div>
    </div>
  );
};
