import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronDown, 
  Boxes, 
  Layers, 
  Tag, 
  MapPin, 
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  Tipo, 
  Grupo, 
  Subgrupo, 
  Artigo, 
  InventoryDatabase, 
  ItemLocation 
} from '../types/inventory';
import { 
  generateNextTipoCode, 
  generateNextGrupoCode, 
  generateNextSubgrupoCode, 
  generateNextArtigoCode,
  formatFullAddress
} from '../services/codeGenerator';

interface HierarchyManagerProps {
  db: InventoryDatabase;
  onUpdateDb: (updater: (prev: InventoryDatabase) => InventoryDatabase) => void;
  onOpenEntryModalForArticle?: (article: Artigo) => void;
}

type HierarchyTab = 'tree' | 'tipos' | 'grupos' | 'subgrupos' | 'artigos';

const COMMON_UNITS = [
  { code: 'UN', label: 'Unidade (UN)' },
  { code: 'KG', label: 'Quilograma (KG)' },
  { code: 'M', label: 'Metro (M)' },
  { code: 'M2', label: 'Metro Quadrado (M²)' },
  { code: 'L', label: 'Litro (L)' },
  { code: 'ML', label: 'Mililitro (ML)' },
  { code: 'CX', label: 'Caixa (CX)' },
  { code: 'PC', label: 'Peça (PÇ)' },
  { code: 'RL', label: 'Rolo (RL)' },
  { code: 'PAR', label: 'Par (PAR)' },
  { code: 'JG', label: 'Jogo (JG)' },
];

