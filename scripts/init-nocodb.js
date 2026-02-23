const fs = require('fs');

// Simple dot env parser
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
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
    throw new Error(`Error ${res.status}: ${await res.text()}`);
  }
  return res.json();
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
      console.log('No bases found. Attempting to create one...');
      const newBaseData = await request('/api/v1/db/meta/projects', {
        method: 'POST',
        body: JSON.stringify({ title: 'keepfit' })
      });
      baseId = newBaseData.id;
    }
    
    console.log('Using Base ID:', baseId);
    
    const tablesData = await request(`/api/v1/db/meta/projects/${baseId}/tables`);
    const tables = tablesData.list || tablesData;
    const usersTable = tables.find(t => t.table_name === 'Users' || t.title === 'Users');
    
    if (usersTable) {
      console.log('Users table already exists.');
      return;
    }
    
    console.log('Creating Users table...');
    const createData = await request(`/api/v1/db/meta/projects/${baseId}/tables`, {
      method: 'POST',
      body: JSON.stringify({
        table_name: 'Users',
        title: 'Users',
        columns: [
          { column_name: 'tdee', title: 'tdee', uidt: 'Number' },
          { column_name: 'target_calories', title: 'target_calories', uidt: 'Number' },
          { column_name: 'target_carbs', title: 'target_carbs', uidt: 'Number' },
          { column_name: 'target_protein', title: 'target_protein', uidt: 'Number' },
          { column_name: 'target_fat', title: 'target_fat', uidt: 'Number' },
          { column_name: 'target_water', title: 'target_water', uidt: 'Number' }
        ]
      })
    });
    console.log('Table created:', createData.id);
  } catch (err) {
    console.error('Init NocoDB failed:', err.message);
  }
}

init();
