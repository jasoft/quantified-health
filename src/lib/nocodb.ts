import axios from 'axios';

const NOCODB_URL = process.env.NEXT_PUBLIC_NOCODB_URL || 'http://docker.home:8020';
const NOCODB_TOKEN = process.env.NEXT_PUBLIC_NOCODB_API_TOKEN;

export const nocodb = axios.create({
  baseURL: `${NOCODB_URL}/api/v1/db/meta/projects/keepfit/tables`, // Note: Assuming a project named keepfit or we will need to create it. We will use the meta API to create tables first if needed, or v2 for data. Let's start with a generic axios instance.
  headers: {
    'xc-token': NOCODB_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Create a generic nocodb instance for meta operations (creating tables/projects)
export const nocodbMeta = axios.create({
  baseURL: `${NOCODB_URL}/api/v1/db/meta`,
  headers: {
    'xc-token': NOCODB_TOKEN,
    'Content-Type': 'application/json'
  }
});
