'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Calculator } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

export default function ProfilePage() {
  const router = useRouter();
  const { target, fetchTarget, updateTarget, isLoading } = useUserStore();

  const [formData, setFormData] = useState({
    weight: '70',
    height: '175',
    age: '25',
    gender: 'male',
    activity: '1.2',
    target_calories: '2000',
    target_carbs: '250',
    target_protein: '150',
    target_fat: '55',
    target_water: '2000'
  });

  useEffect(() => {
    fetchTarget();
  }, [fetchTarget]);

  useEffect(() => {
    if (target) {
      setFormData({
        weight: '70', // Weight not in schema but needed for calculation
        height: '175',
        age: '25',
        gender: 'male',
        activity: '1.2',
        target_calories: String(target.target_calories),
        target_carbs: String(target.target_carbs),
        target_protein: String(target.target_protein),
        target_fat: String(target.target_fat),
        target_water: String(target.target_water)
      });
    }
  }, [target]);

  const calculateTDEE = () => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    const a = parseFloat(formData.age);
    const activity = parseFloat(formData.activity);
    
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }
    
    const tdee = Math.round(bmr * activity);
    
    // Auto fill targets based on TDEE (Moderate carb/high protein split)
    setFormData({
      ...formData,
      target_calories: String(tdee),
      target_carbs: String(Math.round((tdee * 0.45) / 4)),
      target_protein: String(Math.round((tdee * 0.30) / 4)),
      target_fat: String(Math.round((tdee * 0.25) / 9))
    });
  };

  const handleSave = async () => {
    await updateTarget({
      tdee: parseInt(formData.target_calories),
      target_calories: parseInt(formData.target_calories),
      target_carbs: parseInt(formData.target_carbs),
      target_protein: parseInt(formData.target_protein),
      target_fat: parseInt(formData.target_fat),
      target_water: parseInt(formData.target_water)
    });
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-10">
      <header className="bg-white p-4 border-b flex items-center gap-4">
        <button onClick={() => router.back()}><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">目标设定</h1>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto w-full text-black">
        {/* TDEE Calculator Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={18} className="text-blue-500" />
            <h2 className="font-bold">TDEE 计算器</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400">体重 (kg)</label>
              <input 
                type="number" 
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="w-full p-2 bg-zinc-50 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">身高 (cm)</label>
              <input 
                type="number" 
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
                className="w-full p-2 bg-zinc-50 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">年龄</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full p-2 bg-zinc-50 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">性别</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full p-2 bg-zinc-50 border rounded-lg"
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs text-zinc-400">活动量级别</label>
            <select 
              value={formData.activity}
              onChange={(e) => setFormData({...formData, activity: e.target.value})}
              className="w-full p-2 bg-zinc-50 border rounded-lg"
            >
              <option value="1.2">久坐 (办公室工作)</option>
              <option value="1.375">轻度活动 (每周运动 1-3 次)</option>
              <option value="1.55">中度活动 (每周运动 3-5 次)</option>
              <option value="1.725">重度活动 (每天运动)</option>
            </select>
          </div>

          <button 
            onClick={calculateTDEE}
            className="w-full py-2 bg-blue-50 text-blue-600 font-bold rounded-lg border border-blue-100 active:scale-95 transition-transform"
          >
            自动计算目标
          </button>
        </section>

        {/* Manual Targets Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
          <h2 className="font-bold mb-2">每日营养目标</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium">总热量 (kcal)</label>
              <input 
                type="number" 
                value={formData.target_calories}
                onChange={(e) => setFormData({...formData, target_calories: e.target.value})}
                className="w-full p-3 bg-zinc-50 border-2 border-blue-100 rounded-xl text-lg font-bold"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-zinc-400">碳水 (g)</label>
                <input 
                  type="number" 
                  value={formData.target_carbs}
                  onChange={(e) => setFormData({...formData, target_carbs: e.target.value})}
                  className="w-full p-2 bg-zinc-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">蛋白质 (g)</label>
                <input 
                  type="number" 
                  value={formData.target_protein}
                  onChange={(e) => setFormData({...formData, target_protein: e.target.value})}
                  className="w-full p-2 bg-zinc-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">脂肪 (g)</label>
                <input 
                  type="number" 
                  value={formData.target_fat}
                  onChange={(e) => setFormData({...formData, target_fat: e.target.value})}
                  className="w-full p-2 bg-zinc-50 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">每日饮水 (ml)</label>
              <input 
                type="number" 
                value={formData.target_water}
                onChange={(e) => setFormData({...formData, target_water: e.target.value})}
                className="w-full p-3 bg-zinc-50 border rounded-xl"
              />
            </div>
          </div>
        </section>

        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          保存所有设置
        </button>
      </main>
    </div>
  );
}
