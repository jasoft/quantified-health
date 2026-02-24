import { NOCODB_TOKEN, NOCODB_URL, nocodb, resolveTableIdByTitle } from '@/lib/nocodb';

const FOOD_TABLE = 'FoodRecords';
const FOOD_LIBRARY_TABLE = 'FoodLibrary';
const WATER_TABLE = 'WaterRecords';
const EXERCISE_TABLE = 'ExerciseRecords';
const WEIGHT_TABLE = 'WeightRecords';

export interface FoodRecord {
  Id?: number;
  date: string;
  mealType: string;
  name: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface WaterRecord {
  Id?: number;
  date: string;
  amount: number;
}

export interface FoodLibraryItem {
  Id?: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  unit?: string;
  category?: string;
  source?: string;
}

export interface ExerciseRecord {
  Id?: number;
  date: string;
  calories: number;
}

export interface WeightRecord {
  Id?: number;
  date: string;
  weight?: number;
  photo?: NocoAttachment[];
}

export interface NocoAttachment {
  id?: string;
  title?: string;
  url?: string;
  path?: string;
  signedPath?: string;
  mimetype?: string;
  size?: number;
  thumbnails?: Record<string, { signedPath?: string }>;
}

export const recordService = {
  getFoodLibraryItems: async () => {
    const tableId = await resolveTableIdByTitle(FOOD_LIBRARY_TABLE);
    const list: FoodLibraryItem[] = [];
    const limit = 200;
    let offset = 0;

    while (true) {
      const response = await nocodb.get(`/tables/${tableId}/records`, {
        params: { limit, offset, sort: 'name' },
      });
      const page = (response.data.list ?? []) as FoodLibraryItem[];

      list.push(
        ...page.map((item) => ({
          ...item,
          calories: Number(item.calories ?? 0),
          carbs: Number(item.carbs ?? 0),
          protein: Number(item.protein ?? 0),
          fat: Number(item.fat ?? 0),
        }))
      );

      if (page.length < limit) break;
      offset += limit;
    }

    return list;
  },

  // Food Records
  getFoodRecordsByDate: async (date: string) => {
    const tableId = await resolveTableIdByTitle(FOOD_TABLE);
    const response = await nocodb.get(`/tables/${tableId}/records`, {
      params: { where: `(date,eq,${date})` },
    });
    return response.data.list as FoodRecord[];
  },
  addFoodRecord: async (data: FoodRecord) => {
    const tableId = await resolveTableIdByTitle(FOOD_TABLE);
    return nocodb.post(`/tables/${tableId}/records`, [data]);
  },

  // Water Records
  getWaterRecordsByDate: async (date: string) => {
    const tableId = await resolveTableIdByTitle(WATER_TABLE);
    const response = await nocodb.get(`/tables/${tableId}/records`, {
      params: { where: `(date,eq,${date})` },
    });
    return response.data.list as WaterRecord[];
  },
  addWaterRecord: async (data: WaterRecord) => {
    const tableId = await resolveTableIdByTitle(WATER_TABLE);
    return nocodb.post(`/tables/${tableId}/records`, [data]);
  },

  // Exercise Records
  getExerciseRecordsByDate: async (date: string) => {
    const tableId = await resolveTableIdByTitle(EXERCISE_TABLE);
    const response = await nocodb.get(`/tables/${tableId}/records`, {
      params: { where: `(date,eq,${date})` },
    });
    return response.data.list as ExerciseRecord[];
  },
  addExerciseRecord: async (data: ExerciseRecord) => {
    const tableId = await resolveTableIdByTitle(EXERCISE_TABLE);
    return nocodb.post(`/tables/${tableId}/records`, [data]);
  },

  // Weight Records
  getWeightRecords: async () => {
    const tableId = await resolveTableIdByTitle(WEIGHT_TABLE);
    const response = await nocodb.get(`/tables/${tableId}/records`, {
      params: { sort: '-date' },
    });
    return response.data.list as WeightRecord[];
  },
  getWeightRecordByDate: async (date: string) => {
    const tableId = await resolveTableIdByTitle(WEIGHT_TABLE);
    const response = await nocodb.get(`/tables/${tableId}/records`, {
      params: { where: `(date,eq,${date})`, limit: 1 },
    });
    return (response.data.list?.[0] as WeightRecord | undefined) ?? null;
  },
  addWeightRecord: async (data: WeightRecord) => {
    const tableId = await resolveTableIdByTitle(WEIGHT_TABLE);
    return nocodb.post(`/tables/${tableId}/records`, [data]);
  },
  upsertWeightRecord: async (data: WeightRecord) => {
    const tableId = await resolveTableIdByTitle(WEIGHT_TABLE);
    const existing = await recordService.getWeightRecordByDate(data.date);

    if (existing?.Id) {
      await nocodb.patch(`/tables/${tableId}/records`, { Id: existing.Id, ...data });
      return recordService.getWeightRecordByDate(data.date);
    }

    await nocodb.post(`/tables/${tableId}/records`, [{ ...data }]);
    return recordService.getWeightRecordByDate(data.date);
  },
  clearWeightPhoto: async (date: string) => {
    const tableId = await resolveTableIdByTitle(WEIGHT_TABLE);
    const existing = await recordService.getWeightRecordByDate(date);
    if (!existing?.Id) return null;

    await nocodb.patch(`/tables/${tableId}/records`, { Id: existing.Id, photo: [] });
    return recordService.getWeightRecordByDate(date);
  },
  uploadWeightPhoto: async (date: string, file: File) => {
    if (!NOCODB_TOKEN) {
      throw new Error('Missing NEXT_PUBLIC_NOCODB_API_TOKEN');
    }

    const upserted = await recordService.upsertWeightRecord({ date });
    if (!upserted?.Id) {
      throw new Error('Failed to create weight record before photo upload');
    }

    // Keep latest only by clearing old attachment first.
    await recordService.clearWeightPhoto(date);

    const tableId = await resolveTableIdByTitle(WEIGHT_TABLE);
    const formData = new FormData();
    formData.append('file', file);

    // NocoDB UI-compatible attachment flow:
    // 1) upload to storage, 2) patch attachment object array to record field.
    const storageUploadResponse = await fetch(
      `${NOCODB_URL}/api/v2/storage/upload`,
      {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData,
      }
    );

    if (!storageUploadResponse.ok) {
      const text = await storageUploadResponse.text();
      throw new Error(`Failed to upload weight photo: ${storageUploadResponse.status} ${text}`);
    }

    const attachments = (await storageUploadResponse.json()) as NocoAttachment[];
    await nocodb.patch(`/tables/${tableId}/records`, {
      Id: upserted.Id,
      photo: attachments,
    });

    return recordService.getWeightRecordByDate(date);
  },
};
