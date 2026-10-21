import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { FoodItem } from '../types';

interface CustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomFood: (food: FoodItem) => void;
}

const EMOJI_OPTIONS = ['🥗', '🥪', '🍜', '🍲', '🥞', '🍣', '🌯', '🍛', '🍰', '🍓', '🥑', '🍗', '🥛', '🍪', '🥨', '🥙'];

export const CustomFoodModal: React.FC<CustomFoodModalProps> = ({
  isOpen,
  onClose,
  onAddCustomFood,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodItem['category']>('protein');
  const [emoji, setEmoji] = useState('🥗');
  const [caloriesPer100g, setCaloriesPer100g] = useState<number | ''>(150);
  const [proteinPer100g, setProteinPer100g] = useState<number | ''>(10);
  const [fatPer100g, setFatPer100g] = useState<number | ''>(5);
  const [calciumPer100g, setCalciumPer100g] = useState<number | ''>(50);
  const [carbsPer100g, setCarbsPer100g] = useState<number | ''>(15);
  const [defaultWeightGrams, setDefaultWeightGrams] = useState<number | ''>(100);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newFood: FoodItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category,
      emoji,
      caloriesPer100g: Number(caloriesPer100g) || 0,
      proteinPer100g: Number(proteinPer100g) || 0,
      fatPer100g: Number(fatPer100g) || 0,
      calciumPer100g: Number(calciumPer100g) || 0,
      carbsPer100g: Number(carbsPer100g) || 0,
      defaultWeightGrams: Number(defaultWeightGrams) || 100,
      servingDescription: 'Custom serving',
      isCustom: true,
    };

    onAddCustomFood(newFood);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-pink-200 shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Create Custom Food</h3>
            <p className="text-xs text-slate-500">Nutrients per 100 grams standard base</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Food Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma's Lentil Soup or Matcha Pudding"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodItem['category'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
              >
                <option value="dairy">Dairy & Calcium</option>
                <option value="protein">Protein & Meats/Tofu</option>
                <option value="fruit">Fruit & Berries</option>
                <option value="vegetable">Vegetable & Greens</option>
                <option value="grain">Grains & Carbs</option>
                <option value="nuts_fats">Healthy Fats & Nuts</option>
                <option value="treats_drinks">Drinks & Treats</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pick Emoji Icon</label>
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {EMOJI_OPTIONS.slice(0, 7).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`text-lg p-1.5 rounded-lg border transition-all ${
                      emoji === em ? 'border-pink-500 bg-pink-50 scale-110' : 'border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100">
            <span className="text-[11px] font-bold text-pink-700 uppercase tracking-wider block mb-2">
              Nutrients per 100 grams
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-800 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={caloriesPer100g}
                  onChange={(e) => setCaloriesPer100g(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={proteinPer100g}
                  onChange={(e) => setProteinPer100g(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-800 mb-1">Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={fatPer100g}
                  onChange={(e) => setFatPer100g(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-800 mb-1">Calcium (mg) ⭐</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={calciumPer100g}
                  onChange={(e) => setCalciumPer100g(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-800 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={carbsPer100g}
                  onChange={(e) => setCarbsPer100g(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Typical Weight (g)</label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={defaultWeightGrams}
                  onChange={(e) => setDefaultWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Save to Food List</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
