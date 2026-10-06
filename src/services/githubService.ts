import { InventoryDatabase, GitHubConfig, GitHubVersion } from '../types/inventory';

export interface GitHubUserInfo {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

/**
 * Valida o token do GitHub e retorna informações do usuário
 */
export async function testGitHubConnection(token: string): Promise<GitHubUserInfo> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('Informe um Personal Access Token válido do GitHub.');
  }

  const res = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${cleanToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token inválido ou expirado. Verifique suas credenciais no GitHub.');
    }
    throw new Error(`Erro ao conectar ao GitHub: HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    login: data.login,
    name: data.name || data.login,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  };
}

/**
 * Sincroniza / Salva o inventário em um GitHub Gist
 */
export async function saveToGitHubGist(
  token: string,
  db: InventoryDatabase,
  existingGistId?: string
): Promise<{ gistId: string; htmlUrl: string; updatedAt: string }> {
  const cleanToken = token.trim();
  const filename = 'senai-sp-sige-inventario.json';
  const fileContent = JSON.stringify(db, null, 2);
  const now = new Date().toLocaleString('pt-BR');
  const description = `SENAI-SP SIGE | Estoque: ${db.articles.length} artigos, ${db.movements.length} movimentos | Atualizado em ${now}`;

  const payload = {
    description,
    public: false,
    files: {
      [filename]: {
        content: fileContent,
      },
    },
  };

  const isUpdate = Boolean(existingGistId && existingGistId.trim());
  const url = isUpdate 
    ? `https://api.github.com/gists/${existingGistId?.trim()}`
    : 'https://api.github.com/gists';

  const res = await fetch(url, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${cleanToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Falha ao salvar no Gist do GitHub (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    gistId: data.id,
    htmlUrl: data.html_url,
    updatedAt: data.updated_at,
  };
}

/**
 * Baixa os dados do banco a partir de um GitHub Gist
 */
export async function loadFromGitHubGist(token: string, gistId: string): Promise<InventoryDatabase> {
  const cleanToken = token.trim();
  const cleanId = gistId.trim();

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (cleanToken) {
    headers['Authorization'] = `token ${cleanToken}`;
  }

  const res = await fetch(`https://api.github.com/gists/${cleanId}`, { headers });
  if (!res.ok) {
    throw new Error(`Falha ao carregar Gist ${cleanId}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const files = data.files || {};
  const targetFile = files['senai-sp-sige-inventario.json'] || Object.values(files)[0];

  if (!targetFile || !targetFile.content) {
    throw new Error('Arquivo de inventário não encontrado neste Gist.');
  }

  const parsed = JSON.parse(targetFile.content);
  return parsed as InventoryDatabase;
}

/**
 * Obtém o histórico de versões / commits de um Gist para permitir rollback
 */
export async function getGistVersionHistory(token: string, gistId: string): Promise<GitHubVersion[]> {
  const cleanToken = token.trim();
  const cleanId = gistId.trim();
  if (!cleanId) return [];

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (cleanToken) {
    headers['Authorization'] = `token ${cleanToken}`;
  }

  const res = await fetch(`https://api.github.com/gists/${cleanId}/commits`, { headers });
  if (!res.ok) {
    return [];
  }

  const commits = await res.json();
  if (!Array.isArray(commits)) return [];

  return commits.slice(0, 10).map((c: any, index: number) => ({
    id: c.version,
    committedAt: c.committed_at,
    author: c.user?.login || 'Autor GitHub',
    description: `Versão #${commits.length - index} (${c.change_status?.total || 0} alterações)`,
    itemsCount: 0,
    movementsCount: 0,
  }));
}

/**
 * Carrega versão específica de um Gist histórico
 */
export async function loadSpecificGistVersion(token: string, gistId: string, versionSha: string): Promise<InventoryDatabase> {
  const cleanToken = token.trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (cleanToken) {
    headers['Authorization'] = `token ${cleanToken}`;
  }

  const res = await fetch(`https://api.github.com/gists/${gistId}/${versionSha}`, { headers });
  if (!res.ok) {
    throw new Error(`Não foi possível resgatar a versão ${versionSha}`);
  }

  const data = await res.json();
  const files = data.files || {};
  const targetFile = files['senai-sp-sige-inventario.json'] || Object.values(files)[0];
  if (!targetFile || !targetFile.content) {
    throw new Error('Conteúdo da versão não encontrado.');
  }

  return JSON.parse(targetFile.content) as InventoryDatabase;
}
