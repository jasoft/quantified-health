import { buildPocketBaseFileUrl, escapePocketBaseFilterValue, pocketbase } from '@/lib/pocketbase';

const FOOD_COLLECTION = 'food_records';
const FOOD_LIBRARY_COLLECTION = 'food_library';
const WATER_COLLECTION = 'water_records';
const EXERCISE_COLLECTION = 'exercise_records';
const WEIGHT_COLLECTION = 'weight_records';

type RecordId = string;

interface PocketBaseListResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

interface PocketBaseBaseRecord {
  id: string;
}

interface PocketBaseFoodRecord extends PocketBaseBaseRecord {
  date: string;
  mealType: string;
  name: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface PocketBaseWaterRecord extends PocketBaseBaseRecord {
  date: string;
  amount: number;
}

interface PocketBaseExerciseRecord extends PocketBaseBaseRecord {
  date: string;
  calories: number;
}

interface PocketBaseFoodLibraryRecord extends PocketBaseBaseRecord {
  name: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  unit?: string;
  category?: string;
  source?: string;
}

interface PocketBaseWeightRecord extends PocketBaseBaseRecord {
  date: string;
  weight?: number;
  photo?: string | string[] | null;
}

export interface FoodRecord {
  Id?: RecordId;
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
  Id?: RecordId;
  date: string;
  amount: number;
}

export interface FoodLibraryItem {
  Id?: RecordId;
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
  Id?: RecordId;
  date: string;
  calories: number;
}

export interface RecordAttachment {
  title?: string;
  url?: string;
  path?: string;
  signedPath?: string;
}

export interface WeightRecord {
  Id?: RecordId;
  date: string;
  weight?: number;
  photo?: RecordAttachment[];
}

function toNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function normalizePhotoNames(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function toFoodRecord(item: PocketBaseFoodRecord): FoodRecord {
  return {
    Id: item.id,
    date: toStringValue(item.date),
    mealType: toStringValue(item.mealType),
    name: toStringValue(item.name),
    amount: toNumber(item.amount),
    calories: toNumber(item.calories),
    carbs: toNumber(item.carbs),
    protein: toNumber(item.protein),
    fat: toNumber(item.fat),
  };
}

function toFoodLibraryItem(item: PocketBaseFoodLibraryRecord): FoodLibraryItem {
  return {
    Id: item.id,
    name: toStringValue(item.name),
    calories: toNumber(item.calories),
    carbs: toNumber(item.carbs),
    protein: toNumber(item.protein),
    fat: toNumber(item.fat),
    unit: item.unit ? toStringValue(item.unit) : undefined,
    category: item.category ? toStringValue(item.category) : undefined,
    source: item.source ? toStringValue(item.source) : undefined,
  };
}

function toWaterRecord(item: PocketBaseWaterRecord): WaterRecord {
  return {
    Id: item.id,
    date: toStringValue(item.date),
    amount: toNumber(item.amount),
  };
}

function toExerciseRecord(item: PocketBaseExerciseRecord): ExerciseRecord {
  return {
    Id: item.id,
    date: toStringValue(item.date),
    calories: toNumber(item.calories),
  };
}

function toWeightRecord(item: PocketBaseWeightRecord): WeightRecord {
  const photos = normalizePhotoNames(item.photo);
  return {
    Id: item.id,
    date: toStringValue(item.date),
    weight: item.weight == null ? undefined : toNumber(item.weight),
    photo: photos.map((name) => ({
      title: name,
      url: buildPocketBaseFileUrl(WEIGHT_COLLECTION, item.id, name),
    })),
  };
}

function getRecordId(record: { Id?: RecordId } | RecordId): RecordId {
  if (typeof record === 'string') {
    return record;
  }
  if (record.Id) {
    return record.Id;
  }
  throw new Error('Missing record Id');
}

function toFoodPayload(data: FoodRecord) {
  return {
    date: toStringValue(data.date),
    mealType: toStringValue(data.mealType),
    name: toStringValue(data.name),
    amount: toNumber(data.amount),
    calories: toNumber(data.calories),
    carbs: toNumber(data.carbs),
    protein: toNumber(data.protein),
    fat: toNumber(data.fat),
  };
}

function toWaterPayload(data: WaterRecord) {
  return {
    date: toStringValue(data.date),
    amount: toNumber(data.amount),
  };
}

function toExercisePayload(data: ExerciseRecord) {
  return {
    date: toStringValue(data.date),
    calories: toNumber(data.calories),
  };
}

function toWeightPayload(data: WeightRecord) {
  const payload: Record<string, unknown> = {
    date: toStringValue(data.date),
  };

  if (data.weight != null && Number.isFinite(Number(data.weight))) {
    payload.weight = toNumber(data.weight);
  }

  return payload;
}

async function listAllRecords<T>(collection: string, params: Record<string, string | number> = {}) {
  const perPage = 200;
  let page = 1;
  const all: T[] = [];

  while (true) {
    const response = await pocketbase.get<PocketBaseListResponse<T>>(`/collections/${collection}/records`, {
      params: {
        ...params,
        page,
        perPage,
      },
    });

    const items = response.data.items ?? [];
    all.push(...items);

    const totalPages = response.data.totalPages ?? 1;
    if (page >= totalPages || items.length === 0) {
      break;
    }

    page += 1;
  }

  return all;
}

export const recordService = {
  getFoodLibraryItems: async () => {
    const list = await listAllRecords<PocketBaseFoodLibraryRecord>(FOOD_LIBRARY_COLLECTION, {
      sort: 'name',
    });

    return list.map(toFoodLibraryItem);
  },

  getFoodRecordsByDate: async (date: string) => {
    const response = await pocketbase.get<PocketBaseListResponse<PocketBaseFoodRecord>>(
      `/collections/${FOOD_COLLECTION}/records`,
      {
        params: {
          page: 1,
          perPage: 200,
          filter: `date = "${escapePocketBaseFilterValue(date)}"`,
          sort: '-created',
        },
      }
    );

    return (response.data.items ?? []).map(toFoodRecord);
  },

  addFoodRecord: async (data: FoodRecord) => {
    const response = await pocketbase.post<PocketBaseFoodRecord>(
      `/collections/${FOOD_COLLECTION}/records`,
      toFoodPayload(data)
    );

    return toFoodRecord(response.data);
  },

  updateFoodRecord: async (data: FoodRecord) => {
    const recordId = getRecordId(data);
    const response = await pocketbase.patch<PocketBaseFoodRecord>(
      `/collections/${FOOD_COLLECTION}/records/${recordId}`,
      toFoodPayload(data)
    );

    return toFoodRecord(response.data);
  },

  deleteFoodRecord: async (recordId: RecordId) => {
    return pocketbase.delete(`/collections/${FOOD_COLLECTION}/records/${recordId}`);
  },

  getWaterRecordsByDate: async (date: string) => {
    const response = await pocketbase.get<PocketBaseListResponse<PocketBaseWaterRecord>>(
      `/collections/${WATER_COLLECTION}/records`,
      {
        params: {
          page: 1,
          perPage: 200,
          filter: `date = "${escapePocketBaseFilterValue(date)}"`,
          sort: '-created',
        },
      }
    );

    return (response.data.items ?? []).map(toWaterRecord);
  },

  addWaterRecord: async (data: WaterRecord) => {
    const response = await pocketbase.post<PocketBaseWaterRecord>(
      `/collections/${WATER_COLLECTION}/records`,
      toWaterPayload(data)
    );

    return toWaterRecord(response.data);
  },

  getExerciseRecordsByDate: async (date: string) => {
    const response = await pocketbase.get<PocketBaseListResponse<PocketBaseExerciseRecord>>(
      `/collections/${EXERCISE_COLLECTION}/records`,
      {
        params: {
          page: 1,
          perPage: 200,
          filter: `date = "${escapePocketBaseFilterValue(date)}"`,
          sort: '-created',
        },
      }
    );

    return (response.data.items ?? []).map(toExerciseRecord);
  },

  addExerciseRecord: async (data: ExerciseRecord) => {
    const response = await pocketbase.post<PocketBaseExerciseRecord>(
      `/collections/${EXERCISE_COLLECTION}/records`,
      toExercisePayload(data)
    );

    return toExerciseRecord(response.data);
  },

  getWeightRecords: async () => {
    const items = await listAllRecords<PocketBaseWeightRecord>(WEIGHT_COLLECTION, {
      sort: '-date',
    });

    return items.map(toWeightRecord);
  },

  getWeightRecordByDate: async (date: string) => {
    const response = await pocketbase.get<PocketBaseListResponse<PocketBaseWeightRecord>>(
      `/collections/${WEIGHT_COLLECTION}/records`,
      {
        params: {
          page: 1,
          perPage: 1,
          filter: `date = "${escapePocketBaseFilterValue(date)}"`,
          sort: '-updated',
        },
      }
    );

    const item = response.data.items?.[0];
    return item ? toWeightRecord(item) : null;
  },

  addWeightRecord: async (data: WeightRecord) => {
    const response = await pocketbase.post<PocketBaseWeightRecord>(
      `/collections/${WEIGHT_COLLECTION}/records`,
      toWeightPayload(data)
    );

    return toWeightRecord(response.data);
  },

  upsertWeightRecord: async (data: WeightRecord) => {
    const existing = await recordService.getWeightRecordByDate(data.date);

    if (existing?.Id) {
      await pocketbase.patch(
        `/collections/${WEIGHT_COLLECTION}/records/${existing.Id}`,
        toWeightPayload(data)
      );
      return recordService.getWeightRecordByDate(data.date);
    }

    await pocketbase.post(`/collections/${WEIGHT_COLLECTION}/records`, toWeightPayload(data));
    return recordService.getWeightRecordByDate(data.date);
  },

  clearWeightPhoto: async (date: string) => {
    const existing = await recordService.getWeightRecordByDate(date);
    if (!existing?.Id) return null;

    await pocketbase.patch(`/collections/${WEIGHT_COLLECTION}/records/${existing.Id}`, {
      photo: [],
    });

    return recordService.getWeightRecordByDate(date);
  },

  uploadWeightPhoto: async (date: string, file: File) => {
    const upserted = await recordService.upsertWeightRecord({ date });
    if (!upserted?.Id) {
      throw new Error('Failed to create weight record before photo upload');
    }

    await recordService.clearWeightPhoto(date);

    const formData = new FormData();
    formData.append('photo', file);

    await pocketbase.patch(
      `/collections/${WEIGHT_COLLECTION}/records/${upserted.Id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return recordService.getWeightRecordByDate(date);
  },
};
