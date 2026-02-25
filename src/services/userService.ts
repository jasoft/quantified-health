import { pocketbase } from '@/lib/pocketbase';

const COLLECTION = 'user_targets';

export interface UserTarget {
  Id?: string;
  tdee: number;
  target_calories: number;
  target_carbs: number;
  target_protein: number;
  target_fat: number;
  target_water: number;
}

interface PocketBaseListResponse<T> {
  items: T[];
}

interface PocketBaseUserTargetRecord {
  id: string;
  tdee: number;
  target_calories: number;
  target_carbs: number;
  target_protein: number;
  target_fat: number;
  target_water: number;
}

function toNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toUserTarget(record: PocketBaseUserTargetRecord): UserTarget {
  return {
    Id: record.id,
    tdee: toNumber(record.tdee),
    target_calories: toNumber(record.target_calories),
    target_carbs: toNumber(record.target_carbs),
    target_protein: toNumber(record.target_protein),
    target_fat: toNumber(record.target_fat),
    target_water: toNumber(record.target_water),
  };
}

function toUserTargetPayload(data: Partial<UserTarget>) {
  return {
    tdee: toNumber(data.tdee),
    target_calories: toNumber(data.target_calories),
    target_carbs: toNumber(data.target_carbs),
    target_protein: toNumber(data.target_protein),
    target_fat: toNumber(data.target_fat),
    target_water: toNumber(data.target_water),
  };
}

async function getFirstUserTargetRecord(): Promise<PocketBaseUserTargetRecord | null> {
  const response = await pocketbase.get<PocketBaseListResponse<PocketBaseUserTargetRecord>>(
    `/collections/${COLLECTION}/records`,
    {
      params: {
        page: 1,
        perPage: 1,
        sort: '-updated',
      },
    }
  );

  return response.data.items?.[0] ?? null;
}

export const userService = {
  getUserTarget: async () => {
    const record = await getFirstUserTargetRecord();
    return record ? toUserTarget(record) : null;
  },

  saveUserTarget: async (data: UserTarget) => {
    const payload = toUserTargetPayload(data);
    const recordId = data.Id || (await getFirstUserTargetRecord())?.id;

    if (recordId) {
      const response = await pocketbase.patch<PocketBaseUserTargetRecord>(
        `/collections/${COLLECTION}/records/${recordId}`,
        payload
      );
      return toUserTarget(response.data);
    }

    const response = await pocketbase.post<PocketBaseUserTargetRecord>(
      `/collections/${COLLECTION}/records`,
      payload
    );
    return toUserTarget(response.data);
  },
};
