'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDays, addWeeks, format, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';
import { Camera, ChevronLeft, ChevronRight, Coffee, Dumbbell, Moon, MoreHorizontal, Pencil, Trash2, Utensils, X } from 'lucide-react';
import { CalorieRing } from '@/components/dashboard/CalorieRing';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { WeightTrendSection } from '@/components/weight/WeightTrendSection';
import { POCKETBASE_URL } from '@/lib/pocketbase';
import { FoodRecord, RecordAttachment } from '@/services/recordService';
import { useRecordStore } from '@/store/useRecordStore';
import { useUserStore } from '@/store/useUserStore';
import { Card } from '@/components/ui/Card';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type MealType = (typeof MEAL_ORDER)[number];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};
const MEAL_TARGET_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

const MEAL_META: Record<MealType, { icon: React.ElementType; bg: string; color: string }> = {
  breakfast: { icon: Coffee, bg: 'bg-orange-50', color: 'text-orange-500' },
  lunch: { icon: Utensils, bg: 'bg-green-50', color: 'text-green-500' },
  dinner: { icon: Utensils, bg: 'bg-blue-50', color: 'text-blue-500' },
  snack: { icon: Moon, bg: 'bg-purple-50', color: 'text-purple-500' },
};

function scaleNutrient(value: number, fromAmount: number, toAmount: number): number {
  const safeFromAmount = fromAmount > 0 ? fromAmount : 0;
  if (safeFromAmount === 0) return Number(value);
  return Math.round(((Number(value) / safeFromAmount) * toAmount) * 10) / 10;
}

