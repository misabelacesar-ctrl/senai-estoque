import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Github, 
  HardDrive, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  History, 
  Database, 
  Sparkles, 
  Trash2, 
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import { 
  InventoryDatabase, 
  GitHubConfig, 
  GitHubVersion 
} from '../types/inventory';
import { 
  downloadBackupFile, 
  exportStockToCSV, 
  resetDatabaseToEmpty, 
  saveGitHubConfig 
} from '../services/storage';
import { 
  testGitHubConnection, 
  saveToGitHubGist, 
  loadFromGitHubGist, 
  getGistVersionHistory, 
  loadSpecificGistVersion,
  GitHubUserInfo
} from '../services/githubService';
import { createSampleSenaiDatabase } from '../services/sampleData';

interface SyncSettingsModalProps {
  isOpen: boolean;
  db: InventoryDatabase;
  gitHubConfig: GitHubConfig;
  onClose: () => void;
  onUpdateDb: (newDb: InventoryDatabase) => void;
  onUpdateGitHubConfig: (config: GitHubConfig) => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  db,
  gitHubConfig,
  onClose,
  onUpdateDb,
  onUpdateGitHubConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'github' | 'drive' | 'database'>('github');

  // Formulário do GitHub
  const [token, setToken] = useState(gitHubConfig.token || '');
  const [gistId, setGistId] = useState(gitHubConfig.gistId || '');
  const [autoSync, setAutoSync] = useState(gitHubConfig.autoSync || false);

  // Estados de feedback do GitHub
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<GitHubUserInfo | null>(null);
  const [versions, setVersions] = useState<GitHubVersion[]>([]);

