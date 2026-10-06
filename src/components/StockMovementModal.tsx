import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Search, 
  AlertTriangle, 
  Package, 
  MapPin, 
  FileText, 
  Building, 
  Calendar, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import { 
  Artigo, 
  InventoryDatabase, 
  MovementType, 
  StockMovement, 
  ItemLocation 
} from '../types/inventory';
import { formatFullAddress } from '../services/codeGenerator';

interface StockMovementModalProps {
  isOpen: boolean;
  type: MovementType;
  initialArticle?: Artigo | null;
  db: InventoryDatabase;
  onClose: () => void;
  onSubmit: (movement: StockMovement, updatedArticle: Artigo) => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  type,
  initialArticle,
  db,
  onClose,
  onSubmit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [partnerOrDepartment, setPartnerOrDepartment] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('Almoxarife SENAI-SP');
  const [movementDate, setMovementDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState<string>('');

  // Localização customizável para entrada
  const [warehouse, setWarehouse] = useState('');
  const [aisle, setAisle] = useState('');
  const [shelf, setShelf] = useState('');
  const [bin, setBin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializa com artigo pré-selecionado se houver
  useEffect(() => {
    if (initialArticle) {
      setSelectedArticleId(initialArticle.id);
      setUnitCost(initialArticle.averageCost || 0);
      setWarehouse(initialArticle.location.warehouse || '');
      setAisle(initialArticle.location.aisle || '');
      setShelf(initialArticle.location.shelf || '');
      setBin(initialArticle.location.bin || '');
    } else {
      setSelectedArticleId('');
      setQuantity(1);
      setUnitCost(0);
      setDocumentNumber('');
      setPartnerOrDepartment('');
      setNotes('');
    }
    setErrorMsg(null);
  }, [initialArticle, isOpen]);

  // Artigo atualmente selecionado
  const selectedArticle = useMemo(() => {
    return db.articles.find(a => a.id === selectedArticleId) || null;
  }, [selectedArticleId, db.articles]);

  // Atualiza custos e endereços quando o usuário muda a seleção
  const handleSelectArticle = (art: Artigo) => {
    setSelectedArticleId(art.id);
    setUnitCost(art.averageCost || 0);
    setWarehouse(art.location.warehouse || '');
    setAisle(art.location.aisle || '');
    setShelf(art.location.shelf || '');
    setBin(art.location.bin || '');
    setErrorMsg(null);
  };

  // Artigos filtrados para a busca rápida
  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return db.articles.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return db.articles.filter(
      a => a.name.toLowerCase().includes(term) ||
           a.code.toLowerCase().includes(term) ||
           (a.barcode && a.barcode.toLowerCase().includes(term))
    );
  }, [searchTerm, db.articles]);

  if (!isOpen) return null;

  const isEntry = type === 'ENTRADA';
  const currentStock = selectedArticle ? selectedArticle.currentStock : 0;
  const newCalculatedStock = isEntry ? currentStock + quantity : currentStock - quantity;
  const totalCost = (quantity || 0) * (unitCost || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedArticle) {
      setErrorMsg('Por favor, selecione um artigo para movimentar.');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }

    if (!isEntry && quantity > currentStock) {
      setErrorMsg(
        `Saldo insuficiente em estoque! Saldo atual: ${currentStock} ${selectedArticle.unit}. Quantidade solicitada: ${quantity} ${selectedArticle.unit}.`
      );
      return;
    }

    if (!partnerOrDepartment.trim()) {
      setErrorMsg(
        isEntry 
          ? 'Informe o Fornecedor ou Origem do material.' 
          : 'Informe o Setor, Solicitante ou Oficina de destino.'
      );
      return;
    }

    const loc: ItemLocation = {
      warehouse: warehouse.trim() || selectedArticle.location.warehouse,
      aisle: aisle.trim() || selectedArticle.location.aisle,
      shelf: shelf.trim() || selectedArticle.location.shelf,
      bin: bin.trim() || selectedArticle.location.bin,
    };
    loc.fullAddress = formatFullAddress(loc);

