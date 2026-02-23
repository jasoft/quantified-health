import { create } from 'zustand';
import { userService, UserTarget } from '@/services/userService';

interface UserState {
  target: UserTarget | null;
  isLoading: boolean;
  error: string | null;
  fetchTarget: () => Promise<void>;
  updateTarget: (target: Partial<UserTarget>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  target: null,
  isLoading: false,
  error: null,
  fetchTarget: async () => {
    set({ isLoading: true, error: null });
    try {
      const target = await userService.getUserTarget();
      set({ target, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch user targets', isLoading: false });
    }
  },
  updateTarget: async (updates) => {
    const currentTarget = get().target;
    // Default values if no target exists yet
    const newTarget: UserTarget = {
      tdee: 2000,
      target_calories: 2000,
      target_carbs: 250,
      target_protein: 150,
      target_fat: 55,
      target_water: 2000,
      ...(currentTarget || {}),
      ...updates
    };
    
    set({ isLoading: true, error: null });
    try {
      await userService.saveUserTarget(newTarget);
      // Re-fetch to get the assigned ID if it was a new record
      const savedTarget = await userService.getUserTarget();
      set({ target: savedTarget || newTarget, isLoading: false });
    } catch {
      set({ error: 'Failed to update user targets', isLoading: false });
    }
  }
}));
