const fs = require('fs');

// Simple dot env parser
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim();
  }
});

const url = env.NEXT_PUBLIC_NOCODB_URL;
const token = env.NEXT_PUBLIC_NOCODB_API_TOKEN;

async function request(path, options = {}) {
  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Error ${res.status} on ${path}: ${text}`);
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return res.json();
}

async function createTable(baseId, tableName, columns) {
  console.log(`Checking table ${tableName}...`);
  const tablesData = await request(`/api/v1/db/meta/projects/${baseId}/tables`);
  const tables = tablesData.list || tablesData;
  const existingTable = tables.find(t => t.table_name === tableName || t.title === tableName);
  
  if (existingTable) {
    console.log(`Table ${tableName} already exists.`);
    return;
  }
  
  console.log(`Creating ${tableName} table...`);
  await request(`/api/v1/db/meta/projects/${baseId}/tables`, {
    method: 'POST',
    body: JSON.stringify({
      table_name: tableName,
      title: tableName,
      columns: columns
    })
  });
  console.log(`Table ${tableName} created.`);
}

async function init() {
  try {
    const basesData = await request('/api/v1/db/meta/projects');
    const bases = basesData.list || basesData;
    
    let baseId;
    if (bases && bases.length > 0) {
      const base = bases.find(b => b.title === 'keepfit') || bases[0];
      baseId = base.id;
    } else {
      console.log('No bases found. Creating keepfit...');
      const newBaseData = await request('/api/v1/db/meta/projects', {
        method: 'POST',
        body: JSON.stringify({ title: 'keepfit' })
      });
      baseId = newBaseData.id;
    }
    
    console.log('Using Base ID:', baseId);
    
    // Users Table
    await createTable(baseId, 'Users', [
      { column_name: 'tdee', title: 'tdee', uidt: 'Number' },
      { column_name: 'target_calories', title: 'target_calories', uidt: 'Number' },
      { column_name: 'target_carbs', title: 'target_carbs', uidt: 'Number' },
      { column_name: 'target_protein', title: 'target_protein', uidt: 'Number' },
      { column_name: 'target_fat', title: 'target_fat', uidt: 'Number' },
      { column_name: 'target_water', title: 'target_water', uidt: 'Number' }
    ]);

    // FoodRecords Table
    await createTable(baseId, 'FoodRecords', [
      { column_name: 'date', title: 'date', uidt: 'SingleLineText' },
      { column_name: 'mealType', title: 'mealType', uidt: 'SingleLineText' },
      { column_name: 'name', title: 'name', uidt: 'SingleLineText' },
      { column_name: 'amount', title: 'amount', uidt: 'Number' },
      { column_name: 'calories', title: 'calories', uidt: 'Number' },
      { column_name: 'carbs', title: 'carbs', uidt: 'Number' },
      { column_name: 'protein', title: 'protein', uidt: 'Number' },
      { column_name: 'fat', title: 'fat', uidt: 'Number' }
    ]);

    // WaterRecords Table
    await createTable(baseId, 'WaterRecords', [
      { column_name: 'date', title: 'date', uidt: 'SingleLineText' },
      { column_name: 'amount', title: 'amount', uidt: 'Number' }
    ]);

    // ExerciseRecords Table
    await createTable(baseId, 'ExerciseRecords', [
      { column_name: 'date', title: 'date', uidt: 'SingleLineText' },
      { column_name: 'calories', title: 'calories', uidt: 'Number' }
    ]);

    console.log('NocoDB Initialization Complete!');
  } catch (err) {
    console.error('Init NocoDB failed:', err.message);
  }
}

init();
