'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Copy, Loader2, Plus, Search } from 'lucide-react';
import { useRecordStore } from '@/store/useRecordStore';
import { FoodRecord } from '@/services/recordService';
import { AmountInput } from '@/components/record/AmountInput';

interface FoodItem {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  unit: string;
}

const CUSTOM_FOOD_KEY = 'qh_custom_foods';

const MOCK_FOODS: FoodItem[] = [
  { name: '鸡蛋', calories: 143, carbs: 1.1, protein: 12.6, fat: 9.5, unit: '100g' },
  { name: '鸡胸肉', calories: 165, carbs: 0, protein: 31, fat: 3.6, unit: '100g' },
  { name: '米饭', calories: 116, carbs: 25.9, protein: 2.6, fat: 0.3, unit: '100g' },
  { name: '全麦面包', calories: 247, carbs: 41, protein: 13, fat: 3.4, unit: '100g' },
  { name: '西兰花', calories: 34, carbs: 7, protein: 2.8, fat: 0.4, unit: '100g' },
  { name: '牛排', calories: 250, carbs: 0, protein: 26, fat: 15, unit: '100g' },
];

function FoodRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealType = searchParams.get('type') || 'breakfast';
  const today = new Date().toISOString().split('T')[0];

  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [amount, setAmount] = useState('100');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(CUSTOM_FOOD_KEY);
      return raw ? (JSON.parse(raw) as FoodItem[]) : [];
    } catch {
      return [];
    }
  });
  const [copyStatus, setCopyStatus] = useState('');

  const [customForm, setCustomForm] = useState({
    name: '',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
  });

  const { addFoodRecord, copyMealFromPreviousDay, isLoading } = useRecordStore();

  const allFoods = useMemo(() => [...MOCK_FOODS, ...customFoods], [customFoods]);

  const results = useMemo(() => {
    if (query.trim() === '') return allFoods;
    return allFoods.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()));
  }, [allFoods, query]);

  const handleSave = async () => {
    if (!selectedFood) return;

    const factor = parseFloat(amount) / 100;
    const record: FoodRecord = {
      date: today,
      mealType,
      name: selectedFood.name,
      amount: parseFloat(amount),
      calories: Math.round(selectedFood.calories * factor),
      carbs: Math.round(selectedFood.carbs * factor * 10) / 10,
      protein: Math.round(selectedFood.protein * factor * 10) / 10,
      fat: Math.round(selectedFood.fat * factor * 10) / 10,
    };

    await addFoodRecord(record);
    router.push('/');
  };

  const handleCreateCustomFood = () => {
    if (!customForm.name || !customForm.calories) return;

    const newFood: FoodItem = {
      name: customForm.name,
      calories: Number(customForm.calories),
      carbs: Number(customForm.carbs || 0),
      protein: Number(customForm.protein || 0),
      fat: Number(customForm.fat || 0),
      unit: '100g',
    };

    const next = [...customFoods, newFood];
    setCustomFoods(next);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CUSTOM_FOOD_KEY, JSON.stringify(next));
    }

    setSelectedFood(newFood);
    setCustomForm({ name: '', calories: '', carbs: '', protein: '', fat: '' });
    setShowCustomModal(false);
  };

  const copyYesterdayBreakfast = async () => {
    const copied = await copyMealFromPreviousDay('breakfast', today);
    if (copied > 0) {
      setCopyStatus(`已复制 ${copied} 条昨日早餐`);
    } else {
      setCopyStatus('昨日没有可复制的早餐记录');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-20">
      <header className="bg-white p-4 border-b flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} aria-label="返回"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">记录{mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : mealType === 'dinner' ? '晚餐' : '加餐'}</h1>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto w-full">
        {mealType === 'breakfast' ? (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-orange-200 bg-orange-50 rounded-xl text-sm font-semibold text-orange-700"
            onClick={() => void copyYesterdayBreakfast()}
          >
            <Copy size={16} />
            一键复制昨日早餐
          </button>
        ) : null}

        {copyStatus ? <p className="text-xs text-zinc-500 px-1">{copyStatus}</p> : null}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="搜索食物..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-black"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {!selectedFood ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">常用食物</span>
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="text-xs text-blue-600 font-bold flex items-center gap-1"
              >
                <Plus size={14} /> 自定义添加
              </button>
            </div>

            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden shadow-sm">
              {results.length > 0 ? results.map((food, index) => (
                <button
                  key={`${food.name}-${index}`}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 border-b last:border-0 border-zinc-100 transition-colors"
                  onClick={() => setSelectedFood(food)}
                >
                  <div className="text-left">
                    <p className="font-semibold text-zinc-900">{food.name}</p>
                    <p className="text-xs text-zinc-500">{food.calories} kcal / 100g</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-300" />
                </button>
              )) : (
                <div className="p-8 text-center text-zinc-400 text-sm">未找到相关食物</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <AmountInput food={selectedFood} amount={amount} onAmountChange={setAmount} />

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedFood(null)}
                className="flex-1 py-4 bg-zinc-200 text-zinc-700 font-bold rounded-xl active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isLoading}
                className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                保存记录
              </button>
            </div>
          </div>
        )}
      </main>

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-lg text-black">添加自定义食物</h3>
            <input
              placeholder="食物名称"
              className="w-full p-3 border rounded-lg text-black"
              value={customForm.name}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              placeholder="热量 (每 100g)"
              type="number"
              className="w-full p-3 border rounded-lg text-black"
              value={customForm.calories}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, calories: e.target.value }))}
            />
            <input
              placeholder="碳水 (每 100g)"
              type="number"
              className="w-full p-3 border rounded-lg text-black"
              value={customForm.carbs}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, carbs: e.target.value }))}
            />
            <input
              placeholder="蛋白质 (每 100g)"
              type="number"
              className="w-full p-3 border rounded-lg text-black"
              value={customForm.protein}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, protein: e.target.value }))}
            />
            <input
              placeholder="脂肪 (每 100g)"
              type="number"
              className="w-full p-3 border rounded-lg text-black"
              value={customForm.fat}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, fat: e.target.value }))}
            />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCustomModal(false)} className="flex-1 py-2 text-zinc-500">取消</button>
              <button
                onClick={handleCreateCustomFood}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordFoodPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <FoodRecordContent />
    </Suspense>
  );
}