    // Novo custo médio para entrada
    let newAverageCost = selectedArticle.averageCost;
    if (isEntry && quantity > 0) {
      const valorEstoqueAnterior = currentStock * (selectedArticle.averageCost || 0);
      const valorEntrada = quantity * unitCost;
      const novoSaldo = currentStock + quantity;
      newAverageCost = novoSaldo > 0 ? (valorEstoqueAnterior + valorEntrada) / novoSaldo : unitCost;
    }

    const now = new Date().toISOString();
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      articleId: selectedArticle.id,
      articleCode: selectedArticle.code,
      articleName: selectedArticle.name,
      type,
      quantity,
      previousStock: currentStock,
      newStock: newCalculatedStock,
      unitCost: isEntry ? unitCost : selectedArticle.averageCost,
      totalCost: isEntry ? totalCost : quantity * selectedArticle.averageCost,
      documentNumber: documentNumber.trim(),
      partnerOrDepartment: partnerOrDepartment.trim(),
      location: loc,
      responsible: responsible.trim() || 'Almoxarife SENAI',
      date: new Date(movementDate).toISOString(),
      notes: notes.trim(),
      createdAt: now,
    };

    const updatedArticle: Artigo = {
      ...selectedArticle,
      currentStock: newCalculatedStock,
      averageCost: newAverageCost,
      location: loc,
      updatedAt: now,
    };

    onSubmit(movement, updatedArticle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-neutral-300 overflow-hidden my-6">
        {/* Cabeçalho do Modal */}
        <div className={`px-5 py-4 flex items-center justify-between text-white ${
          isEntry ? 'bg-neutral-900 border-b-2 border-emerald-500' : 'bg-red-600 border-b-2 border-neutral-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            {isEntry ? (
              <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <ArrowUpCircle className="w-5 h-5 text-white" />
            )}
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">
                {isEntry ? 'Registrar Entrada de Material' : 'Registrar Saída de Material'}
              </h3>
              <p className="text-[11px] text-neutral-300 font-medium">
                {isEntry 
                  ? 'Entrada com Nota Fiscal, fornecedor e atualização de endereço'
                  : 'Requisição interna de material com baixa de saldo imediata'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seleção do Artigo */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
              Selecionar Artigo / Material *
            </label>

            {!selectedArticle ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Digite o código (ex: ART-01...) ou nome do material para buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                    autoFocus
                  />
                </div>

                <div className="border border-neutral-200 rounded-md max-h-40 overflow-y-auto divide-y divide-neutral-100 bg-neutral-50 text-xs">
                  {filteredArticles.length === 0 ? (
                    <div className="p-3 text-center text-neutral-400">
                      Nenhum artigo encontrado com o termo "{searchTerm}".
                    </div>
                  ) : (
                    filteredArticles.map(art => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => handleSelectArticle(art)}
                        className="w-full text-left p-2.5 hover:bg-neutral-100 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono text-[10px] font-bold bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded mr-2">
                            {art.code}
                          </span>
                          <span className="font-semibold text-neutral-900 truncate">
                            {art.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-neutral-600 shrink-0">
                          Saldo: {art.currentStock} {art.unit}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black bg-neutral-900 text-white px-2 py-0.5 rounded">
                      {selectedArticle.code}
                    </span>
                    <span className="font-bold text-sm text-neutral-900 truncate">
                      {selectedArticle.name}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Endereço atual: <strong>{selectedArticle.location.fullAddress || 'Não alocado'}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-500 block">Saldo Atual</span>
                    <span className="text-base font-black text-neutral-900">
                      {selectedArticle.currentStock} {selectedArticle.unit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedArticleId('')}
                    className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Trocar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quantidade e Simulação de Saldo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Quantidade {isEntry ? 'a Entrar' : 'a Retirar'} * {selectedArticle && `(${selectedArticle.unit})`}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full text-sm font-bold p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
              />
            </div>

            {/* Painel de Transição de Saldo */}
            <div className="p-2.5 bg-neutral-100 rounded border border-neutral-200 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">
                Previsão de Saldo Após Movimento
              </span>
              <div className="flex items-center space-x-2 text-sm font-black mt-1">
                <span className="text-neutral-600">{currentStock}</span>
                <span className={isEntry ? 'text-emerald-600' : 'text-red-600'}>
                  {isEntry ? `+ ${quantity}` : `- ${quantity}`}
                </span>
                <span className="text-neutral-400">=</span>
                <span className={`text-base ${
                  newCalculatedStock < 0 
                    ? 'text-red-600' 
                    : isEntry 
                      ? 'text-emerald-700' 
                      : 'text-neutral-900'
                }`}>
                  {newCalculatedStock} {selectedArticle?.unit || 'UN'}
                </span>
              </div>
            </div>
          </div>

          {/* Dados Financeiros e Documentais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                {isEntry ? 'Nº da Nota Fiscal / Pedido' : 'Nº da Requisição / O.S.'}
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={isEntry ? "Ex: NF-e 004812" : "Ex: REQ-2026/041"}
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                {isEntry ? 'Fornecedor / Origem *' : 'Oficina / Setor / Solicitante *'}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder={
                    isEntry 
                      ? "Ex: Gerdau Aços S.A." 
                      : "Ex: Oficina de Tornearia (Prof. Roberto - Turma MEC-3A)"
                  }
                  value={partnerOrDepartment}
                  onChange={e => setPartnerOrDepartment(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>
          </div>

          {/* Custos (Específico de Entrada) */}
          {isEntry && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-neutral-50 rounded border border-neutral-200">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Custo Unitário da Entrada (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Valor Total do Lote (R$)
                </label>
                <div className="text-sm font-black text-neutral-900 p-2 bg-white rounded border border-neutral-200">
                  {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>
          )}

          {/* Localização de Armazenamento */}
          <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-2">
            <span className="text-xs font-bold text-neutral-700 uppercase flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>Endereço de Armazenagem do Lote</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-neutral-500 block mb-0.5">Galpão</span>
                <input
                  type="text"
                  value={warehouse}
                  onChange={e => setWarehouse(e.target.value)}
                  placeholder="Galpão Central"
                  className="w-full p-1.5 border border-neutral-300 rounded bg-white text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block mb-0.5">Corredor</span>
                <input
                  type="text"
                  value={aisle}
                  onChange={e => setAisle(e.target.value)}
                  placeholder="Corredor A"
                  className="w-full p-1.5 border border-neutral-300 rounded bg-white text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block mb-0.5">Prateleira</span>
                <input
                  type="text"
                  value={shelf}
                  onChange={e => setShelf(e.target.value)}
                  placeholder="Prat. 02"
                  className="w-full p-1.5 border border-neutral-300 rounded bg-white text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block mb-0.5">Escaninho</span>
                <input
                  type="text"
                  value={bin}
                  onChange={e => setBin(e.target.value)}
                  placeholder="Box 05"
                  className="w-full p-1.5 border border-neutral-300 rounded bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Responsável e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Responsável Técnico / Almoxarife *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Data e Horário *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="datetime-local"
                  required
                  value={movementDate}
                  onChange={e => setMovementDate(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
              Observações / Finalidade da Aula ou Ordem
            </label>
            <input
              type="text"
              placeholder="Ex: Utilizado para usinagem de rosca métrica na aula prática de tornearia"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-600"
            />
          </div>

          {/* Botões do Rodapé do Modal */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-extrabold text-white uppercase tracking-wider rounded shadow-md cursor-pointer transition-all active:scale-95 ${
                isEntry ? 'bg-neutral-900 hover:bg-black' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isEntry ? 'Confirmar Entrada (+)' : 'Confirmar Saída (-)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
