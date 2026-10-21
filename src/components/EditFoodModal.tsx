import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Edit3, ShieldAlert, HeartPulse, Scale, RefreshCw } from 'lucide-react';
import { LoggedFood, MealType } from '../types';

interface EditFoodModalProps {
  isOpen: boolean;
  food: LoggedFood | null;
  onClose: () => void;
  onSave: (updatedFood: LoggedFood) => void;
  onDelete?: (foodId: string) => void;
}

const COMMON_EMOJIS = ['🥗', '🥣', '🥪', '🍜', '🍲', '🥞', '🍣', '🌯', '🍛', '🍰', '🍓', '🥑', '🍗', '🥛', '🥚', '🧀', '🍎', '🍌', '☕', '🍵', '🍪', '🥖', '🥕'];

export const EditFoodModal: React.FC<EditFoodModalProps> = ({
  isOpen,
  food,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !food) return null;

  return (
    <EditFoodForm
      key={food.id}
      food={food}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
};

interface EditFoodFormProps {
  food: LoggedFood;
  onClose: () => void;
  onSave: (updatedFood: LoggedFood) => void;
  onDelete?: (foodId: string) => void;
}

const EditFoodForm: React.FC<EditFoodFormProps> = ({
  food,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(food.name);
  const [emoji, setEmoji] = useState(food.emoji || '🍽️');
  const [weightGrams, setWeightGrams] = useState<number>(food.weightGrams || 100);
  const [mealType, setMealType] = useState<MealType>(food.mealType || 'lunch');
  const [dietType, setDietType] = useState<'veg' | 'non_veg' | 'egg'>(food.dietType || 'veg');
  const [calories, setCalories] = useState<number>(food.calories || 0);
  const [protein, setProtein] = useState<number>(food.protein || 0);
  const [fat, setFat] = useState<number>(food.fat || 0);
  const [calcium, setCalcium] = useState<number>(food.calcium || 0);
  const [carbs, setCarbs] = useState<number>(food.carbs || 0);
  const [sugar, setSugar] = useState<number>(food.sugar || 0);
  const [researchNote, setResearchNote] = useState(food.researchNote || '');
  const [autoScaleOnWeight, setAutoScaleOnWeight] = useState(true);

  // Helper to adjust weight and optionally scale nutrients proportionally
  const handleWeightChange = (newWeightVal: number) => {
    const validWeight = Math.max(1, newWeightVal);
    const oldWeight = weightGrams > 0 ? weightGrams : 100;
    const ratio = validWeight / oldWeight;

    setWeightGrams(validWeight);

    if (autoScaleOnWeight && ratio > 0 && Math.abs(ratio - 1) > 0.001) {
      setCalories((prev) => Math.round(prev * ratio));
      setProtein((prev) => Math.round(prev * ratio * 10) / 10);
      setFat((prev) => Math.round(prev * ratio * 10) / 10);
      setCalcium((prev) => Math.round(prev * ratio));
      setCarbs((prev) => Math.round(prev * ratio * 10) / 10);
      setSugar((prev) => Math.round(prev * ratio * 10) / 10);
    }
  };

  // Compute diabetic sugar level badge
  const sugarValue = Number(sugar) || 0;
  const sugarLevel: 'low' | 'moderate' | 'high' =
    sugarValue > 15 ? 'high' : sugarValue >= 5 ? 'moderate' : 'low';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: LoggedFood = {
      ...food,
      name: name.trim() || food.name,
      emoji: emoji || '🍽️',
      weightGrams: Math.max(1, Number(weightGrams) || 100),
      mealType,
      dietType,
      calories: Math.max(0, Math.round(Number(calories) || 0)),
      protein: Math.max(0, Math.round((Number(protein) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(fat) || 0) * 10) / 10),
      calcium: Math.max(0, Math.round(Number(calcium) || 0)),
      carbs: Math.max(0, Math.round((Number(carbs) || 0) * 10) / 10),
      sugar: Math.max(0, Math.round((Number(sugar) || 0) * 10) / 10),
      sugarLevel,
      researchNote: researchNote.trim() || undefined,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-pink-200 shadow-2xl max-w-xl w-full p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs border border-pink-200">
            {emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-800 text-lg sm:text-xl">
                Edit Food Data
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                Custom Adjust
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Update weight, sugar level for diabetes, calcium, protein, or portion details anytime.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Food Name & Emoji */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grandma's Low-Sugar Oatmeal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Emoji
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={2}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full px-3 py-2 text-center rounded-xl border border-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>
          </div>

          {/* Digestive Sensitivity Notice */}
          {(name.toLowerCase().includes('cucumber') || food.digestiveWarning) && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-extrabold block">🥒 Digestive Alert for Grandma:</span>
                <span className="text-[11px] text-slate-600 block">
                  Raw cucumber does not always suit Grandma's digestion (causes gas/burping).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setName('Stewed Bottle Gourd (Lauki)');
                  setEmoji('🥣');
                  setCalories(Math.round(14 * (weightGrams / 100)));
                  setProtein(Math.round(0.6 * (weightGrams / 100) * 10) / 10);
                  setFat(Math.round(0.1 * (weightGrams / 100) * 10) / 10);
                  setCalcium(Math.round(26 * (weightGrams / 100)));
                  setCarbs(Math.round(3.4 * (weightGrams / 100) * 10) / 10);
                  setSugar(Math.round(0.5 * (weightGrams / 100) * 10) / 10);
                  setResearchNote('Soothing vegetable swap for Grandma (0.5g sugar).');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shrink-0 transition-colors shadow-2xs"
              >
                🔄 Swap to Lauki (0.5g Sugar)
              </button>
            </div>
          )}

          {/* Quick Emoji Picker */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-base">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick icon:</span>
            {COMMON_EMOJIS.slice(0, 12).map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                className={`p-1 rounded-lg hover:bg-pink-100 transition-colors ${
                  emoji === em ? 'bg-pink-200 scale-110 shadow-2xs' : 'bg-slate-50'
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Meal Type & Diet Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meal Timing
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'breakfast', label: '🥞 Breakfast' },
                  { key: 'lunch', label: '🥗 Lunch' },
                  { key: 'dinner', label: '🍲 Dinner' },
                  { key: 'snack', label: '🍓 Snack' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMealType(m.key as MealType)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      mealType === m.key
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diet Classification
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'veg', label: '🟢 Pure Veg', color: 'emerald' },
                  { key: 'egg', label: '🟡 Egg', color: 'amber' },
                  { key: 'non_veg', label: '🔴 Non-Veg', color: 'rose' },
                ].map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDietType(d.key as 'veg' | 'non_veg' | 'egg')}
                    className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center ${
                      dietType === d.key
                        ? d.key === 'veg'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : d.key === 'egg'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Portion Weight Adjuster */}
          <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-pink-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-pink-600" />
                <span>Portion Weight (grams)</span>
              </span>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScaleOnWeight}
                  onChange={(e) => setAutoScaleOnWeight(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-400"
                />
                <span>Auto-scale nutrients with weight</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="5000"
                value={weightGrams}
                onChange={(e) => handleWeightChange(Number(e.target.value) || 0)}
                className="w-32 px-3 py-2 rounded-xl bg-white border border-pink-200 text-base font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              <span className="text-xs font-bold text-slate-500">grams</span>

              {/* Quick Steppers */}
              <div className="flex items-center gap-1 ml-auto">
                {[-50, -10, 10, 50].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleWeightChange(weightGrams + delta)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-pink-100 transition-colors shadow-2xs"
                  >
                    {delta > 0 ? `+${delta}g` : `${delta}g`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* NUTRITION & SUGAR INPUTS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Nutrients for this Portion
              </span>
              <span className="text-[11px] text-slate-400">
                You can manually override any number
              </span>
            </div>

            {/* PRIORITY 1: SUGAR (DIABETES TRACKING) */}
            <div className={`p-3 rounded-2xl border transition-all ${
              sugarLevel === 'high'
                ? 'bg-rose-50 border-rose-200'
                : sugarLevel === 'moderate'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🍬</span>
                  <span className="text-xs font-extrabold text-slate-800">
                    Sugar Content (g) — Diabetes Monitor
                  </span>
                </div>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                  sugarLevel === 'high'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : sugarLevel === 'moderate'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {sugarLevel === 'high'
                    ? '⚠️ Spike Risk (>15g)'
                    : sugarLevel === 'moderate'
                    ? '🟡 Moderate Sugar (5-15g)'
                    : '🟢 Diabetic Safe (<5g)'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={sugar}
                  onChange={(e) => setSugar(Number(e.target.value) || 0)}
                  className="w-32 px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <p className="text-[11px] text-slate-600">
                  {sugarLevel === 'high'
                    ? 'Caution for Grandma: high simple sugar can elevate blood glucose levels.'
                    : sugarLevel === 'moderate'
                    ? 'Moderate sugar: fine when paired with protein/fiber.'
                    : 'Gentle on blood glucose: great choice for Grandma!'}
                </p>
              </div>
            </div>

            {/* PRIORITY 2: CALCIUM & PROTEIN (USER HIGHLIGHTED: NOT EVERYTHING HAS CALCIUM/PROTEIN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Calcium */}
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1">
                    <span>🥛 Calcium (mg)</span>
                    <span className="text-[10px] text-indigo-600 font-bold">Bone Support</span>
                  </label>
                  {calcium === 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">
                      0mg (None)
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={calcium}
                  onChange={(e) => setCalcium(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-sm font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="text-[10px] text-indigo-700/80 block">
                  e.g. Milk/Paneer have high calcium; oils/fruits often have ~0mg.
                </span>
              </div>

              {/* Protein */}
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-rose-950 flex items-center gap-1">
                    <span>🍗 Protein (g)</span>
                    <span className="text-[10px] text-rose-600 font-bold">Strength</span>
                  </label>
                  {protein === 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">
                      0g (None)
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-sm font-bold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <span className="text-[10px] text-rose-700/80 block">
                  Eggs/Tofu/Lentils have high protein; sugars/oils have 0g.
                </span>
              </div>
            </div>

            {/* OTHER NUTRIENTS: Calories, Fat, Carbs */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  🔥 Calories (kcal)
                </label>
                <input
                  type="number"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200">
                <label className="block text-[11px] font-bold text-teal-900 mb-1">
                  🥑 Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-teal-200 text-xs font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
                <label className="block text-[11px] font-bold text-orange-900 mb-1">
                  🌾 Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-orange-200 text-xs font-bold text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            {/* Note field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Custom Research or Preparation Note (Optional)
              </label>
              <input
                type="text"
                value={researchNote}
                onChange={(e) => setResearchNote(e.target.value)}
                placeholder="e.g. Grandma's special sugar-free recipe"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(food.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-xl transition-all shadow-2xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-md shadow-pink-200 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
