/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = '/Users/weiwang/Projects/keepfit';
const ENV_PATH = path.join(REPO_ROOT, 'quantified-health/.env.local');
const DATA_DIR = path.join(
  REPO_ROOT,
  '.codex/china-food-composition-data/json_data_vision_251206_Qwen2-5-VL-72B-Instruct'
);

const BASE_TITLE = 'keepfit';
const TABLE_TITLE = 'FoodLibrary';
const SOURCE = '中国食物成分表标准版（第6版）整理数据（全量）';

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\n+/).filter(Boolean);
  const env = {};
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

function parseNum(value) {
  const s = String(value ?? '').trim();
  if (!s || s === '—' || s === '-' || s === 'Tr') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseCategory(fileName) {
  const matched = fileName.match(/^merged_(.+?)-(.+)\.json$/);
  if (!matched) return fileName.replace(/\.json$/, '');
  return `${matched[1]}-${matched[2]}`;
}

function buildAllRows() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  const rows = [];
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const category = parseCategory(file);
    const arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const item of arr) {
      const name = String(item.foodName ?? '').trim();
      if (!name) continue;

      rows.push({
        name,
        calories: parseNum(item.energyKCal),
        carbs: parseNum(item.CHO),
        protein: parseNum(item.protein),
        fat: parseNum(item.fat),
        unit: '100g',
        category,
        source: SOURCE,
      });
    }
  }

  return rows;
}

async function request(baseUrl, token, pathname, options = {}) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${pathname}: ${text}`);
  }
  if (res.status === 204) return {};
  return res.json();
}

async function resolveBaseAndTable(baseUrl, token) {
  const basesData = await request(baseUrl, token, '/api/v1/db/meta/projects');
  const bases = basesData.list || basesData;
  const base = bases.find((item) => item.title === BASE_TITLE);
  if (!base) {
    throw new Error(`Base not found: ${BASE_TITLE}`);
  }

  const tablesData = await request(baseUrl, token, `/api/v1/db/meta/projects/${base.id}/tables`);
  const tables = tablesData.list || tablesData;
  let table = tables.find((item) => item.title === TABLE_TITLE || item.table_name === TABLE_TITLE);

  if (!table) {
    await request(baseUrl, token, `/api/v1/db/meta/projects/${base.id}/tables`, {
      method: 'POST',
      body: JSON.stringify({
        table_name: TABLE_TITLE,
        title: TABLE_TITLE,
        columns: [
          { column_name: 'name', title: 'name', uidt: 'SingleLineText' },
          { column_name: 'calories', title: 'calories', uidt: 'Number' },
          { column_name: 'carbs', title: 'carbs', uidt: 'Number' },
          { column_name: 'protein', title: 'protein', uidt: 'Number' },
          { column_name: 'fat', title: 'fat', uidt: 'Number' },
          { column_name: 'unit', title: 'unit', uidt: 'SingleLineText' },
          { column_name: 'category', title: 'category', uidt: 'SingleLineText' },
          { column_name: 'source', title: 'source', uidt: 'SingleLineText' },
        ],
      }),
    });

    const tablesData2 = await request(baseUrl, token, `/api/v1/db/meta/projects/${base.id}/tables`);
    const tables2 = tablesData2.list || tablesData2;
    table = tables2.find((item) => item.title === TABLE_TITLE || item.table_name === TABLE_TITLE);
  }

  if (!table) {
    throw new Error(`Table not found: ${TABLE_TITLE}`);
  }

  return { base, table };
}

async function deleteAllRows(baseUrl, token, tableId) {
  const limit = 200;
  let deleted = 0;

  while (true) {
    const response = await request(baseUrl, token, `/api/v2/tables/${tableId}/records?limit=${limit}&offset=0`);
    const list = response.list || [];
    if (list.length === 0) break;

    for (const row of list) {
      await request(baseUrl, token, `/api/v2/tables/${tableId}/records`, {
        method: 'DELETE',
        body: JSON.stringify({ Id: row.Id }),
      });
      deleted += 1;
    }
  }

  return deleted;
}

async function insertRows(baseUrl, token, tableId, rows) {
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await request(baseUrl, token, `/api/v2/tables/${tableId}/records`, {
      method: 'POST',
      body: JSON.stringify(batch),
    });
    inserted += batch.length;
  }
  return inserted;
}

async function main() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`.env.local not found: ${ENV_PATH}`);
  }
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Data directory not found: ${DATA_DIR}`);
  }

  const env = loadEnv(ENV_PATH);
  const baseUrl = env.NEXT_PUBLIC_NOCODB_URL;
  const token = env.NEXT_PUBLIC_NOCODB_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error('Missing NEXT_PUBLIC_NOCODB_URL or NEXT_PUBLIC_NOCODB_API_TOKEN');
  }

  const rows = buildAllRows();
  if (rows.length === 0) {
    throw new Error('No rows parsed from source JSON files');
  }

  const { table } = await resolveBaseAndTable(baseUrl, token);
  const deleted = await deleteAllRows(baseUrl, token, table.id);
  const inserted = await insertRows(baseUrl, token, table.id, rows);

  const verify = await request(baseUrl, token, `/api/v2/tables/${table.id}/records?limit=1`);
  const totalRows = verify.pageInfo?.totalRows ?? null;

  console.log(
    JSON.stringify(
      {
        table: TABLE_TITLE,
        sourceDir: DATA_DIR,
        parsedRows: rows.length,
        deletedRows: deleted,
        insertedRows: inserted,
        totalRows,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
