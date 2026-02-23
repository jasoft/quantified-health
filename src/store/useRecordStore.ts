import { create } from 'zustand';
import { FoodRecord, WeightRecord, recordService } from '@/services/recordService';

interface RecordState {
  foodRecords: FoodRecord[];
  waterIntake: Record<string, number>; // date -> ml
  exerciseCalories: Record<string, number>; // date -> calories
  weightRecords: WeightRecord[];
  weightRecordsByDate: Record<string, WeightRecord | null>;
  isLoading: boolean;
  error: string | null;
  fetchRecordsForDate: (date: string) => Promise<void>;
  fetchWeightRecordByDate: (date: string) => Promise<void>;
  fetchWeightHistory: (days: number) => Promise<void>;
  addFoodRecord: (record: FoodRecord) => Promise<void>;
  addWater: (date: string, amount: number) => Promise<void>;
  setExercise: (date: string, calories: number) => Promise<void>;
  addWeight: (date: string, weight: number) => Promise<void>;
  saveWeightPhoto: (date: string, file: File) => Promise<void>;
  removeWeightPhoto: (date: string) => Promise<void>;
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
  weightRecordsByDate: {},
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
        .filter((record) => record.date >= threshold && Number.isFinite(Number(record.weight)) && Number(record.weight) > 0)
        .sort((a, b) => a.date.localeCompare(b.date));

      set({ weightRecords: filtered, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch weight history', isLoading: false });
    }
  },

  fetchWeightRecordByDate: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const record = await recordService.getWeightRecordByDate(date);
      set((state) => ({
        weightRecordsByDate: { ...state.weightRecordsByDate, [date]: record },
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to fetch weight record', isLoading: false });
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
      await recordService.upsertWeightRecord({ date, weight });
      await get().fetchWeightRecordByDate(date);
      await get().fetchWeightHistory(90);
    } catch {
      set({ error: 'Failed to update weight', isLoading: false });
    }
  },

  saveWeightPhoto: async (date: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const record = await recordService.uploadWeightPhoto(date, file);
      set((state) => ({
        weightRecordsByDate: { ...state.weightRecordsByDate, [date]: record },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload weight photo';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeWeightPhoto: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const record = await recordService.clearWeightPhoto(date);
      set((state) => ({
        weightRecordsByDate: { ...state.weightRecordsByDate, [date]: record },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove weight photo';
      set({ error: message, isLoading: false });
      throw error;
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
