import { create } from 'zustand';
import { recordService, FoodRecord } from '@/services/recordService';

interface RecordState {
  foodRecords: FoodRecord[];
  waterIntake: Record<string, number>; // date -> ml
  exerciseCalories: Record<string, number>; // date -> calories
  isLoading: boolean;
  error: string | null;
  fetchRecordsForDate: (date: string) => Promise<void>;
  addFoodRecord: (record: FoodRecord) => Promise<void>;
  addWater: (date: string, amount: number) => Promise<void>;
  setExercise: (date: string, calories: number) => Promise<void>;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  foodRecords: [],
  waterIntake: {},
  exerciseCalories: {},
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
    } catch (error) {
      set({ error: 'Failed to fetch records', isLoading: false });
    }
  },
  
  addFoodRecord: async (record: FoodRecord) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.addFoodRecord(record);
      await get().fetchRecordsForDate(record.date);
    } catch (error) {
      set({ error: 'Failed to add food record', isLoading: false });
    }
  },
  
  addWater: async (date: string, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.addWaterRecord({ date, amount });
      await get().fetchRecordsForDate(date);
    } catch (error) {
      set({ error: 'Failed to update water', isLoading: false });
    }
  },
  
  setExercise: async (date: string, calories: number) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.addExerciseRecord({ date, calories });
      await get().fetchRecordsForDate(date);
    } catch (error) {
      set({ error: 'Failed to update exercise', isLoading: false });
    }
  }
}));
