/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(REPO_ROOT, '.env.local');

const NOCODB_BASE_TITLE = process.env.NEXT_PUBLIC_NOCODB_BASE_TITLE || 'keepfit';

const NOCODB_TABLE_TO_COLLECTION = [
  { table: 'Users', collection: 'user_targets' },
  { table: 'FoodLibrary', collection: 'food_library' },
  { table: 'FoodRecords', collection: 'food_records' },
  { table: 'WaterRecords', collection: 'water_records' },
  { table: 'ExerciseRecords', collection: 'exercise_records' },
  { table: 'WeightRecords', collection: 'weight_records' },
];

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const out = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }

  return out;
}

function requiredEnv(env, key) {
  const value = process.env[key] || env[key];
  if (!value) {
    throw new Error(`Missing env: ${key}`);
  }
  return value;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function compactObject(input) {
  const out = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      out[key] = value;
    }
  });
  return out;
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url}: ${typeof data === 'object' ? JSON.stringify(data) : String(data)}`);
  }

  return data;
}

async function nocodbRequest(baseUrl, token, pathname, options = {}) {
  return requestJson(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

async function resolveNocoBaseId(baseUrl, token, title) {
  const response = await nocodbRequest(baseUrl, token, '/api/v1/db/meta/projects');
  const list = response.list || response;
  const found = list.find((item) => item.title === title);

  if (!found?.id) {
    throw new Error(`NocoDB base not found: ${title}`);
  }

  return found.id;
}

async function resolveNocoTableIds(baseUrl, token, baseId) {
  const response = await nocodbRequest(baseUrl, token, `/api/v1/db/meta/projects/${baseId}/tables`);
  const list = response.list || response;
  const tableIdMap = new Map();

  for (const item of list) {
    const title = item.title || item.table_name;
    if (title && item.id) {
      tableIdMap.set(title, item.id);
    }
  }

  return tableIdMap;
}

async function listAllNocoRows(baseUrl, token, tableId) {
  const limit = 200;
  let offset = 0;
  const out = [];

  while (true) {
    const response = await nocodbRequest(
      baseUrl,
      token,
      `/api/v2/tables/${tableId}/records?limit=${limit}&offset=${offset}`
    );

    const list = response.list || [];
    out.push(...list);

    if (list.length < limit) {
      break;
    }

    offset += limit;
  }

  return out;
}

async function pbAuth(pbUrl, email, password) {
  const endpoints = [
    '/api/collections/_superusers/auth-with-password',
    '/api/admins/auth-with-password',
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(`${pbUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: email,
          password,
        }),
      });

      if (response.token) {
        return response.token;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`PocketBase auth failed: ${lastError ? lastError.message : 'unknown error'}`);
}

async function pbRequest(pbUrl, token, pathname, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const hasJsonBody = options.body && !(options.body instanceof FormData);
  if (hasJsonBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return requestJson(`${pbUrl}${pathname}`, {
    ...options,
    headers,
  });
}

async function clearPocketBaseCollection(pbUrl, token, collection) {
  const perPage = 200;
  let page = 1;
  let deleted = 0;

  while (true) {
    const response = await pbRequest(
      pbUrl,
      token,
      `/api/collections/${collection}/records?page=${page}&perPage=${perPage}&sort=-created`
    );

    const items = response.items || [];
    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      await pbRequest(pbUrl, token, `/api/collections/${collection}/records/${item.id}`, {
        method: 'DELETE',
      });
      deleted += 1;
    }

    if (items.length < perPage) {
      break;
    }
  }

  return deleted;
}