export const HierarchyManager: React.FC<HierarchyManagerProps> = ({
  db,
  onUpdateDb,
}) => {
  const [activeTab, setActiveTab] = useState<HierarchyTab>('tree');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estados de expansão na árvore
  const [expandedTipos, setExpandedTipos] = useState<Record<string, boolean>>({});
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({});
  const [expandedSubgrupos, setExpandedSubgrupos] = useState<Record<string, boolean>>({});

  // 1. Estado para Cadastro de Tipo
  const [tipoForm, setTipoForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  // 2. Estado para Cadastro de Grupo
  const [grupoForm, setGrupoForm] = useState({
    tipoId: '',
    code: '',
    name: '',
    description: '',
  });

  // 3. Estado para Cadastro de Subgrupo
  const [subgrupoForm, setSubgrupoForm] = useState({
    tipoId: '',
    grupoId: '',
    code: '',
    name: '',
    description: '',
  });

  // 4. Estado para Cadastro de Artigo
  const [artigoForm, setArtigoForm] = useState({
    tipoId: '',
    grupoId: '',
    subgrupoId: '',
    code: '',
    name: '',
    description: '',
    unit: 'UN',
    minStock: 10,
    maxStock: 100,
    averageCost: 0,
    warehouse: 'Almoxarifado Geral SENAI',
    aisle: 'Corredor A',
    shelf: 'Prateleira 01',
    bin: 'Box 01',
    barcode: '',
  });

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Toggle na árvore
  const toggleTipo = (id: string) => {
    setExpandedTipos(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleGrupo = (id: string) => {
    setExpandedGrupos(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleSubgrupo = (id: string) => {
    setExpandedSubgrupos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Expandir tudo / Recolher tudo
  const expandAll = () => {
    const allT: Record<string, boolean> = {};
    const allG: Record<string, boolean> = {};
    const allS: Record<string, boolean> = {};
    db.types.forEach(t => allT[t.id] = true);
    db.groups.forEach(g => allG[g.id] = true);
    db.subgroups.forEach(s => allS[s.id] = true);
    setExpandedTipos(allT);
    setExpandedGrupos(allG);
    setExpandedSubgrupos(allS);
  };

  const collapseAll = () => {
    setExpandedTipos({});
    setExpandedGrupos({});
    setExpandedSubgrupos({});
  };

  // --- HANDLERS DE CRIAÇÃO ---

  // 1. Criar Tipo
  const handleCreateTipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoForm.name.trim()) {
      showFeedback('Informe o nome do Tipo.', 'error');
      return;
    }
    const autoCode = tipoForm.code.trim() || generateNextTipoCode(db.types);
    if (db.types.some(t => t.code.toUpperCase() === autoCode.toUpperCase())) {
      showFeedback(`O código ${autoCode} já está em uso para outro Tipo!`, 'error');
      return;
    }

    const newTipo: Tipo = {
      id: `tipo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: autoCode.toUpperCase(),
      name: tipoForm.name.trim(),
      description: tipoForm.description.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDb(prev => ({
      ...prev,
      types: [...prev.types, newTipo],
    }));

    setTipoForm({ code: '', name: '', description: '' });
    showFeedback(`Tipo "${newTipo.name}" (${newTipo.code}) criado com sucesso!`, 'success');
  };

  // 2. Criar Grupo
  const handleCreateGrupo = (e: React.FormEvent) => {
    e.preventDefault();
    const parentTipo = db.types.find(t => t.id === grupoForm.tipoId);
    if (!parentTipo) {
      showFeedback('Selecione o Tipo pai para o Grupo.', 'error');
      return;
    }
    if (!grupoForm.name.trim()) {
      showFeedback('Informe o nome do Grupo.', 'error');
      return;
    }

    const autoCode = grupoForm.code.trim() || generateNextGrupoCode(parentTipo, db.groups);
    if (db.groups.some(g => g.code.toUpperCase() === autoCode.toUpperCase())) {
      showFeedback(`O código ${autoCode} já está em uso para outro Grupo!`, 'error');
      return;
    }

    const newGrupo: Grupo = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipoId: parentTipo.id,
      code: autoCode.toUpperCase(),
      name: grupoForm.name.trim(),
      description: grupoForm.description.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDb(prev => ({
      ...prev,
      groups: [...prev.groups, newGrupo],
    }));

    setGrupoForm(prev => ({ ...prev, code: '', name: '', description: '' }));
    showFeedback(`Grupo "${newGrupo.name}" (${newGrupo.code}) criado com sucesso!`, 'success');
  };

  // 3. Criar Subgrupo
  const handleCreateSubgrupo = (e: React.FormEvent) => {
    e.preventDefault();
    const parentGrupo = db.groups.find(g => g.id === subgrupoForm.grupoId);
    if (!parentGrupo) {
      showFeedback('Selecione o Grupo pai para o Subgrupo.', 'error');
      return;
    }
    const parentTipo = db.types.find(t => t.id === parentGrupo.tipoId);
    if (!parentTipo) {
      showFeedback('Tipo pai inválido.', 'error');
      return;
    }
    if (!subgrupoForm.name.trim()) {
      showFeedback('Informe o nome do Subgrupo.', 'error');
      return;
    }

    const autoCode = subgrupoForm.code.trim() || generateNextSubgrupoCode(parentTipo, parentGrupo, db.subgroups);
    if (db.subgroups.some(s => s.code.toUpperCase() === autoCode.toUpperCase())) {
      showFeedback(`O código ${autoCode} já está em uso para outro Subgrupo!`, 'error');
      return;
    }

    const newSubgrupo: Subgrupo = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipoId: parentTipo.id,
      grupoId: parentGrupo.id,
      code: autoCode.toUpperCase(),
      name: subgrupoForm.name.trim(),
      description: subgrupoForm.description.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDb(prev => ({
      ...prev,
      subgroups: [...prev.subgroups, newSubgrupo],
    }));

    setSubgrupoForm(prev => ({ ...prev, code: '', name: '', description: '' }));
    showFeedback(`Subgrupo "${newSubgrupo.name}" (${newSubgrupo.code}) criado com sucesso!`, 'success');
  };

  // 4. Criar Artigo
  const handleCreateArtigo = (e: React.FormEvent) => {
    e.preventDefault();
    const parentSubgrupo = db.subgroups.find(s => s.id === artigoForm.subgrupoId);
    if (!parentSubgrupo) {
      showFeedback('Selecione o Subgrupo pai para o Artigo.', 'error');
      return;
    }
    const parentGrupo = db.groups.find(g => g.id === parentSubgrupo.grupoId);
    const parentTipo = db.types.find(t => t.id === parentSubgrupo.tipoId);
    if (!parentGrupo || !parentTipo) {
      showFeedback('Hierarquia de pais inválida.', 'error');
      return;
    }
    if (!artigoForm.name.trim()) {
      showFeedback('Informe o nome do Artigo / Material.', 'error');
      return;
    }

    const autoCode = artigoForm.code.trim() || generateNextArtigoCode(parentTipo, parentGrupo, parentSubgrupo, db.articles);
    if (db.articles.some(a => a.code.toUpperCase() === autoCode.toUpperCase())) {
      showFeedback(`O código ${autoCode} já está em uso para outro Artigo!`, 'error');
      return;
    }

    const loc: ItemLocation = {
      warehouse: artigoForm.warehouse.trim() || 'Almoxarifado Geral SENAI',
      aisle: artigoForm.aisle.trim(),
      shelf: artigoForm.shelf.trim(),
      bin: artigoForm.bin.trim(),
    };
    loc.fullAddress = formatFullAddress(loc);

    const now = new Date().toISOString();
    const newArtigo: Artigo = {
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipoId: parentTipo.id,
      grupoId: parentGrupo.id,
      subgrupoId: parentSubgrupo.id,
      code: autoCode.toUpperCase(),
      name: artigoForm.name.trim(),
      description: artigoForm.description.trim(),
      unit: artigoForm.unit || 'UN',
      currentStock: 0, // Inicia vazio para teste
      minStock: Number(artigoForm.minStock) || 0,
      maxStock: Number(artigoForm.maxStock) || 100,
      averageCost: Number(artigoForm.averageCost) || 0,
      location: loc,
      barcode: artigoForm.barcode.trim(),
      createdAt: now,
      updatedAt: now,
    };

    onUpdateDb(prev => ({
      ...prev,
      articles: [...prev.articles, newArtigo],
    }));

    // Mantém seleção hierárquica e limpa campos específicos
    setArtigoForm(prev => ({
      ...prev,
      code: '',
      name: '',
      description: '',
      barcode: '',
    }));

    showFeedback(`Artigo "${newArtigo.name}" (${newArtigo.code}) cadastrado com sucesso!`, 'success');
  };

  // --- EXCLUSÕES SEGURAS COM VALIDAÇÃO DE DEPENDÊNCIA ---

  const handleDeleteTipo = (tipo: Tipo) => {
    const hasGrupos = db.groups.some(g => g.tipoId === tipo.id);
    if (hasGrupos) {
      showFeedback(`Não é possível excluir o Tipo "${tipo.name}". Existem Grupos vinculados a ele. Exclua os grupos primeiro.`, 'error');
      return;
    }
    if (!confirm(`Deseja realmente excluir o Tipo "${tipo.name}" (${tipo.code})?`)) return;

    onUpdateDb(prev => ({
      ...prev,
      types: prev.types.filter(t => t.id !== tipo.id),
    }));
    showFeedback(`Tipo "${tipo.name}" removido com sucesso.`, 'success');
  };

  const handleDeleteGrupo = (grupo: Grupo) => {
    const hasSubgrupos = db.subgroups.some(s => s.grupoId === grupo.id);
    if (hasSubgrupos) {
      showFeedback(`Não é possível excluir o Grupo "${grupo.name}". Existem Subgrupos vinculados a ele.`, 'error');
      return;
    }
    if (!confirm(`Deseja realmente excluir o Grupo "${grupo.name}" (${grupo.code})?`)) return;

    onUpdateDb(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== grupo.id),
    }));
    showFeedback(`Grupo "${grupo.name}" removido com sucesso.`, 'success');
  };

  const handleDeleteSubgrupo = (subgrupo: Subgrupo) => {
    const hasArticles = db.articles.some(a => a.subgrupoId === subgrupo.id);
    if (hasArticles) {
      showFeedback(`Não é possível excluir o Subgrupo "${subgrupo.name}". Existem Artigos cadastrados nele.`, 'error');
      return;
    }
    if (!confirm(`Deseja realmente excluir o Subgrupo "${subgrupo.name}" (${subgrupo.code})?`)) return;

    onUpdateDb(prev => ({
      ...prev,
      subgroups: prev.subgroups.filter(s => s.id !== subgrupo.id),
    }));
    showFeedback(`Subgrupo "${subgrupo.name}" removido com sucesso.`, 'success');
  };

  const handleDeleteArtigo = (artigo: Artigo) => {
    const hasMovements = db.movements.some(m => m.articleId === artigo.id);
    if (hasMovements) {
      if (!confirm(`O artigo "${artigo.name}" possui movimentações no histórico. Excluir o artigo pode desalinhar relatórios históricos. Deseja prosseguir?`)) {
        return;
      }
    } else {
      if (!confirm(`Deseja realmente excluir o Artigo "${artigo.name}" (${artigo.code})?`)) return;
    }

    onUpdateDb(prev => ({
      ...prev,
      articles: prev.articles.filter(a => a.id !== artigo.id),
    }));
    showFeedback(`Artigo "${artigo.name}" removido.`, 'success');
  };

  // Preview de código em tempo real para os formulários
  const nextTipoCodePreview = useMemo(() => generateNextTipoCode(db.types), [db.types]);
  
  const selectedTipoForGrupo = db.types.find(t => t.id === grupoForm.tipoId);
  const nextGrupoCodePreview = useMemo(() => {
    return selectedTipoForGrupo ? generateNextGrupoCode(selectedTipoForGrupo, db.groups) : 'GRP-????';
  }, [selectedTipoForGrupo, db.groups]);

  const selectedGrupoForSub = db.groups.find(g => g.id === subgrupoForm.grupoId);
  const selectedTipoForSub = selectedGrupoForSub ? db.types.find(t => t.id === selectedGrupoForSub.tipoId) : undefined;
  const nextSubgrupoCodePreview = useMemo(() => {
    return (selectedTipoForSub && selectedGrupoForSub)
      ? generateNextSubgrupoCode(selectedTipoForSub, selectedGrupoForSub, db.subgroups)
      : 'SUB-??????';
  }, [selectedTipoForSub, selectedGrupoForSub, db.subgroups]);

  const selectedSubgrupoForArt = db.subgroups.find(s => s.id === artigoForm.subgrupoId);
  const selectedGrupoForArt = selectedSubgrupoForArt ? db.groups.find(g => g.id === selectedSubgrupoForArt.grupoId) : undefined;
  const selectedTipoForArt = selectedGrupoForArt ? db.types.find(t => t.id === selectedGrupoForArt.tipoId) : undefined;
  const nextArtigoCodePreview = useMemo(() => {
    return (selectedTipoForArt && selectedGrupoForArt && selectedSubgrupoForArt)
      ? generateNextArtigoCode(selectedTipoForArt, selectedGrupoForArt, selectedSubgrupoForArt, db.articles)
      : 'ART-?????????';
  }, [selectedTipoForArt, selectedGrupoForArt, selectedSubgrupoForArt, db.articles]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-red-50 text-red-600 rounded">
                <FolderTree className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight uppercase">
                Cadastro Hierárquico de Materiais
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Estruturação em 4 níveis obrigatórios: <strong>Tipo → Grupo → Subgrupo → Artigo</strong> com codificação automática e endereçamento logístico.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs bg-neutral-100 text-neutral-700 font-semibold px-2.5 py-1 rounded border border-neutral-300">
              Total: {db.articles.length} Artigos
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`mt-4 p-3 rounded-md flex items-center space-x-2 text-xs font-semibold ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Sub-Navegação interna */}
        <div className="flex items-center space-x-1 border-b border-neutral-200 mt-5 pt-1 overflow-x-auto">
          {[
            { id: 'tree', label: 'Árvore Hierárquica Completa', icon: FolderTree },
            { id: 'tipos', label: `1. Tipos (${db.types.length})`, icon: Layers },
            { id: 'grupos', label: `2. Grupos (${db.groups.length})`, icon: Tag },
            { id: 'subgrupos', label: `3. Subgrupos (${db.subgroups.length})`, icon: Boxes },
            { id: 'artigos', label: `4. Artigos (${db.articles.length})`, icon: Plus },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as HierarchyTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 font-bold text-xs whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  active
                    ? 'border-red-600 text-red-600 bg-red-50/50'
                    : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- ABA 1: ÁRVORE HIERÁRQUICA COMPLETA --- */}
      {activeTab === 'tree' && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">
                Navegador da Árvore de Estoque SENAI-SP
              </h3>
              <p className="text-xs text-neutral-500">
                Clique nos nós para expandir ou recolher os subníveis e visualizar os artigos catalogados.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={expandAll}
                className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 transition-colors cursor-pointer"
              >
                Expandir Tudo
              </button>
              <button
                onClick={collapseAll}
                className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 transition-colors cursor-pointer"
              >
                Recolher Tudo
              </button>
            </div>
          </div>

          {db.types.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <FolderTree className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm font-semibold text-neutral-700">Nenhuma hierarquia cadastrada ainda.</p>
              <p className="text-xs text-neutral-500 mt-1">
                Comece cadastrando um <strong>Tipo</strong> nas abas acima ou clique em "1. Tipos".
              </p>
              <button
                onClick={() => setActiveTab('tipos')}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                + Cadastrar Primeiro Tipo
              </button>
            </div>
          ) : (
            <div className="space-y-3 font-sans text-xs">
              {db.types.map((tipo) => {
                const isTipoExpanded = expandedTipos[tipo.id] ?? true;
                const gruposDoTipo = db.groups.filter(g => g.tipoId === tipo.id);

                return (
                  <div key={tipo.id} className="border border-neutral-200 rounded-md overflow-hidden bg-white">
                    {/* Linha do TIPO */}
                    <div 
                      className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-900 text-white cursor-pointer select-none"
                      onClick={() => toggleTipo(tipo.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {isTipoExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        )}
                        <span className="font-mono text-[11px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                          {tipo.code}
                        </span>
                        <span className="font-bold text-sm text-neutral-100">
                          {tipo.name}
                        </span>
                        <span className="text-neutral-400 text-[11px] hidden sm:inline">
                          ({gruposDoTipo.length} grupos)
                        </span>
                      </div>

                      <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setGrupoForm(prev => ({ ...prev, tipoId: tipo.id }));
                            setActiveTab('grupos');
                          }}
                          className="text-[11px] bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-neutral-200 cursor-pointer"
                          title="Adicionar Grupo neste Tipo"
                        >
                          + Novo Grupo
                        </button>
                        <button
                          onClick={() => handleDeleteTipo(tipo)}
                          className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 rounded cursor-pointer"
                          title="Excluir Tipo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo do Tipo (GRUPOS) */}
                    {isTipoExpanded && (
                      <div className="p-3 bg-neutral-50 space-y-2.5">
                        {gruposDoTipo.length === 0 ? (
                          <p className="text-neutral-500 italic pl-6 text-xs">
                            Nenhum grupo cadastrado neste tipo. Clique em "+ Novo Grupo".
                          </p>
                        ) : (
                          gruposDoTipo.map((grupo) => {
                            const isGrupoExpanded = expandedGrupos[grupo.id] ?? true;
                            const subgruposDoGrupo = db.subgroups.filter(s => s.grupoId === grupo.id);

                            return (
                              <div key={grupo.id} className="border border-neutral-300 rounded bg-white overflow-hidden shadow-2xs ml-4">
                                {/* Linha do GRUPO */}
                                <div 
                                  className="flex items-center justify-between px-3 py-2 bg-neutral-100 hover:bg-neutral-200 cursor-pointer select-none border-b border-neutral-200"
                                  onClick={() => toggleGrupo(grupo.id)}
                                >
                                  <div className="flex items-center space-x-2">
                                    {isGrupoExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                                    )}
                                    <span className="font-mono text-[10px] font-bold bg-neutral-800 text-white px-1.5 py-0.5 rounded">
                                      {grupo.code}
                                    </span>
                                    <span className="font-bold text-neutral-900">
                                      {grupo.name}
                                    </span>
                                    <span className="text-neutral-500 text-[10px] hidden sm:inline">
                                      ({subgruposDoGrupo.length} subgrupos)
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setSubgrupoForm(prev => ({ 
                                          ...prev, 
                                          tipoId: tipo.id, 
                                          grupoId: grupo.id 
                                        }));
                                        setActiveTab('subgrupos');
                                      }}
                                      className="text-[10px] bg-white hover:bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded text-neutral-800 font-semibold cursor-pointer"
                                      title="Adicionar Subgrupo"
                                    >
                                      + Subgrupo
                                    </button>
                                    <button
                                      onClick={() => handleDeleteGrupo(grupo)}
                                      className="p-1 hover:bg-neutral-200 text-neutral-500 hover:text-red-600 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Conteúdo do Grupo (SUBGRUPOS) */}
                                {isGrupoExpanded && (
                                  <div className="p-2.5 bg-neutral-50/50 space-y-2">
                                    {subgruposDoGrupo.length === 0 ? (
                                      <p className="text-neutral-400 italic pl-6 text-xs">
                                        Nenhum subgrupo cadastrado.
                                      </p>
                                    ) : (
                                      subgruposDoGrupo.map((subgrupo) => {
                                        const isSubExpanded = expandedSubgrupos[subgrupo.id] ?? true;
                                        const artigosDoSub = db.articles.filter(a => a.subgrupoId === subgrupo.id);

                                        return (
                                          <div key={subgrupo.id} className="border border-neutral-200 rounded bg-white overflow-hidden ml-4">
                                            {/* Linha do SUBGRUPO */}
                                            <div 
                                              className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 cursor-pointer select-none border-b border-neutral-200"
                                              onClick={() => toggleSubgrupo(subgrupo.id)}
                                            >
                                              <div className="flex items-center space-x-2">
                                                {isSubExpanded ? (
                                                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                                                ) : (
                                                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                                                )}
                                                <span className="font-mono text-[10px] font-bold bg-neutral-200 text-neutral-800 px-1 py-0.5 rounded border border-neutral-300">
                                                  {subgrupo.code}
                                                </span>
                                                <span className="font-semibold text-neutral-800">
                                                  {subgrupo.name}
                                                </span>
                                                <span className="text-neutral-500 text-[10px]">
                                                  ({artigosDoSub.length} artigos)
                                                </span>
                                              </div>

                                              <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                                                <button
                                                  onClick={() => {
                                                    setArtigoForm(prev => ({ 
                                                      ...prev, 
                                                      tipoId: tipo.id, 
                                                      grupoId: grupo.id, 
                                                      subgrupoId: subgrupo.id 
                                                    }));
                                                    setActiveTab('artigos');
                                                  }}
                                                  className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                                                  title="Cadastrar Artigo neste Subgrupo"
                                                >
                                                  + Artigo
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteSubgrupo(subgrupo)}
                                                  className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-red-600 rounded cursor-pointer"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Conteúdo do Subgrupo (ARTIGOS) */}
                                            {isSubExpanded && (
                                              <div className="p-2 space-y-1.5 bg-white">
                                                {artigosDoSub.length === 0 ? (
                                                  <p className="text-neutral-400 italic pl-6 text-[11px]">
                                                    Nenhum artigo cadastrado neste subgrupo.
                                                  </p>
                                                ) : (
                                                  artigosDoSub.map((art) => (
                                                    <div 
                                                      key={art.id} 
                                                      className="flex items-center justify-between p-2 rounded hover:bg-neutral-50 border border-neutral-100 gap-2"
                                                    >
                                                      <div className="flex items-center space-x-2 min-w-0">
                                                        <span className="font-mono text-[10px] font-extrabold bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-200">
                                                          {art.code}
                                                        </span>
                                                        <div className="min-w-0">
                                                          <p className="font-semibold text-neutral-900 truncate">
                                                            {art.name}
                                                          </p>
                                                          <p className="text-[10px] text-neutral-500 truncate flex items-center space-x-2">
                                                            <span>📍 {art.location.fullAddress || 'Sem local'}</span>
                                                            <span>• Unidade: {art.unit}</span>
                                                          </p>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center space-x-2 shrink-0">
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                          art.currentStock <= art.minStock 
                                                            ? 'bg-red-100 text-red-700' 
                                                            : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                          {art.currentStock} {art.unit}
                                                        </span>
                                                        <button
                                                          onClick={() => handleDeleteArtigo(art)}
                                                          className="p-1 text-neutral-400 hover:text-red-600 rounded cursor-pointer"
                                                          title="Excluir Artigo"
                                                        >
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- ABA 2: CADASTRO DE TIPOS --- */}
      {activeTab === 'tipos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Criação de Tipo */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full" />
              <h3 className="font-bold text-sm text-neutral-900 uppercase">
                Novo Tipo (Nível 1)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              O Tipo é o nível mais amplo da hierarquia (ex: Matéria-Prima, Ferramental, EPI, Eletroeletrônica).
            </p>

            <form onSubmit={handleCreateTipo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Código do Tipo (Automático ou Personalizado)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tipoForm.code}
                    onChange={e => setTipoForm({ ...tipoForm, code: e.target.value })}
                    placeholder={`Ex: ${nextTipoCodePreview}`}
                    className="flex-1 font-mono text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 uppercase"
                  />
                  <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-2 rounded border border-neutral-200 whitespace-nowrap">
                    Sugerido: {nextTipoCodePreview}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nome do Tipo *
                </label>
                <input
                  type="text"
                  required
                  value={tipoForm.name}
                  onChange={e => setTipoForm({ ...tipoForm, name: e.target.value })}
                  placeholder="Ex: Matéria-Prima Metálica"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Descrição / Finalidade Didática
                </label>
                <textarea
                  rows={2}
                  value={tipoForm.description}
                  onChange={e => setTipoForm({ ...tipoForm, description: e.target.value })}
                  placeholder="Ex: Materiais ferrosos e não-ferrosos destinados a oficinas de usinagem e soldagem"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
              >
                + Cadastrar Tipo
              </button>
            </form>
          </div>

          {/* Lista de Tipos Cadastrados */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
            <h3 className="font-bold text-sm text-neutral-900 mb-3">
              Tipos Cadastrados ({db.types.length})
            </h3>

            {db.types.length === 0 ? (
              <p className="text-xs text-neutral-400 py-8 text-center">Nenhum Tipo cadastrado no banco de dados.</p>
            ) : (
              <div className="divide-y divide-neutral-200">
                {db.types.map(tipo => {
                  const totalGrupos = db.groups.filter(g => g.tipoId === tipo.id).length;
                  return (
                    <div key={tipo.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black bg-neutral-900 text-white px-2 py-0.5 rounded">
                            {tipo.code}
                          </span>
                          <span className="font-bold text-sm text-neutral-900">
                            {tipo.name}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">
                            • {totalGrupos} grupos vinculados
                          </span>
                        </div>
                        {tipo.description && (
                          <p className="text-xs text-neutral-500 mt-1">{tipo.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTipo(tipo)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded cursor-pointer"
                        title="Excluir Tipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ABA 3: CADASTRO DE GRUPOS --- */}
      {activeTab === 'grupos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Grupo */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-2.5 h-2.5 bg-neutral-900 rounded-full" />
              <h3 className="font-bold text-sm text-neutral-900 uppercase">
                Novo Grupo (Nível 2)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              O Grupo categoriza o Tipo (ex: Aços Carbono, Ferramentas de Corte, Dispositivos de Manobra).
            </p>

            <form onSubmit={handleCreateGrupo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Tipo Vinculado (Pai) *
                </label>
                <select
                  required
                  value={grupoForm.tipoId}
                  onChange={e => setGrupoForm({ ...grupoForm, tipoId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                >
                  <option value="">Selecione o Tipo...</option>
                  {db.types.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Código do Grupo
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={grupoForm.code}
                    onChange={e => setGrupoForm({ ...grupoForm, code: e.target.value })}
                    placeholder={`Ex: ${nextGrupoCodePreview}`}
                    className="flex-1 font-mono text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 uppercase"
                  />
                  <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-2 rounded border border-neutral-200">
                    Sugerido: {nextGrupoCodePreview}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nome do Grupo *
                </label>
                <input
                  type="text"
                  required
                  value={grupoForm.name}
                  onChange={e => setGrupoForm({ ...grupoForm, name: e.target.value })}
                  placeholder="Ex: Aços e Ligas para Usinagem"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={grupoForm.description}
                  onChange={e => setGrupoForm({ ...grupoForm, description: e.target.value })}
                  placeholder="Descrição opcional do grupo"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-900 hover:bg-black text-white py-2.5 rounded font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
              >
                + Cadastrar Grupo
              </button>
            </form>
          </div>

          {/* Lista de Grupos */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
            <h3 className="font-bold text-sm text-neutral-900 mb-3">
              Grupos Cadastrados ({db.groups.length})
            </h3>

            {db.groups.length === 0 ? (
              <p className="text-xs text-neutral-400 py-8 text-center">Nenhum Grupo cadastrado.</p>
            ) : (
              <div className="divide-y divide-neutral-200">
                {db.groups.map(grupo => {
                  const tipoPai = db.types.find(t => t.id === grupo.tipoId);
                  const totalSub = db.subgroups.filter(s => s.grupoId === grupo.id).length;
                  return (
                    <div key={grupo.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold bg-neutral-800 text-white px-2 py-0.5 rounded">
                            {grupo.code}
                          </span>
                          <span className="font-bold text-sm text-neutral-900">
                            {grupo.name}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Pertence ao Tipo: <strong>[{tipoPai?.code}] {tipoPai?.name}</strong> • {totalSub} subgrupos
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteGrupo(grupo)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded cursor-pointer"
                        title="Excluir Grupo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ABA 4: CADASTRO DE SUBGRUPOS --- */}
      {activeTab === 'subgrupos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Subgrupo */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-2.5 h-2.5 bg-neutral-500 rounded-full" />
              <h3 className="font-bold text-sm text-neutral-900 uppercase">
                Novo Subgrupo (Nível 3)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              O Subgrupo detalha a classe do material (ex: Barras Redondas, Insertos ISO, Contatores AC-3).
            </p>

            <form onSubmit={handleCreateSubgrupo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Grupo Vinculado (Pai) *
                </label>
                <select
                  required
                  value={subgrupoForm.grupoId}
                  onChange={e => {
                    const g = db.groups.find(grp => grp.id === e.target.value);
                    setSubgrupoForm({ 
                      ...subgrupoForm, 
                      grupoId: e.target.value,
                      tipoId: g?.tipoId || ''
                    });
                  }}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                >
                  <option value="">Selecione o Grupo...</option>
                  {db.groups.map(g => {
                    const t = db.types.find(tp => tp.id === g.tipoId);
                    return (
                      <option key={g.id} value={g.id}>
                        [{g.code}] {g.name} (Tipo: {t?.name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Código do Subgrupo
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={subgrupoForm.code}
                    onChange={e => setSubgrupoForm({ ...subgrupoForm, code: e.target.value })}
                    placeholder={`Ex: ${nextSubgrupoCodePreview}`}
                    className="flex-1 font-mono text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 uppercase"
                  />
                  <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-2 rounded border border-neutral-200">
                    Sugerido: {nextSubgrupoCodePreview}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nome do Subgrupo *
                </label>
                <input
                  type="text"
                  required
                  value={subgrupoForm.name}
                  onChange={e => setSubgrupoForm({ ...subgrupoForm, name: e.target.value })}
                  placeholder="Ex: Barras Redondas Laminadas"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={subgrupoForm.description}
                  onChange={e => setSubgrupoForm({ ...subgrupoForm, description: e.target.value })}
                  placeholder="Descrição opcional do subgrupo"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-800 hover:bg-neutral-900 text-white py-2.5 rounded font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
              >
                + Cadastrar Subgrupo
              </button>
            </form>
          </div>

          {/* Lista de Subgrupos */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
            <h3 className="font-bold text-sm text-neutral-900 mb-3">
              Subgrupos Cadastrados ({db.subgroups.length})
            </h3>

            {db.subgroups.length === 0 ? (
              <p className="text-xs text-neutral-400 py-8 text-center">Nenhum Subgrupo cadastrado.</p>
            ) : (
              <div className="divide-y divide-neutral-200">
                {db.subgroups.map(sub => {
                  const grp = db.groups.find(g => g.id === sub.grupoId);
                  const totalArt = db.articles.filter(a => a.subgrupoId === sub.id).length;
                  return (
                    <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded border border-neutral-300">
                            {sub.code}
                          </span>
                          <span className="font-bold text-sm text-neutral-900">
                            {sub.name}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Grupo: <strong>[{grp?.code}] {grp?.name}</strong> • {totalArt} artigos
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteSubgrupo(sub)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded cursor-pointer"
                        title="Excluir Subgrupo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ABA 5: CADASTRO DE ARTIGOS (MATERIAL) --- */}
      {activeTab === 'artigos' && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-2xs">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-3 h-3 bg-red-600 rounded-sm" />
            <h3 className="font-black text-sm text-neutral-900 uppercase">
              Novo Artigo / Material (Nível 4 - Item Físico)
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mb-6">
            Cadastre a especificação técnica do material, vinculada à hierarquia, com sua unidade de medida e localização física de armazenamento.
          </p>

          <form onSubmit={handleCreateArtigo} className="space-y-6">
            {/* Seção 1: Hierarquia e Identificação */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-4">
              <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FolderTree className="w-4 h-4 text-red-600" />
                <span>1. Vínculo Hierárquico</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Subgrupo Pai *
                  </label>
                  <select
                    required
                    value={artigoForm.subgrupoId}
                    onChange={e => {
                      const s = db.subgroups.find(sub => sub.id === e.target.value);
                      setArtigoForm({
                        ...artigoForm,
                        subgrupoId: e.target.value,
                        grupoId: s?.grupoId || '',
                        tipoId: s?.tipoId || ''
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                  >
                    <option value="">Selecione o Subgrupo correspondente...</option>
                    {db.subgroups.map(s => {
                      const g = db.groups.find(grp => grp.id === s.grupoId);
                      const t = db.types.find(tp => tp.id === s.tipoId);
                      return (
                        <option key={s.id} value={s.id}>
                          [{s.code}] {s.name} — ({t?.name} &gt; {g?.name})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Código do Artigo (Geração Automática Única)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={artigoForm.code}
                      onChange={e => setArtigoForm({ ...artigoForm, code: e.target.value })}
                      placeholder={`Ex: ${nextArtigoCodePreview}`}
                      className="flex-1 font-mono text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 uppercase"
                    />
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-2 rounded">
                      Auto: {nextArtigoCodePreview}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Especificação Técnica do Artigo */}
            <div className="p-4 bg-white rounded-lg border border-neutral-200 space-y-4">
              <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-neutral-800" />
                <span>2. Especificação do Material</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Nome / Descrição Resumida do Artigo *
                  </label>
                  <input
                    type="text"
                    required
                    value={artigoForm.name}
                    onChange={e => setArtigoForm({ ...artigoForm, name: e.target.value })}
                    placeholder="Ex: Barra Redonda Aço SAE 1045 Ø 50mm x 3000mm"
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    value={artigoForm.unit}
                    onChange={e => setArtigoForm({ ...artigoForm, unit: e.target.value })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                  >
                    {COMMON_UNITS.map(u => (
                      <option key={u.code} value={u.code}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={artigoForm.minStock}
                    onChange={e => setArtigoForm({ ...artigoForm, minStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Estoque Máximo (Capacidade)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={artigoForm.maxStock}
                    onChange={e => setArtigoForm({ ...artigoForm, maxStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Custo Médio Referencial (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={artigoForm.averageCost}
                    onChange={e => setArtigoForm({ ...artigoForm, averageCost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Especificação Técnica Detalhada / Aplicação Didática
                </label>
                <textarea
                  rows={2}
                  value={artigoForm.description}
                  onChange={e => setArtigoForm({ ...artigoForm, description: e.target.value })}
                  placeholder="Ex: Indicado para fabricação de eixos nos tornos mecânicos das oficinas de mecânica de usinagem"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Seção 3: Endereçamento e Localização Física de Armazenamento */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-4">
              <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>3. Localização Física de Armazenamento (Logística)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Galpão / Almoxarifado *
                  </label>
                  <input
                    type="text"
                    required
                    value={artigoForm.warehouse}
                    onChange={e => setArtigoForm({ ...artigoForm, warehouse: e.target.value })}
                    placeholder="Ex: Almoxarifado Central"
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Corredor / Rua
                  </label>
                  <input
                    type="text"
                    value={artigoForm.aisle}
                    onChange={e => setArtigoForm({ ...artigoForm, aisle: e.target.value })}
                    placeholder="Ex: Corredor B-02"
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Prateleira / Rack
                  </label>
                  <input
                    type="text"
                    value={artigoForm.shelf}
                    onChange={e => setArtigoForm({ ...artigoForm, shelf: e.target.value })}
                    placeholder="Ex: Prateleira 03"
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Escaninho / Gaveta / Box
                  </label>
                  <input
                    type="text"
                    value={artigoForm.bin}
                    onChange={e => setArtigoForm({ ...artigoForm, bin: e.target.value })}
                    placeholder="Ex: Box 14"
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-neutral-200/60 rounded text-neutral-700 text-xs font-medium flex items-center space-x-2">
                <span className="font-bold">Endereço Composto:</span>
                <span>{artigoForm.warehouse} • {artigoForm.aisle || '—'} • {artigoForm.shelf || '—'} • {artigoForm.bin || '—'}</span>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all active:scale-95"
              >
                + Concluir Cadastro do Artigo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
