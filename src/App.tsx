/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { InventoryDatabase, GitHubConfig, Artigo, StockMovement, MovementType } from './types/inventory';
import { loadDatabase, saveDatabase, loadGitHubConfig, saveGitHubConfig, resetDatabaseToEmpty } from './services/storage';
import { createSampleSenaiDatabase } from './services/sampleData';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { HierarchyManager } from './components/HierarchyManager';
import { StockOverview } from './components/StockOverview';
import { ReportsView } from './components/ReportsView';
import { StockMovementModal } from './components/StockMovementModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { Footer } from './components/Footer';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Carrega o banco de dados (inicia estritamente vazio para testes)
  const [db, setDb] = useState<InventoryDatabase>(() => loadDatabase());
  const [gitHubConfig, setGitHubConfig] = useState<GitHubConfig>(() => loadGitHubConfig());

  // Navegação
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modais de Movimentação (Entrada e Saída)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('ENTRADA');
  const [selectedArticleForMovement, setSelectedArticleForMovement] = useState<Artigo | null>(null);

  // Modal de Persistência / Sincronização
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Toast de feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Salva no armazenamento persistente a cada alteração
  const handleUpdateDatabase = (
    updaterOrNewDb: InventoryDatabase | ((prev: InventoryDatabase) => InventoryDatabase)
  ) => {
    setDb((prevDb) => {
      const nextDb = typeof updaterOrNewDb === 'function' ? updaterOrNewDb(prevDb) : updaterOrNewDb;
      saveDatabase(nextDb);
      return nextDb;
    });
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Abrir modal de Entrada
  const handleOpenEntry = (article?: Artigo | null) => {
    setMovementType('ENTRADA');
    setSelectedArticleForMovement(article || null);
    setIsMovementModalOpen(true);
  };

  // Abrir modal de Saída
  const handleOpenExit = (article?: Artigo | null) => {
    setMovementType('SAIDA');
    setSelectedArticleForMovement(article || null);
    setIsMovementModalOpen(true);
  };

  // Executar movimentação de estoque
  const handleMovementSubmit = (movement: StockMovement, updatedArticle: Artigo) => {
    handleUpdateDatabase((prev) => {
      // Atualiza o artigo no array
      const newArticles = prev.articles.map((a) =>
        a.id === updatedArticle.id ? updatedArticle : a
      );
      // Registra a movimentação no Kardex
      const newMovements = [movement, ...prev.movements];

      return {
        ...prev,
        articles: newArticles,
        movements: newMovements,
      };
    });

    const isEntry = movement.type === 'ENTRADA';
    showToast(
      `${isEntry ? 'Entrada' : 'Saída'} de ${movement.quantity} ${updatedArticle.unit} de "${updatedArticle.name}" registrada com sucesso!`,
      'success'
    );
  };

  // Atualizar artigo isoladamente (ex: localização ou dados)
  const handleUpdateArticle = (updatedArticle: Artigo) => {
    handleUpdateDatabase((prev) => ({
      ...prev,
      articles: prev.articles.map((a) => (a.id === updatedArticle.id ? updatedArticle : a)),
    }));
    showToast(`Dados e localização do artigo "${updatedArticle.code}" atualizados.`, 'info');
  };

  // Carregar dados de exemplo didáticos SENAI
  const handleLoadSampleData = () => {
    const sample = createSampleSenaiDatabase();
    handleUpdateDatabase(sample);
    showToast('Base didática do SENAI-SP carregada com sucesso para testes.', 'success');
  };

  // Resetar para banco vazio
  const handleResetDb = () => {
    if (confirm('Deseja zerar o banco de dados e retornar à estrutura estritamente vazia para novos testes?')) {
      const empty = resetDatabaseToEmpty();
      handleUpdateDatabase(empty);
      showToast('Banco de dados esvaziado. Pronto para testes do usuário.', 'info');
    }
  };

  const lowStockCount = db.articles.filter((a) => a.currentStock <= a.minStock).length;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col text-neutral-900">
      {/* Toast flutuante */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-neutral-900 text-white px-4 py-3 rounded-md shadow-lg border-l-4 border-red-600 animate-in fade-in slide-in-from-top-4 duration-200 text-xs">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Cabeçalho Institucional SENAI-SP */}
      <Header
        db={db}
        gitHubConfig={gitHubConfig}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onResetDb={handleResetDb}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Barra de Menus Principais em Destaque */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'sync') {
            setIsSyncModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenEntryModal={() => handleOpenEntry()}
        onOpenExitModal={() => handleOpenExit()}
        articlesCount={db.articles.length}
        lowStockCount={lowStockCount}
      />

      {/* Conteúdo Principal Dinâmico */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            db={db}
            onNavigate={setActiveTab}
            onOpenEntryModal={() => handleOpenEntry()}
            onOpenExitModal={() => handleOpenExit()}
            onLoadSampleData={handleLoadSampleData}
            onResetDb={handleResetDb}
          />
        )}

        {activeTab === 'hierarchy' && (
          <HierarchyManager
            db={db}
            onUpdateDb={handleUpdateDatabase}
            onOpenEntryModalForArticle={(art) => handleOpenEntry(art)}
          />
        )}

        {activeTab === 'stock-overview' && (
          <StockOverview
            db={db}
            onOpenEntry={(art) => handleOpenEntry(art)}
            onOpenExit={(art) => handleOpenExit(art)}
            onUpdateArticle={handleUpdateArticle}
          />
        )}

        {activeTab === 'reports' && <ReportsView db={db} />}
      </main>

      {/* Modal de Movimentação (Entrada e Saída) */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        type={movementType}
        initialArticle={selectedArticleForMovement}
        db={db}
        onClose={() => setIsMovementModalOpen(false)}
        onSubmit={handleMovementSubmit}
      />

      {/* Modal de Sincronização / Nuvem (GitHub & Google Drive) */}
      <SyncSettingsModal
        isOpen={isSyncModalOpen}
        db={db}
        gitHubConfig={gitHubConfig}
        onClose={() => setIsSyncModalOpen(false)}
        onUpdateDb={handleUpdateDatabase}
        onUpdateGitHubConfig={(newConfig) => {
          setGitHubConfig(newConfig);
          saveGitHubConfig(newConfig);
        }}
      />

      {/* Rodapé com Responsabilidade Técnica e Identificação SENAI-SP */}
      <Footer
        articlesCount={db.articles.length}
        movementsCount={db.movements.length}
      />
    </div>
  );
}
