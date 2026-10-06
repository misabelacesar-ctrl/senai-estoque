import { Tipo, Grupo, Subgrupo, Artigo } from '../types/inventory';

/**
 * Utilitários para geração automática de códigos únicos e estruturados
 * para a hierarquia do inventário:
 * Tipo: TIP-01
 * Grupo: GRP-0101
 * Subgrupo: SUB-010101
 * Artigo: ART-010101001
 */

export function extractNumericSuffix(code: string): number {
  const match = code.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

export function generateNextTipoCode(existingTipos: Tipo[]): string {
  let maxSeq = 0;
  for (const t of existingTipos) {
    const clean = t.code.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }
  const nextNum = maxSeq + 1;
  const pad = String(nextNum).padStart(2, '0');
  const codeCandidate = `TIP-${pad}`;

  // Garantir unicidade
  if (existingTipos.some(t => t.code.toUpperCase() === codeCandidate.toUpperCase())) {
    return `TIP-${String(Date.now() % 1000).padStart(3, '0')}`;
  }
  return codeCandidate;
}

export function generateNextGrupoCode(tipo: Tipo, existingGrupos: Grupo[]): string {
  // Extrai número do tipo, ex: TIP-01 -> 01
  const tipoDigits = tipo.code.replace(/[^0-9]/g, '').slice(-2) || '01';
  
  // Grupos pertencentes a este tipo
  const related = existingGrupos.filter(g => g.tipoId === tipo.id);
  let maxSeq = 0;
  
  for (const g of related) {
    const raw = g.code.replace(/[^0-9]/g, '');
    const seqDigits = raw.slice(-2);
    const num = parseInt(seqDigits, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }
  
  const nextSeq = String(maxSeq + 1).padStart(2, '0');
  const candidate = `GRP-${tipoDigits}${nextSeq}`;
  
  if (existingGrupos.some(g => g.code.toUpperCase() === candidate.toUpperCase())) {
    return `GRP-${tipoDigits}${String(related.length + 1).padStart(2, '0')}-${Date.now() % 100}`;
  }
  return candidate;
}

export function generateNextSubgrupoCode(tipo: Tipo, grupo: Grupo, existingSubgrupos: Subgrupo[]): string {
  const grupoDigits = grupo.code.replace(/[^0-9]/g, '').slice(-4) || '0101';
  
  const related = existingSubgrupos.filter(s => s.grupoId === grupo.id);
  let maxSeq = 0;
  
  for (const s of related) {
    const raw = s.code.replace(/[^0-9]/g, '');
    const seqDigits = raw.slice(-2);
    const num = parseInt(seqDigits, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }
  
  const nextSeq = String(maxSeq + 1).padStart(2, '0');
  const candidate = `SUB-${grupoDigits}${nextSeq}`;
  
  if (existingSubgrupos.some(s => s.code.toUpperCase() === candidate.toUpperCase())) {
    return `SUB-${grupoDigits}${String(related.length + 1).padStart(2, '0')}`;
  }
  return candidate;
}

export function generateNextArtigoCode(
  tipo: Tipo, 
  grupo: Grupo, 
  subgrupo: Subgrupo, 
  existingArticles: Artigo[]
): string {
  const subgrupoDigits = subgrupo.code.replace(/[^0-9]/g, '').slice(-6) || '010101';
  
  const related = existingArticles.filter(a => a.subgrupoId === subgrupo.id);
  let maxSeq = 0;
  
  for (const a of related) {
    const raw = a.code.replace(/[^0-9]/g, '');
    const seqDigits = raw.slice(-3);
    const num = parseInt(seqDigits, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }
  
  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  const candidate = `ART-${subgrupoDigits}${nextSeq}`;
  
  if (existingArticles.some(a => a.code.toUpperCase() === candidate.toUpperCase())) {
    return `ART-${subgrupoDigits}${String(Date.now() % 1000).padStart(3, '0')}`;
  }
  return candidate;
}

/**
 * Formata endereço de armazenagem composto
 */
export function formatFullAddress(loc: { warehouse: string; aisle: string; shelf: string; bin: string }): string {
  const parts = [
    loc.warehouse?.trim(),
    loc.aisle?.trim(),
    loc.shelf?.trim(),
    loc.bin?.trim()
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(' • ') : 'Não alocado';
}
