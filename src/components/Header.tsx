import React from 'react';
import { 
  Boxes, 
  CloudCheck, 
  Github, 
  HardDrive, 
  Database, 
  Clock, 
  UserCheck, 
  RefreshCw 
} from 'lucide-react';
import { InventoryDatabase, GitHubConfig } from '../types/inventory';

interface HeaderProps {
  db: InventoryDatabase;
  gitHubConfig: GitHubConfig;
  onOpenSyncModal: () => void;
  onResetDb: () => void;
  onLoadSampleData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  db,
  gitHubConfig,
  onOpenSyncModal,
}) => {
  const isCloudSynced = Boolean(gitHubConfig.token && (gitHubConfig.gistId || gitHubConfig.repo));

  return (
    <header className="bg-white border-b-2 border-red-600 shadow-sm sticky top-0 z-30 no-print">
      {/* Faixa Superior Institucional */}
      <div className="bg-neutral-900 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <span className="font-semibold tracking-wider text-red-500 uppercase">SENAI-SP</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-300">Serviço Nacional de Aprendizagem Industrial - São Paulo</span>
        </div>

        <div className="flex items-center space-x-4 mt-1 sm:mt-0 text-[11px] text-neutral-300">
          <div className="flex items-center space-x-1.5 bg-neutral-800 px-2.5 py-0.5 rounded text-neutral-200">
            <UserCheck className="w-3.5 h-3.5 text-red-400" />
            <span>Resp. Técnico: <strong className="text-white">M. Isabela Cesar</strong></span>
          </div>
          <div className="hidden md:flex items-center space-x-1 text-neutral-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Barra Principal da Aplicação */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logotipo e Nome do Sistema */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-600 text-white flex flex-col items-center justify-center font-extrabold shadow-md rounded-sm">
            <span className="text-xs leading-none tracking-widest">SENAI</span>
            <span className="text-[9px] font-semibold tracking-wider text-red-200">SP</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-neutral-900 tracking-tight leading-none uppercase">
                SIGE <span className="text-red-600 font-extrabold text-sm align-super">• Estoques</span>
              </h1>
              <span className="bg-neutral-100 text-neutral-700 text-[11px] font-bold px-2 py-0.5 rounded border border-neutral-300">
                v1.0 Pro
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-medium">
              Sistema Integrado de Gestão e Controle de Estoques Industriais
            </p>
          </div>
        </div>

        {/* Status de Armazenamento e Ações de Nuvem */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Indicador de Persistência Local */}
          <div 
            className="flex items-center space-x-2 px-3 py-1.5 rounded bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 shadow-xs"
            title="Armazenamento persistente local ativo"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-neutral-500" />
            <span>
              Persistência Local: <strong className="text-neutral-900 font-semibold">{db.articles.length}</strong> artigos
            </span>
          </div>

          {/* Botão de Nuvem (GitHub / Google Drive) */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded border transition-all shadow-xs cursor-pointer ${
              isCloudSynced
                ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100 hover:text-black'
            }`}
            title="Configurar persistência e sincronização com GitHub ou Google Drive"
          >
            {isCloudSynced ? (
              <>
                <Github className="w-3.5 h-3.5 text-red-600" />
                <span>GitHub Conectado</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-neutral-600" />
                <span>Nuvem (GitHub / Drive)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
