import axios from 'axios';

export const NOCODB_URL = process.env.NEXT_PUBLIC_NOCODB_URL || 'http://docker.home:8020';
export const NOCODB_TOKEN = process.env.NEXT_PUBLIC_NOCODB_API_TOKEN;
const NOCODB_BASE_TITLE = process.env.NEXT_PUBLIC_NOCODB_BASE_TITLE || 'keepfit';

if (!NOCODB_TOKEN) {
  // Keep this explicit so we fail fast instead of silently writing elsewhere.
  throw new Error('Missing NEXT_PUBLIC_NOCODB_API_TOKEN');
}

export const nocodb = axios.create({
  baseURL: `${NOCODB_URL}/api/v2`,
  headers: {
    'xc-token': NOCODB_TOKEN,
    'Content-Type': 'application/json',
  },
});

const nocodbMeta = axios.create({
  baseURL: `${NOCODB_URL}/api/v1/db/meta`,
  headers: {
    'xc-token': NOCODB_TOKEN,
    'Content-Type': 'application/json',
  },
});

const nocodbMetaV3 = axios.create({
  baseURL: `${NOCODB_URL}/api/v3/meta`,
  headers: {
    'xc-token': NOCODB_TOKEN,
    'Content-Type': 'application/json',
  },
});

let cachedBaseId: string | null = null;
const tableIdCache = new Map<string, string>();
const fieldIdCache = new Map<string, string>();

export async function resolveBaseIdByTitle(title = NOCODB_BASE_TITLE): Promise<string> {
  if (cachedBaseId) return cachedBaseId;

  const response = await nocodbMeta.get('/projects');
  const bases = (response.data.list ?? response.data) as Array<{ id: string; title: string }>;
  const found = bases.find((item) => item.title === title);

  if (!found) {
    throw new Error(`NocoDB base '${title}' not found. Please run: node scripts/init-nocodb.js`);
  }

  cachedBaseId = found.id;
  return found.id;
}

export async function resolveTableIdByTitle(tableTitle: string): Promise<string> {
  if (tableIdCache.has(tableTitle)) {
    return tableIdCache.get(tableTitle)!;
  }

  const baseId = await resolveBaseIdByTitle();
  const response = await nocodbMeta.get(`/projects/${baseId}/tables`);
  const tables = (response.data.list ?? response.data) as Array<{ id: string; title: string }>;
  const found = tables.find((table) => table.title === tableTitle);

  if (!found) {
    throw new Error(`NocoDB table '${tableTitle}' not found in base '${NOCODB_BASE_TITLE}'.`);
  }

  tableIdCache.set(tableTitle, found.id);
  return found.id;
}

export async function resolveFieldIdByTitle(tableTitle: string, fieldTitle: string): Promise<string> {
  const cacheKey = `${tableTitle}:${fieldTitle}`;
  if (fieldIdCache.has(cacheKey)) {
    return fieldIdCache.get(cacheKey)!;
  }

  const baseId = await resolveBaseIdByTitle();
  const tableId = await resolveTableIdByTitle(tableTitle);
  const response = await nocodbMetaV3.get(`/bases/${baseId}/tables/${tableId}`);
  const fields = (response.data.fields ?? []) as Array<{
    id: string;
    title?: string;
    column_name?: string;
  }>;

  const found = fields.find((field) => {
    const title = (field.title ?? field.column_name ?? '').toLowerCase();
    return title === fieldTitle.toLowerCase();
  });

  if (!found) {
    throw new Error(`NocoDB field '${fieldTitle}' not found in table '${tableTitle}'.`);
  }

  fieldIdCache.set(cacheKey, found.id);
  return found.id;
}
