import { nocodb, resolveTableIdByTitle } from '@/lib/nocodb';

const TABLE_TITLE = 'Users';

export interface UserTarget {
  Id?: number;
  tdee: number;
  target_calories: number;
  target_carbs: number;
  target_protein: number;
  target_fat: number;
  target_water: number;
}

export const userService = {
  getUserTarget: async () => {
    const tableId = await resolveTableIdByTitle(TABLE_TITLE);
    const response = await nocodb.get(`/tables/${tableId}/records`, { params: { limit: 1 } });
    return response.data.list[0] || null;
  },
  saveUserTarget: async (data: UserTarget) => {
    const tableId = await resolveTableIdByTitle(TABLE_TITLE);

    if (data.Id) {
      return nocodb.patch(`/tables/${tableId}/records`, { ...data });
    }

    return nocodb.post(`/tables/${tableId}/records`, [data]);
  },
};
