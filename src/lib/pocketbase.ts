import axios from 'axios';

export const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const POCKETBASE_TOKEN = process.env.NEXT_PUBLIC_POCKETBASE_TOKEN;

export const pocketbase = axios.create({
  baseURL: `${POCKETBASE_URL}/api`,
  headers: {
    ...(POCKETBASE_TOKEN ? { Authorization: `Bearer ${POCKETBASE_TOKEN}` } : {}),
  },
});

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/%2F/g, '/');
}

export function escapePocketBaseFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function buildPocketBaseFileUrl(
  collection: string,
  recordId: string,
  fileName: string,
  thumb?: string
): string {
  const base = `${POCKETBASE_URL}/api/files/${encodePathSegment(collection)}/${encodePathSegment(recordId)}/${encodePathSegment(fileName)}`;
  return thumb ? `${base}?thumb=${encodeURIComponent(thumb)}` : base;
}
