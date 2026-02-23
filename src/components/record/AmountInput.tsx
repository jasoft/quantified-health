'use client';

import React from 'react';

interface FoodNutrition {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface AmountInputProps {
  food: FoodNutrition;
  amount: string;
  onAmountChange: (value: string) => void;
}

export function AmountInput({ food, amount, onAmountChange }: AmountInputProps) {
  const safeAmount = Number.isFinite(parseFloat(amount)) ? parseFloat(amount) : 0;
  const ratio = safeAmount / 100;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 text-center">
      <h2 className="text-2xl font-bold mb-1 text-black">{food.name}</h2>
      <p className="text-zinc-500 text-sm mb-6">{food.calories} kcal (每 100g)</p>

      <div className="flex items-center justify-center gap-4 mb-8">
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-32 text-center text-3xl font-bold border-b-2 border-blue-500 focus:outline-none bg-transparent text-black"
        />
        <span className="text-xl font-medium text-zinc-400">克 (g)</span>
      </div>

      <div className="grid grid-cols-4 gap-2 py-4 border-t border-zinc-50">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400">热量</span>
          <span className="font-bold text-zinc-800">{Math.round(food.calories * ratio)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400">碳水</span>
          <span className="font-bold text-zinc-800">{Math.round(food.carbs * ratio * 10) / 10}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400">蛋白</span>
          <span className="font-bold text-zinc-800">{Math.round(food.protein * ratio * 10) / 10}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400">脂肪</span>
          <span className="font-bold text-zinc-800">{Math.round(food.fat * ratio * 10) / 10}</span>
        </div>
      </div>
    </div>
  );
}

