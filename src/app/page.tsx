'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDays, addWeeks, format, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalorieRing } from '@/components/dashboard/CalorieRing';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { NOCODB_URL } from '@/lib/nocodb';
import { NocoAttachment } from '@/services/recordService';
import { useRecordStore } from '@/store/useRecordStore';
import { useUserStore } from '@/store/useUserStore';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<(typeof MEAL_ORDER)[number], string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};
const MEAL_TARGET_RATIOS: Record<(typeof MEAL_ORDER)[number], number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

function resolveAttachmentUrl(photo?: NocoAttachment): string | null {
  if (!photo) return null;
  const raw = photo.url ?? photo.path ?? '';
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${NOCODB_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function dateLabel(date: Date): string {
  if (isToday(date)) return '今天';
  return format(date, 'M月d日');
}

export default function Home() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { target, fetchTarget, isLoading: userLoading } = useUserStore();
  const {
    foodRecords,
    waterIntake,
    exerciseCalories,
    dailyRecordsByDate,
    fetchRecordsForDate,
    fetchDailyRecordByDate,
    addWater,
    removeDailyPhoto,
    isLoading,
  } = useRecordStore();

  useEffect(() => {
    void fetchTarget();
  }, [fetchTarget]);

  useEffect(() => {
    void fetchRecordsForDate(selectedDate);
    void fetchDailyRecordByDate(selectedDate);
  }, [fetchDailyRecordByDate, fetchRecordsForDate, selectedDate]);

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
    } as Record<(typeof MEAL_ORDER)[number], typeof foodRecords>;

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
  const dailyPhotoUrl = resolveAttachmentUrl(dailyRecordsByDate[selectedDate]?.photo?.[0]);

  const macroItems = [
    { label: '蛋白质', current: consumedProtein, target: userTarget.target_protein, color: 'bg-blue-300' },
    { label: '脂肪', current: consumedFat, target: userTarget.target_fat, color: 'bg-pink-300' },
    { label: '碳水化合物', current: consumedCarbs, target: userTarget.target_carbs, color: 'bg-amber-300' },
  ];

  if (userLoading && !target) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 font-sans pb-32">
      <section className="bg-sky-100 px-4 pt-4 pb-8 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              setWeekStart((prev) => addWeeks(prev, -1));
              setSelectedDate((prev) => format(addWeeks(parseISO(`${prev}T00:00:00`), -1), 'yyyy-MM-dd'));
            }}
            aria-label="上一周"
            className="p-2 text-zinc-700"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold text-zinc-900">{dateLabel(selectedDateObj)}</h1>
          <button
            type="button"
            onClick={() => {
              setWeekStart((prev) => addWeeks(prev, 1));
              setSelectedDate((prev) => format(addWeeks(parseISO(`${prev}T00:00:00`), 1), 'yyyy-MM-dd'));
            }}
            aria-label="下一周"
            className="p-2 text-zinc-700"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-3">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-zinc-600 text-sm">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const active = isSameDay(date, selectedDateObj);
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
                className={`h-9 w-9 mx-auto rounded-full text-sm transition ${
                  active ? 'bg-blue-300 text-zinc-900 font-bold' : 'text-zinc-600'
                }`}
                aria-label={`${WEEKDAY_LABELS[index]} ${format(date, 'd')}日`}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 items-center">
          <div className="text-center">
            <p className="text-sm text-zinc-600">饮食摄入</p>
            <p className="text-4xl font-bold text-zinc-900 leading-tight">{consumedCalories}</p>
          </div>
          <CalorieRing target={userTarget.target_calories} consumed={consumedCalories} burned={burnedCalories} />
          <div className="text-center">
            <p className="text-sm text-zinc-600">运动消耗</p>
            <p className="text-4xl font-bold text-zinc-900 leading-tight">{burnedCalories}</p>
          </div>
        </div>
      </section>

      <main className="px-4 py-4 space-y-4 max-w-md mx-auto w-full">
        <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <div className="grid grid-cols-3 gap-4">
            {macroItems.map((item) => {
              const ratio = Math.min(100, (item.current / Math.max(1, item.target)) * 100);
              return (
                <div key={item.label} className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-700">{item.label}</h3>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${ratio}%` }} />
                  </div>
                  <p className="text-sm text-zinc-900 font-semibold">
                    {Math.round(item.current)}/{Math.round(item.target)}克
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {MEAL_ORDER.map((mealType) => {
          const mealFoods = groupedMeals[mealType];
          const mealCalories = mealFoods.reduce((sum, item) => sum + Number(item.calories), 0);
          const mealTarget = Math.round(userTarget.target_calories * MEAL_TARGET_RATIOS[mealType]);

          return (
            <section key={mealType} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
              <div className="flex items-end gap-3">
                <h2 className="text-4xl font-bold text-zinc-900 leading-none">{MEAL_LABELS[mealType]}</h2>
                <p className="text-xl text-zinc-500">已摄入{mealCalories}/{mealTarget}千卡</p>
              </div>

              {mealFoods.length > 0 ? (
                <div className="space-y-4">
                  {mealFoods.map((food) => (
                    <div key={`${food.name}-${food.Id ?? food.amount}`} className="flex justify-between gap-4">
                      <div>
                        <p className="text-4xl font-semibold text-zinc-900 leading-tight">{food.name}</p>
                        <p className="text-2xl text-zinc-500 mt-1">{Math.round(food.amount)}克</p>
                      </div>
                      <p className="text-4xl font-semibold text-zinc-900 whitespace-nowrap">{Math.round(food.calories)}千卡</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 text-sm">当前餐次暂无记录</p>
              )}
            </section>
          );
        })}

        <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-bold text-zinc-900 leading-none">运动</h2>
            <p className="text-xl text-zinc-500">已消耗{burnedCalories}千卡</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold text-zinc-900 leading-none">体型照</h2>
            <Link href="/record/photo" className="text-sm text-blue-600 font-semibold inline-flex items-center gap-1">
              <Camera size={16} />
              {dailyPhotoUrl ? '重新上传' : '去记录'}
            </Link>
          </div>
          <div className="h-52 rounded-xl border border-zinc-200 bg-zinc-100 overflow-hidden flex items-center justify-center">
            {dailyPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dailyPhotoUrl} alt="体型照" className="w-full h-full object-cover" />
            ) : (
              <p className="text-zinc-400 text-sm">当日暂无体型照</p>
            )}
          </div>
          <button
            type="button"
            disabled={!dailyPhotoUrl || isLoading}
            onClick={() => void removeDailyPhoto(selectedDate)}
            className="w-full py-2.5 rounded-xl border border-zinc-200 text-zinc-600 disabled:opacity-50"
          >
            移除
          </button>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">水分补给</h2>
          <WaterTracker current={currentWater} target={userTarget.target_water} onAdd={(amount) => addWater(selectedDate, amount)} />
        </section>
      </main>

      <FloatingActionButton />
    </div>
  );
}