function parseNocoAttachments(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function resolveAttachmentUrl(baseUrl, attachment) {
  const raw = attachment.url || attachment.signedPath || attachment.path;
  if (!raw) return null;

  if (/^https?:\/\//.test(raw)) {
    return raw;
  }

  return `${baseUrl}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

async function buildAttachmentFile(baseUrl, token, attachment) {
  const fileUrl = resolveAttachmentUrl(baseUrl, attachment);
  if (!fileUrl) return null;

  const res = await fetch(fileUrl, {
    headers: {
      'xc-token': token,
    },
  });

  if (!res.ok) {
    throw new Error(`Download attachment failed: ${res.status} ${fileUrl}`);
  }

  const mime = attachment.mimetype || res.headers.get('content-type') || 'application/octet-stream';
  const bytes = await res.arrayBuffer();
  const fallbackName = `weight-photo-${Date.now()}`;
  const name = attachment.title || fallbackName;
  return new File([bytes], name, { type: mime });
}

function mapUsers(rows) {
  return rows.map((row) =>
    compactObject({
      tdee: optionalNumber(row.tdee),
      target_calories: optionalNumber(row.target_calories),
      target_carbs: optionalNumber(row.target_carbs),
      target_protein: optionalNumber(row.target_protein),
      target_fat: optionalNumber(row.target_fat),
      target_water: optionalNumber(row.target_water),
    })
  );
}

function mapFoodLibrary(rows) {
  return rows.map((row) =>
    compactObject({
      name: row.name ? String(row.name).trim() : '',
      calories: optionalNumber(row.calories),
      carbs: optionalNumber(row.carbs),
      protein: optionalNumber(row.protein),
      fat: optionalNumber(row.fat),
      unit: row.unit ? String(row.unit) : undefined,
      category: row.category ? String(row.category) : undefined,
      source: row.source ? String(row.source) : undefined,
    })
  ).filter((row) => row.name);
}

function mapFoodRecords(rows) {
  return rows.map((row) =>
    compactObject({
      date: row.date ? String(row.date) : '',
      mealType: row.mealType ? String(row.mealType) : '',
      name: row.name ? String(row.name) : '',
      amount: optionalNumber(row.amount),
      calories: optionalNumber(row.calories),
      carbs: optionalNumber(row.carbs),
      protein: optionalNumber(row.protein),
      fat: optionalNumber(row.fat),
    })
  ).filter((row) => row.date && row.mealType && row.name);
}

function mapWaterRecords(rows) {
  return rows.map((row) =>
    compactObject({
      date: row.date ? String(row.date) : '',
      amount: optionalNumber(row.amount),
    })
  ).filter((row) => row.date);
}

function mapExerciseRecords(rows) {
  return rows.map((row) =>
    compactObject({
      date: row.date ? String(row.date) : '',
      calories: optionalNumber(row.calories),
    })
  ).filter((row) => row.date);
}

function mapWeightRecords(rows) {
  return rows.map((row) => ({
    payload: compactObject({
      date: row.date ? String(row.date) : '',
      weight: optionalNumber(row.weight),
    }),
    attachments: parseNocoAttachments(row.photo),
  })).filter((row) => row.payload.date);
}

async function createPocketBaseRecord(pbUrl, token, collection, payload) {
  return pbRequest(pbUrl, token, `/api/collections/${collection}/records`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function uploadWeightPhoto(pbUrl, token, recordId, file) {
  const form = new FormData();
  form.append('photo', file);

  await pbRequest(pbUrl, token, `/api/collections/weight_records/records/${recordId}`, {
    method: 'PATCH',
    body: form,
  });
}

async function run() {
  const env = loadEnv(ENV_PATH);

  const nocoUrl = requiredEnv(env, 'NEXT_PUBLIC_NOCODB_URL');
  const nocoToken = requiredEnv(env, 'NEXT_PUBLIC_NOCODB_API_TOKEN');
  const pbUrl = requiredEnv(env, 'NEXT_PUBLIC_POCKETBASE_URL');

  const pbEmail = process.env.POCKETBASE_ADMIN_EMAIL
    || process.env.POCKETBASE_SUPERUSER_EMAIL
    || env.POCKETBASE_ADMIN_EMAIL
    || env.POCKETBASE_SUPERUSER_EMAIL;
  const pbPassword = process.env.POCKETBASE_ADMIN_PASSWORD
    || process.env.POCKETBASE_SUPERUSER_PASSWORD
    || env.POCKETBASE_ADMIN_PASSWORD
    || env.POCKETBASE_SUPERUSER_PASSWORD;

  if (!pbEmail || !pbPassword) {
    throw new Error('Missing PocketBase admin credentials: POCKETBASE_ADMIN_EMAIL/POCKETBASE_ADMIN_PASSWORD');
  }

  console.log('Authenticating PocketBase superuser...');
  const pbToken = await pbAuth(pbUrl, pbEmail, pbPassword);

  console.log('Resolving NocoDB base & table ids...');
  const baseId = await resolveNocoBaseId(nocoUrl, nocoToken, NOCODB_BASE_TITLE);
  const tableIdMap = await resolveNocoTableIds(nocoUrl, nocoToken, baseId);

  const summary = {
    imported: {},
    skipped: {},
    deleted: {},
    attachmentUploaded: 0,
    attachmentFailed: 0,
  };

  for (const { collection } of NOCODB_TABLE_TO_COLLECTION.slice().reverse()) {
    const deleted = await clearPocketBaseCollection(pbUrl, pbToken, collection);
    summary.deleted[collection] = deleted;
  }

  for (const { table, collection } of NOCODB_TABLE_TO_COLLECTION) {
    const tableId = tableIdMap.get(table);
    if (!tableId) {
      console.warn(`Skipping missing NocoDB table: ${table}`);
      summary.skipped[collection] = 'missing table';
      continue;
    }

    console.log(`Migrating ${table} -> ${collection}...`);
    const rows = await listAllNocoRows(nocoUrl, nocoToken, tableId);

    if (table === 'Users') {
      const mapped = mapUsers(rows);
      if (mapped.length > 0) {
        await createPocketBaseRecord(pbUrl, pbToken, collection, mapped[0]);
      }
      summary.imported[collection] = mapped.length > 0 ? 1 : 0;
      if (mapped.length > 1) {
        summary.skipped[collection] = `only first row imported from ${mapped.length} rows`;
      }
      continue;
    }

    if (table === 'FoodLibrary') {
      const mapped = mapFoodLibrary(rows);
      for (const payload of mapped) {
        await createPocketBaseRecord(pbUrl, pbToken, collection, payload);
      }
      summary.imported[collection] = mapped.length;
      continue;
    }

    if (table === 'FoodRecords') {
      const mapped = mapFoodRecords(rows);
      for (const payload of mapped) {
        await createPocketBaseRecord(pbUrl, pbToken, collection, payload);
      }
      summary.imported[collection] = mapped.length;
      continue;
    }

    if (table === 'WaterRecords') {
      const mapped = mapWaterRecords(rows);
      for (const payload of mapped) {
        await createPocketBaseRecord(pbUrl, pbToken, collection, payload);
      }
      summary.imported[collection] = mapped.length;
      continue;
    }

    if (table === 'ExerciseRecords') {
      const mapped = mapExerciseRecords(rows);
      for (const payload of mapped) {
        await createPocketBaseRecord(pbUrl, pbToken, collection, payload);
      }
      summary.imported[collection] = mapped.length;
      continue;
    }

    if (table === 'WeightRecords') {
      const mapped = mapWeightRecords(rows);
      for (const row of mapped) {
        const created = await createPocketBaseRecord(pbUrl, pbToken, collection, row.payload);

        if (row.attachments.length > 0 && created.id) {
          const first = row.attachments[0];
          try {
            const file = await buildAttachmentFile(nocoUrl, nocoToken, first);
            if (file) {
              await uploadWeightPhoto(pbUrl, pbToken, created.id, file);
              summary.attachmentUploaded += 1;
            }
          } catch (error) {
            summary.attachmentFailed += 1;
            console.warn(`Weight photo migrate failed for date=${row.payload.date}: ${error.message}`);
          }
        }
      }
      summary.imported[collection] = mapped.length;
      continue;
    }
  }

  console.log('Migration done:');
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
