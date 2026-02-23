import { create } from 'zustand';
import { DailyRecord, FoodRecord, WeightRecord, recordService } from '@/services/recordService';

interface RecordState {
  foodRecords: FoodRecord[];
  waterIntake: Record<string, number>; // date -> ml
  exerciseCalories: Record<string, number>; // date -> calories
  weightRecords: WeightRecord[];
  dailyRecordsByDate: Record<string, DailyRecord | null>;
  isLoading: boolean;
  error: string | null;
  fetchRecordsForDate: (date: string) => Promise<void>;
  fetchDailyRecordByDate: (date: string) => Promise<void>;
  fetchWeightHistory: (days: number) => Promise<void>;
  addFoodRecord: (record: FoodRecord) => Promise<void>;
  addWater: (date: string, amount: number) => Promise<void>;
  setExercise: (date: string, calories: number) => Promise<void>;
  addWeight: (date: string, weight: number) => Promise<void>;
  saveDailyPhoto: (date: string, file: File) => Promise<void>;
  removeDailyPhoto: (date: string) => Promise<void>;
  copyMealFromPreviousDay: (mealType: string, date: string) => Promise<number>;
}

function previousDate(date: string): string {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() - 1);
  return base.toISOString().split('T')[0];
}

export const useRecordStore = create<RecordState>((set, get) => ({
  foodRecords: [],
  waterIntake: {},
  exerciseCalories: {},
  weightRecords: [],
  dailyRecordsByDate: {},
  isLoading: false,
  error: null,

  fetchRecordsForDate: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const [foods, waters, exercises] = await Promise.all([
        recordService.getFoodRecordsByDate(date),
        recordService.getWaterRecordsByDate(date),
        recordService.getExerciseRecordsByDate(date)
      ]);

      const waterTotal = waters.reduce((sum, w) => sum + Number(w.amount), 0);
      const exerciseTotal = exercises.reduce((sum, e) => sum + Number(e.calories), 0);

      set((state) => ({
        foodRecords: foods,
        waterIntake: { ...state.waterIntake, [date]: waterTotal },
        exerciseCalories: { ...state.exerciseCalories, [date]: exerciseTotal },
        isLoading: false
      }));
    } catch {
      set({ error: 'Failed to fetch records', isLoading: false });
    }
  },

  fetchWeightHistory: async (days: number) => {
    set({ isLoading: true, error: null });
    try {
      const records = await recordService.getWeightRecords();
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - (days - 1));
      const threshold = thresholdDate.toISOString().split('T')[0];

      const filtered = records
        .filter((record) => record.date >= threshold)
        .sort((a, b) => a.date.localeCompare(b.date));

      set({ weightRecords: filtered, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch weight history', isLoading: false });
    }
  },

  fetchDailyRecordByDate: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const record = await recordService.getDailyRecordByDate(date);
      set((state) => ({
        dailyRecordsByDate: { ...state.dailyRecordsByDate, [date]: record },
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to fetch daily record', isLoading: false });
    }
  },

  addFoodRecord: async (record: FoodRecord) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.addFoodRecord(record);
      await get().fetchRecordsForDate(record.date);
    } catch {
      set({ error: 'Failed to add food record', isLoading: false });
    }
  },

  addWater: async (date: string, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.addWaterRecord({ date, amount });
      await get().fetchRecordsForDate(date);
    } catch {
      set({ error: 'Failed to update water', isLoading: false });
    }
  },

  setExercise: async (date: string, calories: number) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.addExerciseRecord({ date, calories });
      await get().fetchRecordsForDate(date);
    } catch {
      set({ error: 'Failed to update exercise', isLoading: false });
    }
  },

  addWeight: async (date: string, weight: number) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.addWeightRecord({ date, weight });
      await get().fetchWeightHistory(90);
    } catch {
      set({ error: 'Failed to update weight', isLoading: false });
    }
  },

  saveDailyPhoto: async (date: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const record = await recordService.uploadDailyPhoto(date, file);
      set((state) => ({
        dailyRecordsByDate: { ...state.dailyRecordsByDate, [date]: record },
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to upload daily photo', isLoading: false });
    }
  },

  removeDailyPhoto: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const record = await recordService.clearDailyPhoto(date);
      set((state) => ({
        dailyRecordsByDate: { ...state.dailyRecordsByDate, [date]: record },
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to remove daily photo', isLoading: false });
    }
  },

  copyMealFromPreviousDay: async (mealType: string, date: string) => {
    set({ isLoading: true, error: null });
    try {
      const yesterday = previousDate(date);
      const previousFoods = await recordService.getFoodRecordsByDate(yesterday);
      const matched = previousFoods.filter((food) => food.mealType === mealType);

      if (matched.length === 0) {
        set({ isLoading: false });
        return 0;
      }

      await Promise.all(
        matched.map((item) => {
          const { Id, ...food } = item;
          void Id;
          return recordService.addFoodRecord({
            ...food,
            date,
          });
        })
      );

      await get().fetchRecordsForDate(date);
      return matched.length;
    } catch {
      set({ error: 'Failed to copy previous meal', isLoading: false });
      return 0;
    }
  }
}));
