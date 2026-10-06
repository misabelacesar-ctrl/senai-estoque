import React from 'react';
import { UserCheck, ShieldCheck, Database, HardDrive, Cpu } from 'lucide-react';

interface FooterProps {
  articlesCount: number;
  movementsCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  articlesCount,
  movementsCount,
}) => {
  return (
    <footer className="bg-neutral-900 text-white border-t-2 border-red-600 mt-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-neutral-800 text-xs">
          {/* Identificação Institucional */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded tracking-wider">
                SENAI-SP
              </span>
              <span className="font-bold text-neutral-200 tracking-tight text-sm">
                SIGE • Controle de Estoques
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Serviço Nacional de Aprendizagem Industrial — São Paulo. Plataforma profissional de gestão e controle logístico de almoxarifados técnicos e laboratórios industriais.
            </p>
          </div>

          {/* Destaque Obrigatório: Responsabilidade Técnica */}
          <div className="bg-neutral-800/80 p-3.5 rounded-md border border-neutral-700/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-red-400 font-bold uppercase tracking-wider text-[11px]">
              <UserCheck className="w-4 h-4 text-red-500" />
              <span>Responsabilidade Técnica</span>
            </div>
            <p className="text-white font-bold text-sm">
              M. Isabela Cesar
            </p>
            <p className="text-neutral-300 text-[11px]">
              Engenharia de Software Full-Stack &amp; Gestão Industrial
            </p>
            <div className="pt-1 flex items-center space-x-2 text-[10px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sistema Homologado para Teste e Validação</span>
            </div>
          </div>

          {/* Status Técnico do Sistema */}
          <div className="space-y-2 text-neutral-400 text-[11px]">
            <span className="font-bold text-neutral-200 uppercase tracking-wider text-[10px] block">
              Especificações Operacionais
            </span>
            <ul className="space-y-1">
              <li className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-neutral-500" />
                <span>Base Ativa: <strong>{articlesCount}</strong> artigos | <strong>{movementsCount}</strong> movimentações</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                <span>Persistência: Armazenamento Local Seguro + GitHub / Drive</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-neutral-500" />
                <span>Hierarquia: Tipo → Grupo → Subgrupo → Artigo com código único</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha Inferior com Copyright e Data */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-2">
          <div>
            © {new Date().getFullYear()} SENAI São Paulo — Todos os direitos reservados.
          </div>
          <div className="flex items-center space-x-3 text-neutral-400">
            <span>Paleta Oficial: Branco, Vermelho (#E30613) e Preto</span>
            <span>•</span>
            <span>SIGE v1.0 Pro</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
