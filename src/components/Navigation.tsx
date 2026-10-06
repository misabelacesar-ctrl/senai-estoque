import React from 'react';
import { 
  LayoutDashboard, 
  FolderTree, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Boxes, 
  FileSpreadsheet, 
  Cloud,
  Plus
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'hierarchy' 
  | 'stock-overview' 
  | 'reports' 
  | 'sync';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenEntryModal: () => void;
  onOpenExitModal: () => void;
  articlesCount: number;
  lowStockCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenEntryModal,
  onOpenExitModal,
  articlesCount,
  lowStockCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Painel Geral',
      description: 'Indicadores e resumo operacional',
      icon: LayoutDashboard,
    },
    {
      id: 'hierarchy' as TabType,
      label: 'Cadastro Hierárquico',
      description: 'Tipo → Grupo → Subgrupo → Artigo',
      icon: FolderTree,
      badge: articlesCount > 0 ? `${articlesCount} itens` : undefined,
    },
    {
      id: 'stock-overview' as TabType,
      label: 'Posição do Estoque',
      description: 'Saldos em tempo real e endereços',
      icon: Boxes,
      alertBadge: lowStockCount > 0 ? `${lowStockCount} alertas` : undefined,
    },
    {
      id: 'reports' as TabType,
      label: 'Relatórios & Kardex',
      description: 'Inventário completo e movimentações',
      icon: FileSpreadsheet,
    },
    {
      id: 'sync' as TabType,
      label: 'GitHub & Google Drive',
      description: 'Persistência na nuvem e versionamento',
      icon: Cloud,
    },
  ];

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between py-2 gap-3">
          {/* Abas Principais em Destaque */}
          <div className="flex items-center overflow-x-auto space-x-1.5 pb-1 lg:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-md font-semibold text-xs sm:text-sm whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white border-red-700 shadow-md transform scale-[1.01]'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-black'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-600'}`} />
                  <span>{item.label}</span>

                  {item.badge && !isActive && (
                    <span className="bg-neutral-200 text-neutral-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}

                  {item.alertBadge && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-neutral-900 text-amber-300' 
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      {item.alertBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Botões Operacionais de Ação Rápida (Entrada e Saída) */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenEntryModal}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-neutral-900 hover:bg-black text-white px-3.5 py-2 rounded-md font-bold text-xs uppercase tracking-wider border border-neutral-800 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Registrar nova entrada de material com NF e endereço de armazenagem"
            >
              <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
              <span>+ Registrar Entrada</span>
            </button>

            <button
              onClick={onOpenExitModal}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-md font-bold text-xs uppercase tracking-wider border border-red-700 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Registrar saída ou requisição de material para oficina/laboratório"
            >
              <ArrowUpCircle className="w-4 h-4 text-white" />
              <span>- Registrar Saída</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