  useEffect(() => {
    setToken(gitHubConfig.token || '');
    setGistId(gitHubConfig.gistId || '');
    setAutoSync(gitHubConfig.autoSync || false);
    if (gitHubConfig.token && gitHubConfig.gistId) {
      loadHistory(gitHubConfig.token, gitHubConfig.gistId);
    }
  }, [gitHubConfig, isOpen]);

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const loadHistory = async (tk: string, gid: string) => {
    try {
      const hist = await getGistVersionHistory(tk, gid);
      setVersions(hist);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  // 1. Testar Conexão com GitHub
  const handleTestConnection = async () => {
    if (!token.trim()) {
      showStatus('Informe um Personal Access Token do GitHub.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const user = await testGitHubConnection(token);
      setUserInfo(user);
      showStatus(`Conectado com sucesso como @${user.login} (${user.name})!`, 'success');
      const updatedConfig: GitHubConfig = {
        ...gitHubConfig,
        token: token.trim(),
      };
      onUpdateGitHubConfig(updatedConfig);
      saveGitHubConfig(updatedConfig);
    } catch (err: any) {
      showStatus(err.message || 'Falha ao autenticar no GitHub.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Salvar / Criar Versão no GitHub Gist
  const handleSaveToGitHub = async () => {
    if (!token.trim()) {
      showStatus('Informe seu Personal Access Token do GitHub.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await saveToGitHubGist(token, db, gistId);
      setGistId(res.gistId);
      const updatedConfig: GitHubConfig = {
        ...gitHubConfig,
        token: token.trim(),
        gistId: res.gistId,
        lastSync: new Date().toISOString(),
      };
      onUpdateGitHubConfig(updatedConfig);
      saveGitHubConfig(updatedConfig);
      showStatus(`Inventário salvo no GitHub com sucesso! Gist ID: ${res.gistId}`, 'success');
      loadHistory(token, res.gistId);
    } catch (err: any) {
      showStatus(err.message || 'Erro ao sincronizar com GitHub.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Restaurar do GitHub
  const handleLoadFromGitHub = async () => {
    if (!gistId.trim()) {
      showStatus('Informe o Gist ID para baixar o inventário.', 'error');
      return;
    }
    if (!confirm('Deseja substituir o inventário local com os dados salvos neste Gist do GitHub?')) {
      return;
    }
    setIsLoading(true);
    try {
      const loadedDb = await loadFromGitHubGist(token, gistId);
      onUpdateDb(loadedDb);
      showStatus(`Dados carregados do GitHub com sucesso! (${loadedDb.articles.length} artigos)`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Erro ao carregar do GitHub.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Restaurar versão histórica (Rollback)
  const handleRollbackVersion = async (v: GitHubVersion) => {
    if (!confirm(`Deseja restaurar a versão ${v.id.substring(0, 7)} do GitHub? Os dados atuais serão atualizados para o ponto desta versão.`)) {
      return;
    }
    setIsLoading(true);
    try {
      const historicalDb = await loadSpecificGistVersion(token, gistId, v.id);
      onUpdateDb(historicalDb);
      showStatus(`Versão ${v.id.substring(0, 7)} restaurada com sucesso!`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Falha ao restaurar versão.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Importar arquivo JSON de backup (Google Drive / Local)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as InventoryDatabase;
        if (!Array.isArray(parsed.articles) || !Array.isArray(parsed.types)) {
          throw new Error('Arquivo com formato de banco inválido.');
        }
        onUpdateDb(parsed);
        showStatus(`Backup restaurado com sucesso! (${parsed.articles.length} artigos)`, 'success');
      } catch (err: any) {
        showStatus('Erro ao ler arquivo: certifique-se de que é um JSON exportado do SIGE SENAI.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-neutral-300 overflow-hidden my-6">
        {/* Cabeçalho */}
        <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between border-b-2 border-red-600">
          <div className="flex items-center space-x-2.5">
            <Cloud className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">
                Persistência de Dados & Integrações em Nuvem
              </h3>
              <p className="text-[11px] text-neutral-300">
                Sincronização e versionamento em GitHub e backup no Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Internas */}
        <div className="flex items-center space-x-1 border-b border-neutral-200 px-5 pt-3 bg-neutral-50 text-xs">
          <button
            onClick={() => setActiveSubTab('github')}
            className={`flex items-center space-x-2 px-3 py-2 font-bold border-b-2 cursor-pointer transition-colors ${
              activeSubTab === 'github'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub (Versionamento & Nuvem)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('drive')}
            className={`flex items-center space-x-2 px-3 py-2 font-bold border-b-2 cursor-pointer transition-colors ${
              activeSubTab === 'drive'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive (Backup & Planilhas)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('database')}
            className={`flex items-center space-x-2 px-3 py-2 font-bold border-b-2 cursor-pointer transition-colors ${
              activeSubTab === 'database'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Banco de Dados Local</span>
          </button>
        </div>

        {/* Mensagem de Feedback */}
        {statusMsg && (
          <div className={`mx-5 mt-4 p-3 rounded text-xs font-semibold flex items-center space-x-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : statusMsg.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : statusMsg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 text-blue-600 animate-spin" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5 text-xs">
          {/* --- ABA GITHUB --- */}
          {activeSubTab === 'github' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-50 rounded border border-neutral-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Github className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-neutral-900">
                    Como funciona a persistência com o GitHub:
                  </span>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  Utiliza a API oficial de <strong>Gists do GitHub</strong> para armazenar o inventário criptografado em nuvem de forma privada, gerando <strong>commits versionados</strong> com histórico de auditoria e permitindo rollback de versões anteriores.
                </p>
              </div>

              {/* Token Input */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 font-mono p-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isLoading}
                    className="bg-neutral-900 hover:bg-black text-white px-3 py-2 rounded font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Gere um token com escopo <code>gist</code> em <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-red-600 underline">GitHub &gt; Settings &gt; Developer Settings</a>.
                </p>
              </div>

              {/* Gist ID */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  Gist ID (Opcional - Criado automaticamente no primeiro salvamento)
                </label>
                <input
                  type="text"
                  value={gistId}
                  onChange={e => setGistId(e.target.value)}
                  placeholder="Ex: d7a8b9c... (Deixe em branco para criar um novo Gist automaticamente)"
                  className="w-full font-mono p-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Ações de Sincronização */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={handleSaveToGitHub}
                  disabled={isLoading || !token.trim()}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Salvar Nova Versão no GitHub</span>
                </button>

                {gistId && (
                  <button
                    onClick={handleLoadFromGitHub}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-4 py-2.5 rounded font-bold border border-neutral-300 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar do GitHub</span>
                  </button>
                )}
              </div>

              {/* Histórico de Versões / Rollback */}
              {versions.length > 0 && (
                <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-neutral-900">
                    <History className="w-4 h-4 text-neutral-600" />
                    <span>Histórico de Versões Commitadas no GitHub ({versions.length})</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Você pode restaurar o estado do estoque de qualquer commit anterior:
                  </p>

                  <div className="divide-y divide-neutral-200 max-h-40 overflow-y-auto bg-white rounded border border-neutral-200">
                    {versions.map((ver) => (
                      <div key={ver.id} className="p-2 flex items-center justify-between hover:bg-neutral-50">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold bg-neutral-100 px-1.5 py-0.5 rounded">
                              {ver.id.substring(0, 7)}
                            </span>
                            <span className="font-semibold text-neutral-800 text-[11px]">
                              {ver.description}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            Commit em {new Date(ver.committedAt).toLocaleString('pt-BR')} por @{ver.author}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRollbackVersion(ver)}
                          className="text-[10px] bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-700 px-2 py-1 rounded border border-neutral-300 font-semibold cursor-pointer"
                        >
                          Restaurar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- ABA GOOGLE DRIVE --- */}
          {activeSubTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-50 rounded border border-neutral-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-neutral-900">
                    Backup e Exportação para Google Drive
                  </span>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  Exporte o arquivo completo do banco de dados (<code>.json</code>) para sincronização na sua pasta do Google Drive ou gere planilhas compatíveis com o <strong>Google Planilhas</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Exportar JSON */}
                <div className="p-4 border border-neutral-200 rounded-lg bg-white space-y-2">
                  <span className="font-bold text-neutral-900 block">
                    1. Baixar Arquivo de Backup (.json)
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Gera um arquivo de snapshot com todos os tipos, grupos, subgrupos, artigos e movimentações.
                  </p>
                  <button
                    onClick={() => downloadBackupFile(db)}
                    className="w-full flex items-center justify-center space-x-2 bg-neutral-900 hover:bg-black text-white py-2 rounded font-bold cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Baixar Backup JSON</span>
                  </button>
                </div>

                {/* Exportar Planilha */}
                <div className="p-4 border border-neutral-200 rounded-lg bg-white space-y-2">
                  <span className="font-bold text-neutral-900 block">
                    2. Planilha para Google Planilhas (.csv)
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Formato CSV UTF-8 otimizado para abrir direto no Google Drive / Google Sheets.
                  </p>
                  <button
                    onClick={() => exportStockToCSV(db)}
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar CSV Google Sheets</span>
                  </button>
                </div>
              </div>

              {/* Restaurar Arquivo */}
              <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 space-y-2">
                <span className="font-bold text-neutral-900 block">
                  3. Restaurar do Google Drive / Arquivo Local
                </span>
                <p className="text-[11px] text-neutral-500">
                  Selecione um arquivo de backup (.json) salvo previamente no seu computador ou Google Drive:
                </p>
                <label className="flex items-center justify-center space-x-2 bg-white border border-dashed border-neutral-400 hover:border-neutral-700 py-3 rounded cursor-pointer transition-colors font-semibold text-neutral-700">
                  <Upload className="w-4 h-4 text-neutral-600" />
                  <span>Selecionar Arquivo JSON de Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* --- ABA BANCO DE DADOS LOCAL --- */}
          {activeSubTab === 'database' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-50 rounded border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 block">
                  Status da Persistência Local (Navegador)
                </span>
                <p className="text-[11px] text-neutral-600">
                  Os dados são gravados de forma contínua no armazenamento local seguro, persistindo entre abas, recarregamentos e sessões.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-neutral-100 rounded">
                  <span className="block font-black text-base text-neutral-900">{db.types.length}</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Tipos</span>
                </div>
                <div className="p-3 bg-neutral-100 rounded">
                  <span className="block font-black text-base text-neutral-900">{db.groups.length}</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Grupos</span>
                </div>
                <div className="p-3 bg-neutral-100 rounded">
                  <span className="block font-black text-base text-neutral-900">{db.subgroups.length}</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Subgrupos</span>
                </div>
                <div className="p-3 bg-neutral-100 rounded">
                  <span className="block font-black text-base text-neutral-900">{db.articles.length}</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Artigos</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Deseja carregar a base didática de teste do SENAI-SP? Dados atuais serão substituídos.')) {
                        const sample = createSampleSenaiDatabase();
                        onUpdateDb(sample);
                        showStatus('Dados didáticos SENAI carregados com sucesso!', 'success');
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 bg-neutral-800 hover:bg-neutral-900 text-white px-3 py-2 rounded font-bold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Carregar Dados Didáticos SENAI (Exemplo)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('ATENÇÃO: Deseja apagar todos os dados e retornar à estrutura estritamente vazia para teste?')) {
                        const empty = resetDatabaseToEmpty();
                        onUpdateDb(empty);
                        showStatus('Banco de dados resetado para estrutura vazia.', 'info');
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded font-bold border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Banco (Zerar Tudo)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 bg-neutral-100 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-neutral-900 hover:bg-black text-white px-5 py-2 rounded font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
