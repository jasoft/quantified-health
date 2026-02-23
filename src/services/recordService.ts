import { nocodb } from '@/lib/nocodb';

// Using table names as configured in init script
const FOOD_TABLE = 'FoodRecords';
const WATER_TABLE = 'WaterRecords';
const EXERCISE_TABLE = 'ExerciseRecords';

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

export const recordService = {
  // Food Records
  getFoodRecordsByDate: async (date: string) => {
    try {
      const response = await nocodb.get(\`/\${FOOD_TABLE}/records\`, {
        params: { where: \`(date,eq,\${date})\` }
      });
      return response.data.list as FoodRecord[];
    } catch (error) {
      console.error('Error fetching food records:', error);
      return [];
    }
  },
  addFoodRecord: async (data: FoodRecord) => {
    return await nocodb.post(\`/\${FOOD_TABLE}/records\`, [data]);
  },
  
  // Water Records
  getWaterRecordsByDate: async (date: string) => {
    try {
      const response = await nocodb.get(\`/\${WATER_TABLE}/records\`, {
        params: { where: \`(date,eq,\${date})\` }
      });
      return response.data.list as WaterRecord[];
    } catch (error) {
      console.error('Error fetching water records:', error);
      return [];
    }
  },
  addWaterRecord: async (data: WaterRecord) => {
    return await nocodb.post(\`/\${WATER_TABLE}/records\`, [data]);
  },

  // Exercise Records
  getExerciseRecordsByDate: async (date: string) => {
    try {
      const response = await nocodb.get(\`/\${EXERCISE_TABLE}/records\`, {
        params: { where: \`(date,eq,\${date})\` }
      });
      return response.data.list as ExerciseRecord[];
    } catch (error) {
      console.error('Error fetching exercise records:', error);
      return [];
    }
  },
  addExerciseRecord: async (data: ExerciseRecord) => {
    return await nocodb.post(\`/\${EXERCISE_TABLE}/records\`, [data]);
  }
};