function resolveAttachmentUrl(photo?: RecordAttachment): string | null {
  if (!photo) return null;
  const raw = photo.url ?? photo.signedPath ?? photo.path ?? '';
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${POCKETBASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function dateLabel(date: Date): string {
  if (isToday(date)) return '今天';
  return format(date, 'M月d日');
}

export default function Home() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [openMealMenu, setOpenMealMenu] = useState<MealType | null>(null);
  const [editingMealType, setEditingMealType] = useState<MealType | null>(null);
  const [editingFood, setEditingFood] = useState<FoodRecord | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [foodActionError, setFoodActionError] = useState<string | null>(null);

  const { target, fetchTarget, isLoading: userLoading } = useUserStore();
  const {
    foodRecords,
    waterIntake,
    exerciseCalories,
    weightRecordsByDate,
    fetchRecordsForDate,
    fetchWeightRecordByDate,
    addWater,
    removeWeightPhoto,
    updateFoodRecord,
    deleteFoodRecord,
    isLoading,
    error,
  } = useRecordStore();

  useEffect(() => {
    void fetchTarget();
  }, [fetchTarget]);

  useEffect(() => {
    void fetchRecordsForDate(selectedDate);
    void fetchWeightRecordByDate(selectedDate);
  }, [fetchWeightRecordByDate, fetchRecordsForDate, selectedDate]);

  const userTarget = target || {
    target_calories: 2000,
    target_carbs: 250,
    target_protein: 150,
    target_fat: 55,
    target_water: 2000,
    tdee: 2000,
  };

  const selectedDateObj = parseISO(`${selectedDate}T00:00:00`);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const groupedMeals = useMemo(() => {
    const grouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    } as Record<MealType, FoodRecord[]>;

    for (const record of foodRecords) {
      if (record.mealType in grouped) {
        grouped[record.mealType as keyof typeof grouped].push(record);
      }
    }

    return grouped;
  }, [foodRecords]);

  const consumedCalories = foodRecords.reduce((sum, item) => sum + Number(item.calories), 0);
  const consumedCarbs = foodRecords.reduce((sum, item) => sum + Number(item.carbs), 0);
  const consumedProtein = foodRecords.reduce((sum, item) => sum + Number(item.protein), 0);
  const consumedFat = foodRecords.reduce((sum, item) => sum + Number(item.fat), 0);
  const burnedCalories = exerciseCalories[selectedDate] || 0;
  const currentWater = waterIntake[selectedDate] || 0;
  const safeWeightRecordsByDate = weightRecordsByDate ?? {};
  const dailyPhotoUrl = resolveAttachmentUrl(safeWeightRecordsByDate[selectedDate]?.photo?.[0]);

  const macroItems = [
    { label: '蛋白质', current: consumedProtein, target: userTarget.target_protein, color: 'bg-sky-400' },
    { label: '脂肪', current: consumedFat, target: userTarget.target_fat, color: 'bg-rose-400' },
    { label: '碳水化合物', current: consumedCarbs, target: userTarget.target_carbs, color: 'bg-amber-400' },
  ];

  const selectDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    setOpenMealMenu(null);
    setEditingMealType(null);
    setEditingFood(null);
    setFoodActionError(null);
  };

  const openEditModal = (food: FoodRecord) => {
    if (!food.Id) {
      setFoodActionError('该记录缺少 Id，无法修改');
      return;
    }
    setFoodActionError(null);
    setEditingFood(food);
    setEditingAmount(String(Math.round(Number(food.amount))));
    setOpenMealMenu(null);
  };

  const handleDeleteFood = async (food: FoodRecord) => {
    if (!food.Id) {
      setFoodActionError('该记录缺少 Id，无法删除');
      return;
    }
    const confirmed = window.confirm(`确认删除“${food.name}”吗？`);
    if (!confirmed) return;

    setFoodActionError(null);
    try {
      await deleteFoodRecord(food.Id, selectedDate);
    } catch {
      setFoodActionError('删除失败，请稍后重试');
    }
  };

  const handleSubmitFoodEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFood?.Id) {
      setFoodActionError('该记录缺少 Id，无法修改');
      return;
    }

    const nextAmount = Number(editingAmount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setFoodActionError('请输入大于 0 的克数');
      return;
    }

    const updatedRecord: FoodRecord = {
      ...editingFood,
      amount: nextAmount,
      calories: scaleNutrient(editingFood.calories, Number(editingFood.amount), nextAmount),
      carbs: scaleNutrient(editingFood.carbs, Number(editingFood.amount), nextAmount),
      protein: scaleNutrient(editingFood.protein, Number(editingFood.amount), nextAmount),
      fat: scaleNutrient(editingFood.fat, Number(editingFood.amount), nextAmount),
    };

    setFoodActionError(null);
    try {
      await updateFoodRecord(updatedRecord);
      setEditingFood(null);
    } catch {
      setFoodActionError('修改失败，请稍后重试');
    }
  };

  if (userLoading && !target) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-32">
      <section className="bg-sky-50 px-4 pt-6 pb-10 rounded-b-[32px] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              setWeekStart((prev) => addWeeks(prev, -1));
              selectDate(format(addWeeks(parseISO(`${selectedDate}T00:00:00`), -1), 'yyyy-MM-dd'));
            }}
            aria-label="上一周"
            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{dateLabel(selectedDateObj)}</h1>
          <button
            type="button"
            onClick={() => {
              setWeekStart((prev) => addWeeks(prev, 1));
              selectDate(format(addWeeks(parseISO(`${selectedDate}T00:00:00`), 1), 'yyyy-MM-dd'));
            }}
            aria-label="下一周"
            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const active = isSameDay(date, selectedDateObj);
            const today = isToday(date);
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => selectDate(format(date, 'yyyy-MM-dd'))}
                className={`relative h-10 w-10 mx-auto rounded-xl text-sm transition flex flex-col items-center justify-center ${
                  active ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-zinc-500 hover:text-zinc-900'
                }`}
                aria-label={`${WEEKDAY_LABELS[index]} ${format(date, 'd')}日`}
              >
                <span>{format(date, 'd')}</span>
                {today && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${active ? 'bg-blue-600' : 'bg-blue-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-1">
          <div className="text-center">
            <p className="text-sm text-zinc-600">饮食摄入</p>
            <p className="text-4xl font-semibold text-zinc-900 leading-[1.05]">{consumedCalories}</p>
          </div>
          <CalorieRing target={userTarget.target_calories} consumed={consumedCalories} burned={burnedCalories} />
          <div className="text-center">
            <p className="text-sm text-zinc-600">运动消耗</p>
            <p className="text-4xl font-semibold text-zinc-900 leading-[1.05]">{burnedCalories}</p>
          </div>
        </div>
      </section>

      <main className="px-4 py-4 space-y-6 max-w-md mx-auto w-full">
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {macroItems.map((item) => {
              const ratio = Math.min(100, (item.current / Math.max(1, item.target)) * 100);
              return (
                <div key={item.label} className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-tight">{item.label}</h3>
                  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${ratio}%` }} />
                  </div>
                  <p className="text-sm text-zinc-900 font-bold whitespace-nowrap">
                    {Math.round(item.current)} <span className="text-zinc-400 font-medium tracking-tighter">/ {Math.round(item.target)}g</span>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {MEAL_ORDER.map((mealType) => {
          const mealFoods = groupedMeals[mealType];
          const mealCalories = mealFoods.reduce((sum, item) => sum + Number(item.calories), 0);
          const mealTarget = Math.round(userTarget.target_calories * MEAL_TARGET_RATIOS[mealType]);
          const isEditingThisMeal = editingMealType === mealType;
          const meta = MEAL_META[mealType];

          return (
            <Card key={mealType} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center shadow-xs`}>
                    <meta.icon size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{MEAL_LABELS[mealType]}</h2>
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      {mealCalories} <span className="font-normal text-[10px] lowercase text-zinc-300">/ {mealTarget} kcal</span>
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    aria-label={`编辑${MEAL_LABELS[mealType]}`}
                    onClick={() => setOpenMealMenu((prev) => (prev === mealType ? null : mealType))}
                    className="h-8 w-8 rounded-full border border-zinc-200/50 text-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {openMealMenu === mealType ? (
                    <div className="absolute right-0 mt-2 min-w-32 rounded-xl border border-zinc-200 bg-white shadow-lg z-10 p-1">
                      {mealFoods.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMealType((prev) => (prev === mealType ? null : mealType));
                            setOpenMealMenu(null);
                            setFoodActionError(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                          {isEditingThisMeal ? '完成编辑' : '编辑记录'}
                        </button>
                      ) : (
                        <p className="px-3 py-2 text-xs text-zinc-400">暂无记录可编辑</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {mealFoods.length > 0 ? (
                <div className="space-y-4 pt-1">
                  {mealFoods.map((food) => (
                    <div key={`${food.name}-${food.Id ?? food.amount}`} className="flex justify-between items-center group">
                      <div className="space-y-0.5">
                        <p className="text-base font-semibold text-zinc-800 leading-tight">{food.name}</p>
                        <p className="text-xs text-zinc-400">{Math.round(food.amount)}g</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-zinc-900 tabular-nums">
                          {Math.round(food.calories)} <span className="text-[10px] font-medium text-zinc-300">kcal</span>
                        </p>
                        {isEditingThisMeal ? (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                            <button
                              type="button"
                              aria-label={`修改${food.name}`}
                              disabled={isLoading || !food.Id}
                              onClick={() => openEditModal(food)}
                              className="h-8 w-8 rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 flex items-center justify-center disabled:opacity-40 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              aria-label={`删除${food.name}`}
                              disabled={isLoading || !food.Id}
                              onClick={() => void handleDeleteFood(food)}
                              className="h-8 w-8 rounded-full border border-zinc-200 text-red-400 hover:bg-red-50 flex items-center justify-center disabled:opacity-40 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-300 text-xs italic">当前餐次暂无记录</p>
              )}
            </Card>
          );
        })}
        {foodActionError ? <p className="text-sm text-red-500 px-1">{foodActionError}</p> : null}

        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-xs">
              <Dumbbell size={24} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">运动</h2>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                {burnedCalories} <span className="font-normal text-[10px] lowercase text-zinc-300">kcal burned</span>
              </p>
            </div>
          </div>
        </Card>

        <WeightTrendSection title="体重趋势" />

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">体型照</h2>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Daily Body Photo
              </p>
            </div>
            <Link
              href="/record/photo"
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
            >
              <Camera size={14} />
              {dailyPhotoUrl ? '重新上传' : '去记录'}
            </Link>
          </div>

          <div className="aspect-[4/3] w-full rounded-xl border border-zinc-200/50 bg-zinc-50 overflow-hidden flex items-center justify-center relative group">
            {dailyPhotoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dailyPhotoUrl} alt="体型照" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void removeWeightPhoto(selectedDate)}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-white/90 backdrop-blur-sm text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="移除照片"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-300">
                <Camera size={32} strokeWidth={1.5} />
                <p className="text-xs font-medium">当日暂无体型照</p>
              </div>
            )}
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">水分补给</h2>
          <WaterTracker current={currentWater} target={userTarget.target_water} onAdd={(amount) => addWater(selectedDate, amount)} />
        </section>
      </main>

      <FloatingActionButton />

      {editingFood ? (
        <div className="fixed inset-0 bg-black/35 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-white border border-zinc-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">修改饮食记录</h3>
                <p className="text-sm text-zinc-500">{editingFood.name}</p>
              </div>
              <button
                type="button"
                aria-label="关闭修改弹窗"
                className="h-8 w-8 rounded-full border border-zinc-200 text-zinc-500 flex items-center justify-center"
                onClick={() => setEditingFood(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmitFoodEdit(event)}>
              <label className="block space-y-2">
                <span className="text-sm text-zinc-600">克数</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editingAmount}
                  onChange={(event) => setEditingAmount(event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFood(null)}
                  className="py-2.5 rounded-xl border border-zinc-200 text-zinc-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
