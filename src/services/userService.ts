import { nocodb } from '@/lib/nocodb';

// 假设 NocoDB 中表名为 'users'
const TABLE_ID = process.env.NEXT_PUBLIC_USERS_TABLE_ID || 'Users';

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
    // 获取第一个配置（假设单用户应用）
    const response = await nocodb.get(`/${TABLE_ID}/records?limit=1`);
    return response.data.list[0] || null;
  },
  saveUserTarget: async (data: UserTarget) => {
    if (data.Id) {
      return await nocodb.patch(`/${TABLE_ID}/records`, { ...data });
    }
    return await nocodb.post(`/${TABLE_ID}/records`, [data]);
  }
};
