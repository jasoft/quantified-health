import { NOCODB_TOKEN, NOCODB_URL, nocodb, resolveBaseIdByTitle, resolveFieldIdByTitle, resolveTableIdByTitle } from '@/lib/nocodb';

const FOOD_TABLE = 'FoodRecords';
const WATER_TABLE = 'WaterRecords';
const EXERCISE_TABLE = 'ExerciseRecords';
const WEIGHT_TABLE = 'WeightRecords';
const DAILY_TABLE = 'DailyRecords';

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

export interface ExerciseRecord {
  Id?: number;
  date: string;
  calories: number;
}

export interface WeightRecord {
  Id?: number;
  date: string;
  weight: number;
}

export interface NocoAttachment {
  id?: string;
  title?: string;
  url?: string;
  path?: string;
  mimetype?: string;
  size?: number;
}

export interface DailyRecord {
  Id?: number;
  date: string;
  photo?: NocoAttachment[];
}

export const recordService = {
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
  addWeightRecord: async (data: WeightRecord) => {
    const tableId = await resolveTableIdByTitle(WEIGHT_TABLE);
    return nocodb.post(`/tables/${tableId}/records`, [data]);
  },

  // Daily Records
  getDailyRecordByDate: async (date: string) => {
    const tableId = await resolveTableIdByTitle(DAILY_TABLE);
    const response = await nocodb.get(`/tables/${tableId}/records`, {
      params: { where: `(date,eq,${date})`, limit: 1 },
    });
    return (response.data.list?.[0] as DailyRecord | undefined) ?? null;
  },
  upsertDailyRecord: async (data: DailyRecord) => {
    const tableId = await resolveTableIdByTitle(DAILY_TABLE);
    const existing = await recordService.getDailyRecordByDate(data.date);

    if (existing?.Id) {
      await nocodb.patch(`/tables/${tableId}/records`, { Id: existing.Id, ...data });
      return recordService.getDailyRecordByDate(data.date);
    }

    await nocodb.post(`/tables/${tableId}/records`, [{ ...data }]);
    return recordService.getDailyRecordByDate(data.date);
  },
  clearDailyPhoto: async (date: string) => {
    const tableId = await resolveTableIdByTitle(DAILY_TABLE);
    const existing = await recordService.getDailyRecordByDate(date);
    if (!existing?.Id) return null;

    await nocodb.patch(`/tables/${tableId}/records`, { Id: existing.Id, photo: [] });
    return recordService.getDailyRecordByDate(date);
  },
  uploadDailyPhoto: async (date: string, file: File) => {
    if (!NOCODB_TOKEN) {
      throw new Error('Missing NEXT_PUBLIC_NOCODB_API_TOKEN');
    }

    const upserted = await recordService.upsertDailyRecord({ date, photo: [] });
    if (!upserted?.Id) {
      throw new Error('Failed to create daily record before photo upload');
    }

    // Keep latest only by clearing old attachment first.
    await recordService.clearDailyPhoto(date);

    const baseId = await resolveBaseIdByTitle();
    const tableId = await resolveTableIdByTitle(DAILY_TABLE);
    const fieldId = await resolveFieldIdByTitle(DAILY_TABLE, 'photo');
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(
      `${NOCODB_URL}/api/v3/data/${baseId}/${tableId}/records/${upserted.Id}/fields/${fieldId}/upload`,
      {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      throw new Error(`Failed to upload daily photo: ${uploadResponse.status} ${text}`);
    }

    return recordService.getDailyRecordByDate(date);
  },
};
