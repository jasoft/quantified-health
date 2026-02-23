'use client';

import React, { useState } from 'react';
import { Plus, Coffee, Utensils, Moon, Dumbbell, Droplet, Activity } from 'lucide-react';
import Link from 'next/link';

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <Coffee size={20} />, label: '早餐', href: '/record/food?type=breakfast', color: 'bg-orange-400' },
    { icon: <Utensils size={20} />, label: '午餐', href: '/record/food?type=lunch', color: 'bg-green-400' },
    { icon: <Utensils size={20} />, label: '晚餐', href: '/record/food?type=dinner', color: 'bg-blue-400' },
    { icon: <Moon size={20} />, label: '加餐', href: '/record/food?type=snack', color: 'bg-purple-400' },
    { icon: <Dumbbell size={20} />, label: '运动', href: '/record/exercise', color: 'bg-red-400' },
    { icon: <Activity size={20} />, label: '体重', href: '/profile', color: 'bg-slate-500' },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end">
          {actions.map((action, index) => (
            <Link 
              key={index} 
              href={action.href}
              className="flex items-center gap-2 group"
              onClick={() => setIsOpen(false)}
            >
              <span className="bg-white px-2 py-1 rounded text-xs font-medium shadow-md text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                {action.label}
              </span>
              <div className={`${action.color} text-white p-3 rounded-full shadow-lg active:scale-90 transition-transform`}>
                {action.icon}
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-transform active:scale-90 ${isOpen ? 'rotate-45' : ''}`}
      >
        <Plus size={24} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
