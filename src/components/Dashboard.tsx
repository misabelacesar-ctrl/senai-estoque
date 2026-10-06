import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowDownCircle, 
  ArrowUpCircle,
  FolderTree, 
  Boxes, 
  FileSpreadsheet, 
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { InventoryDatabase } from '../types/inventory';
import { TabType } from './Navigation';

interface DashboardProps {
  db: InventoryDatabase;
  onNavigate: (tab: TabType) => void;
  onOpenEntryModal: () => void;
  onOpenExitModal: () => void;
  onLoadSampleData: () => void;
  onResetDb: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  db,
  onNavigate,
  onOpenEntryModal,
  onOpenExitModal,
  onLoadSampleData,
  onResetDb,
}) => {
  const totalArticles = db.articles.length;
  const totalQuantity = db.articles.reduce((acc, a) => acc + a.currentStock, 0);
  const totalInventoryValue = db.articles.reduce(
    (acc, a) => acc + (a.currentStock * (a.averageCost || 0)), 
    0
  );

  const lowStockArticles = db.articles.filter(
    (a) => a.currentStock <= a.minStock
  );

  const recentMovements = [...db.movements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const isEmpty = totalArticles === 0;

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas e Estado Inicial */}
      {isEmpty ? (
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-l-4 border-red-600 rounded-lg p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="bg-red-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-widest">
                  Ambiente Pronto
                </span>
                <h2 className="text-xl font-bold tracking-tight">
                  Banco de Dados Inicializado (Estrutura Vazia)
                </h2>
              </div>
              <p className="text-neutral-300 text-sm max-w-2xl">
                O sistema está pronto para testes e validação com estrutura vazia conforme solicitado.
                Você pode cadastrar sua própria hierarquia (Tipo → Grupo → Subgrupo → Artigo) ou, se preferir
                testar de imediato os relatórios e movimentações, carregar os dados didáticos do SENAI-SP.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onLoadSampleData}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Carregar Dados Didáticos SENAI</span>
              </button>

              <button
                onClick={() => onNavigate('hierarchy')}
                className="flex items-center space-x-2 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all border border-neutral-600 cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-neutral-300" />
                <span>Iniciar Cadastro Manual</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-md">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-semibold uppercase">Ambiente Ativo</p>
              <p className="text-sm font-bold text-neutral-900">
                {totalArticles} artigos cadastrados em {db.types.length} tipos, {db.groups.length} grupos e {db.subgroups.length} subgrupos
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('stock-overview')}
              className="text-xs font-semibold text-neutral-700 hover:text-red-600 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              Consultar Saldos
            </button>
            <button
              onClick={onResetDb}
              className="text-xs font-medium text-neutral-500 hover:text-red-600 hover:underline px-2 py-1 cursor-pointer"
              title="Zerar banco de dados para reiniciar testes"
            >
              Resetar para Banco Vazio
            </button>
          </div>
        </div>
      )}

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Artigos */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total de Artigos
            </span>
            <div className="p-2 bg-neutral-100 text-neutral-800 rounded-md">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-neutral-900 tracking-tight">
              {totalArticles}
            </div>
            <div className="text-xs text-neutral-500 mt-1 flex items-center space-x-1">
              <span>{db.subgroups.length} subgrupos catalogados</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Saldo Físico Total */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Saldo Físico Geral
            </span>
            <div className="p-2 bg-neutral-100 text-neutral-800 rounded-md">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-neutral-900 tracking-tight">
              {totalQuantity.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              unidades/peças em armazenagem
            </div>
          </div>
        </div>

        {/* KPI 3: Valor Total Inventariado */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Valor do Estoque
            </span>
            <div className="p-2 bg-neutral-100 text-neutral-800 rounded-md">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-neutral-900 tracking-tight">
              {totalInventoryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              custo médio ponderado total
            </div>
          </div>
        </div>

        {/* KPI 4: Alertas de Estoque Crítico */}
        <div className={`border rounded-lg p-5 shadow-2xs transition-all ${
          lowStockArticles.length > 0 
            ? 'bg-red-50 border-red-300 text-red-900' 
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              lowStockArticles.length > 0 ? 'text-red-700' : 'text-neutral-500'
            }`}>
              Estoque Crítico / Baixo
            </span>
            <div className={`p-2 rounded-md ${
              lowStockArticles.length > 0 
                ? 'bg-red-600 text-white' 
                : 'bg-neutral-100 text-neutral-800'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black tracking-tight ${
              lowStockArticles.length > 0 ? 'text-red-600' : 'text-neutral-900'
            }`}>
              {lowStockArticles.length}
            </div>
            <div className="text-xs mt-1">
              {lowStockArticles.length > 0 ? (
                <span className="font-semibold text-red-700">Abaixo do estoque mínimo estipulado</span>
              ) : (
                <span className="text-neutral-500">Nenhum artigo em nível de alerta</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas em Destaque */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
        <h3 className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider mb-3">
          Ações Operacionais Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenEntryModal}
            className="flex items-center justify-center space-x-2 bg-neutral-900 hover:bg-black text-white p-3 rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            <span>+ Entrada de Material</span>
          </button>

          <button
            onClick={onOpenExitModal}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <ArrowUpCircle className="w-4 h-4 text-white" />
            <span>- Saída de Material</span>
          </button>

          <button
            onClick={() => onNavigate('hierarchy')}
            className="flex items-center justify-center space-x-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 p-3 rounded-md font-bold text-xs uppercase tracking-wider transition-all border border-neutral-300 cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-neutral-700" />
            <span>Cadastrar Artigo</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center justify-center space-x-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 p-3 rounded-md font-bold text-xs uppercase tracking-wider transition-all border border-neutral-300 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-neutral-700" />
            <span>Emitir Relatórios</span>
          </button>
        </div>
      </div>

      {/* Duas Colunas: Alertas de Estoque e Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Artigos Críticos ou Alerta */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-sm text-neutral-900">
                Itens em Nível Crítico ({lowStockArticles.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('stock-overview')}
              className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
            >
              Ver todos no estoque
            </button>
          </div>

          {lowStockArticles.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-xs font-medium text-neutral-600">Nenhum artigo com estoque crítico no momento.</p>
              <p className="text-[11px] text-neutral-400">Todos os saldos estão em conformidade com o estoque mínimo.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
              {lowStockArticles.map((art) => (
                <div key={art.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded">
                        {art.code}
                      </span>
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {art.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      📍 {art.location.fullAddress || 'Sem endereço'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 text-xs font-extrabold rounded bg-red-100 text-red-700">
                      {art.currentStock} {art.unit}
                    </span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Mín: {art.minStock} {art.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna 2: Últimas Movimentações */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-neutral-700" />
              <h3 className="font-bold text-sm text-neutral-900">
                Últimas Movimentações (Kardex)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
            >
              Ver histórico completo
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <p className="text-xs font-medium text-neutral-600">Nenhuma movimentação registrada.</p>
              <p className="text-[11px] text-neutral-400">Use os botões de Entrada ou Saída para iniciar.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
              {recentMovements.map((mov) => {
                const isEntry = mov.type === 'ENTRADA';
                return (
                  <div key={mov.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`p-1.5 rounded-full shrink-0 ${
                        isEntry ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isEntry ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isEntry ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {mov.type}
                          </span>
                          <span className="text-xs font-semibold text-neutral-900 truncate">
                            {mov.articleName}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                          {mov.partnerOrDepartment} • {new Date(mov.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold ${
                        isEntry ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                      </span>
                      <p className="text-[10px] text-neutral-400">
                        Saldo: {mov.newStock}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
