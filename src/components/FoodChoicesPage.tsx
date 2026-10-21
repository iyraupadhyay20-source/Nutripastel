import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  Flame,
  Dumbbell,
  Droplet,
  Milk,
  Loader2,
  Utensils,
  Lightbulb,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Leaf,
  Drumstick,
  Egg,
  Pencil,
  HeartPulse,
  RotateCcw
} from 'lucide-react';
import { LoggedFood, MealType, UserPreferences } from '../types';
import { sumNutrients, calculateNutrientsForWeight } from '../utils/nutrition';
import { DEFAULT_FOOD_DATABASE } from '../data/foodDatabase';
import { researchFoodAndCalculate, checkDietaryBoundary, inferDietType, checkDigestiveSensitivity } from '../utils/foodResearcher';
import { EditFoodModal } from './EditFoodModal';

interface FoodChoicesPageProps {
  preferences: UserPreferences;
  loggedFoods: LoggedFood[];
  onAddFood: (food: LoggedFood) => void;
  onUpdateFood?: (food: LoggedFood) => void;
  onDeleteFood: (id: string) => void;
  onClearFoods: () => void;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  onGoToCaloriesPage: () => void;
  onOpenCalculator?: () => void;
}

export const FoodChoicesPage: React.FC<FoodChoicesPageProps> = ({
  preferences,
  loggedFoods,
  onAddFood,
  onUpdateFood,
  onDeleteFood,
  onClearFoods,
  onUpdatePreferences,
  onGoToCaloriesPage,
  onOpenCalculator,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [isResearching, setIsResearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [boundaryFilter, setBoundaryFilter] = useState<'all' | 'veg' | 'non_veg' | 'egg'>('all');
  const [editingFood, setEditingFood] = useState<LoggedFood | null>(null);

  // Pending boundary conflict confirmation modal
  const [pendingFoodConflict, setPendingFoodConflict] = useState<{
    food: LoggedFood;
    warningMessage: string;
    suggestedAlternative: string;
  } | null>(null);

  // Pending digestive sensitivity conflict modal (e.g. cucumber doesn't always suit Grandma)
  const [pendingSensitivityConflict, setPendingSensitivityConflict] = useState<{
    food: LoggedFood;
    warningMessage: string;
    soothingAlternatives: { name: string; emoji: string; desc: string; weightGrams: number }[];
  } | null>(null);

  // Live totals calculation for the day
  const totals = sumNutrients(loggedFoods);
  const calTarget = preferences.calorieTarget || 2000;
  const calPercent = Math.min(150, Math.round((totals.calories / calTarget) * 100));

  // Current boundary
  const currentBoundary = preferences.dietBoundary || 'all';

  // Change boundary handler
  const handleSetBoundary = (newBoundary: 'all' | 'veg_only' | 'eggetarian' | 'non_veg_only') => {
    onUpdatePreferences({ ...preferences, dietBoundary: newBoundary });
    setStatusMessage(
      newBoundary === 'veg_only'
        ? '🟢 Pure Veg Boundary activated! Non-veg items will be flagged.'
        : newBoundary === 'eggetarian'
        ? '🟡 Eggetarian Boundary set (Veg + Eggs allowed).'
        : '✨ All Foods allowed (Veg & Non-Veg).'
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Handle Add Food: App itself does research on the food and fills data accordingly
  const handleAddFood = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    setIsResearching(true);
    setStatusMessage(`Researching "${query}" nutrition... 🔍✨`);

    try {
      // The app itself does research to check the food and fill data accordingly!
      const researchedFood = await researchFoodAndCalculate(query, selectedMeal);

      // Check Veg / Non-Veg boundary
      const boundaryCheck = checkDietaryBoundary(
        researchedFood.dietType || 'veg',
        currentBoundary,
        researchedFood.name
      );

      if (boundaryCheck.violatesBoundary) {
        // Halt and prompt user with boundary confirmation
        setIsResearching(false);
        setPendingFoodConflict({
          food: researchedFood,
          warningMessage: boundaryCheck.message || 'Crosses your dietary boundary!',
          suggestedAlternative: boundaryCheck.suggestedAlternative || 'Consider a vegetarian protein like Paneer or Tofu.',
        });
        return;
      }

      // Check digestive sensitivity (e.g. cucumber does not always suit Grandma!)
      const sensitivityCheck = checkDigestiveSensitivity(
        researchedFood.name,
        preferences.sensitiveFoods
      );

      if (sensitivityCheck.hasSensitivity) {
        setIsResearching(false);
        setPendingSensitivityConflict({
          food: researchedFood,
          warningMessage: sensitivityCheck.warningMessage || `Cucumber does not always suit Grandma's digestion.`,
          soothingAlternatives: sensitivityCheck.soothingAlternatives,
        });
        return;
      }

      // Add to plate
      onAddFood(researchedFood);
        setInputText('');

        try {
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.75 },
            colors: ['#F472B6', '#C084FC', '#60A5FA', '#34D399', '#FBBF24'],
          });
        } catch {}

        if ((researchedFood.sugar || 0) > 15) {
          setStatusMessage(`⚠️ Added ${researchedFood.name}: ${researchedFood.calories} kcal, ${researchedFood.protein}g protein, ${researchedFood.calcium}mg calcium. Note: High in sugar (${researchedFood.sugar}g) — monitor blood glucose for Grandmother!`);
        } else {
          setStatusMessage(`✨ Researched & added: ${researchedFood.name} (${researchedFood.calories} kcal, ${researchedFood.protein}g protein, ${researchedFood.calcium}mg calcium, ${researchedFood.sugar || 0}g sugar) — Safe for diabetes!`);
        }
        setTimeout(() => setStatusMessage(null), 4500);
      } catch {
        setStatusMessage('Could not research food, please try entering simple name and weight (e.g. 150g chicken).');
        setTimeout(() => setStatusMessage(null), 3000);
      } finally {
        setIsResearching(false);
      }
    };

  // Confirm adding conflicting food anyway
  const handleConfirmConflictAnyway = () => {
    if (!pendingFoodConflict) return;
    onAddFood(pendingFoodConflict.food);
    setInputText('');
    setPendingFoodConflict(null);
    setStatusMessage(`Added ${pendingFoodConflict.food.name} (overrode boundary) ✨`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Switch to Veg Alternative
  const handleSwitchToVegAlternative = async () => {
    if (!pendingFoodConflict) return;
    setPendingFoodConflict(null);
    setIsResearching(true);
    setStatusMessage('Researching vegetarian alternative (Fresh Paneer / Tofu)... 🥦');

    try {
      const weight = pendingFoodConflict.food.weightGrams || 100;
      const altFood = await researchFoodAndCalculate(`Paneer ${weight}g`, selectedMeal);
      onAddFood(altFood);
      setInputText('');
      setStatusMessage(`✨ Added pure vegetarian alternative: ${altFood.name} (${altFood.protein}g protein, ${altFood.calcium}mg calcium)!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsResearching(false);
    }
  };

  // Filtered food list
  const filteredFoods = loggedFoods.filter(f => {
    if (boundaryFilter === 'all') return true;
    if (boundaryFilter === 'veg') return f.dietType === 'veg';
    if (boundaryFilter === 'non_veg') return f.dietType === 'non_veg';
    if (boundaryFilter === 'egg') return f.dietType === 'egg';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-3 px-3 sm:px-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 mb-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Page 2 of 3 · Food Choices & Dietary Boundaries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Enter Your Food Choices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Type any food with its weight. The app researches nutrition and respects your <strong>Veg & Non-Veg boundaries</strong>!
          </p>
        </div>

        <button
          onClick={onGoToCaloriesPage}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all self-start sm:self-auto"
        >
          <span>Page 3: Calories & Stats</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* VEG & NON-VEG BOUNDARY SELECTOR CARD */}
      <div className="rounded-3xl bg-white border border-emerald-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>Dietary Boundary Control</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Active
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose your dietary boundary to prevent or allow veg, egg, or non-veg foods
              </p>
            </div>
          </div>

          {/* Current Boundary Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto">
            <span className="text-slate-500 text-[11px]">Current Boundary:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              currentBoundary === 'veg_only'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : currentBoundary === 'eggetarian'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-purple-100 text-purple-800 border border-purple-200'
            }`}>
              {currentBoundary === 'veg_only' && '🟢 Pure Veg Only'}
              {currentBoundary === 'eggetarian' && '🟡 Eggetarian (Veg + Egg)'}
              {currentBoundary === 'all' && '✨ All (Veg & Non-Veg)'}
            </span>
          </div>
        </div>

        {/* 3 Boundary Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleSetBoundary('veg_only')}
            className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              currentBoundary === 'veg_only'
                ? 'bg-emerald-50 border-emerald-400 shadow-xs ring-2 ring-emerald-300/40'
                : 'bg-slate-50/60 border-slate-200 hover:bg-emerald-50/30'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
              🟢
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-800 block">Pure Vegetarian Only</span>
              <span className="text-[10px] text-slate-500 block">Blocks/flags meats, fish & eggs</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSetBoundary('eggetarian')}
            className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              currentBoundary === 'eggetarian'
                ? 'bg-amber-50 border-amber-400 shadow-xs ring-2 ring-amber-300/40'
                : 'bg-slate-50/60 border-slate-200 hover:bg-amber-50/30'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shrink-0">
              🟡
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-800 block">Eggetarian Friendly</span>
              <span className="text-[10px] text-slate-500 block">Allows veg + eggs; blocks meat</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSetBoundary('all')}
            className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              currentBoundary === 'all'
                ? 'bg-purple-50 border-purple-400 shadow-xs ring-2 ring-purple-300/40'
                : 'bg-slate-50/60 border-slate-200 hover:bg-purple-50/30'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shrink-0">
              🔴
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-800 block">All Foods (Veg + Non-Veg)</span>
              <span className="text-[10px] text-slate-500 block">No boundaries restricted</span>
            </div>
          </button>
        </div>
      </div>

      {/* LIVE DAY CALORIE & NUTRIENT BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 p-5 sm:p-6 text-white shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥑</span>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                Today's Calories & Nutrients
              </h2>
              <p className="text-xs text-pink-100 flex items-center gap-1.5 flex-wrap">
                <span>Calculated for Grandma ({preferences.age || 72}y · {preferences.weightKg || 58}kg)</span>
                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={onOpenCalculator}
                    className="underline text-white font-bold hover:text-amber-200 text-[11px] cursor-pointer bg-white/20 px-2 py-0.5 rounded-md"
                  >
                    🧮 Adjust Weight & Age
                  </button>
                )}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold text-white self-start sm:self-auto">
            {loggedFoods.length} items logged ({totals.weightGrams}g)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-200 block">Calories</span>
            <span className="text-xl sm:text-2xl font-black text-white">{totals.calories}</span>
            <span className="text-[11px] text-pink-100 block">/ {calTarget} kcal ({calPercent}%)</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-200 block">Protein</span>
            <span className="text-xl sm:text-2xl font-black text-white">{totals.protein}g</span>
            <span className="text-[11px] text-pink-100 block">/ {preferences.proteinTarget}g</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-200 block">Healthy Fat</span>
            <span className="text-xl sm:text-2xl font-black text-white">{totals.fat}g</span>
            <span className="text-[11px] text-pink-100 block">/ {preferences.fatTarget}g</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center ring-2 ring-white/30">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Calcium ⭐</span>
            <span className="text-xl sm:text-2xl font-black text-white">{totals.calcium}mg</span>
            <span className="text-[11px] text-pink-100 block">/ {preferences.calciumTarget}mg</span>
          </div>

          {/* CARD 5: SUGAR INTAKE FOR GRANDMOTHER */}
          <div className={`p-3 rounded-2xl backdrop-blur-md border text-center col-span-2 sm:col-span-1 ${
            totals.sugar > (preferences.sugarLimit || 25)
              ? 'bg-rose-950/60 border-rose-300 ring-2 ring-rose-300'
              : totals.sugar >= (preferences.sugarLimit || 25) * 0.8
              ? 'bg-amber-900/50 border-amber-300'
              : 'bg-emerald-950/40 border-emerald-300'
          }`}>
            <span className="text-[10px] uppercase font-black text-white block flex items-center justify-center gap-1">
              <span>🍬 Sugar (Diabetes)</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">{totals.sugar}g</span>
            <span className="text-[11px] text-white/90 block font-bold">
              / {preferences.sugarLimit || 25}g limit {totals.sugar > (preferences.sugarLimit || 25) ? '⚠️ High' : '🟢 Safe'}
            </span>
          </div>
        </div>

        {/* Diabetes High Sugar Warning for Grandmother */}
        {totals.sugar > (preferences.sugarLimit || 20) && (
          <div className="p-3.5 rounded-2xl bg-rose-950/85 border border-rose-300 text-white text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <span className="text-2xl shrink-0">⚠️</span>
            <span>
              <strong>Diabetes Care for Grandmother:</strong> Today's total sugar ({totals.sugar}g) has exceeded the safe daily target ({preferences.sugarLimit || 20}g)! To reduce sugar and stabilize blood glucose, favor <strong>Stewed Lauki</strong> (0.8g sugar), <strong>Warm Moong Dal soup</strong>, <strong>Spiced Chaas with roasted jeera</strong>, or <strong>Karela sabzi</strong>. (Cucumber excluded to protect Grandma's digestion).
            </span>
          </div>
        )}
      </div>

      {/* CLEAN & SIMPLE TEXT INPUT BAR WITH ADD OPTION */}
      <div className="rounded-3xl bg-white border-2 border-pink-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center text-xl shadow-xs">
            ✍️
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Type What You Ate (App Researches Indian Nutrition)
            </h2>
            <p className="text-xs text-slate-400">
              Enter Indian foods in rotis, katoris, grams, or servings. Verified ICMR-NIN nutrition data is researched automatically.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddFood} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* The Main Clean Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. 2 rotis (70g), 1 katori moong dal, 150g stewed lauki, 1 glass chaas, 100g dahi, chai without sugar..."
                disabled={isResearching}
                className="w-full px-4 py-3 rounded-2xl border-2 border-pink-200 bg-pink-50/20 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all disabled:opacity-60 placeholder:text-slate-400"
              />
            </div>

            {/* Meal Type Quick Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setSelectedMeal(m)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                    selectedMeal === m
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m === 'breakfast' && '🥞 '}
                  {m === 'lunch' && '🥗 '}
                  {m === 'dinner' && '🍲 '}
                  {m === 'snack' && '🍓 '}
                  {m}
                </button>
              ))}
            </div>

            {/* ADD OPTION BUTTON */}
            <button
              type="submit"
              disabled={isResearching || !inputText.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
            >
              {isResearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Food</span>
                </>
              )}
            </button>
          </div>

          {/* Quick example inputs (Authentic Indian Foods & Portions) */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 pt-1">
            <span className="font-semibold text-[11px] text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>🇮🇳 Quick Indian Staples:</span>
            </span>

            {[
              { label: '🫓 2 Rotis (70g)', text: '2 handmade whole wheat rotis 70g' },
              { label: '🍲 1 Katori Moong Dal (150g)', text: '1 katori cooked yellow moong dal 150g' },
              { label: '🥣 150g Dahi (Curd)', text: '150g homemade dahi plain curd' },
              { label: '🥛 1 Glass Chaas (200ml)', text: '1 glass spiced chaas buttermilk 200ml' },
              { label: '🧀 60g Fresh Paneer', text: '60g fresh paneer cubes' },
              { label: '🌾 1 Ragi Roti (40g)', text: '1 ragi roti 40g' },
              { label: '☕ Chai without Sugar', text: '1 cup indian masala chai no added sugar 150ml' },
            ].map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(ex.text)}
                className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-[11px] border border-emerald-200 transition-colors cursor-pointer"
              >
                {ex.label}
              </button>
            ))}

            {/* Non-veg suggestion if allowed */}
            {currentBoundary !== 'veg_only' && (
              <button
                type="button"
                onClick={() => setInputText('2 boiled eggs 100g')}
                className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] border border-amber-200 transition-colors cursor-pointer"
              >
                🟡 2 boiled eggs 100g
              </button>
            )}
          </div>

          {/* GRANDMA'S GENTLE VEGETABLES (WHEN CUCUMBER DOES NOT SUIT HER) */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="font-bold text-[11px] text-pink-700 flex items-center gap-1">
              <span>👵 Suggestions to Reduce Sugar (Gentle Alternatives to Cucumber):</span>
            </span>

            {[
              { label: '🥣 150g Stewed Lauki (0.8g Sugar)', text: '150g Stewed Bottle Gourd (Lauki)' },
              { label: '🥗 100g Karela Sabzi (Sugar Reducer)', text: '100g Karela Sabzi (Cooked Bitter Gourd)' },
              { label: '🍵 150ml Warm Methi Water', text: '150ml Warm Methi Dana Water' },
              { label: '🥗 140g Stewed Turai (Ridge Gourd)', text: '140g Stewed Ridge Gourd (Turai)' },
              { label: '🍲 180g Moong Dal Veg Broth', text: '180g Warm Moong Dal & Veg Broth' },
              { label: '🧆 30g Roasted Chana (Low GI)', text: '30g Roasted Chana (Bhuna Chana)' },
            ].map((alt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(alt.text)}
                className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-900 font-semibold text-[11px] border border-pink-200 transition-colors shadow-2xs cursor-pointer"
                title="Gentle on digestion and low in sugar for diabetes"
              >
                {alt.label}
              </button>
            ))}
          </div>
        </form>

        {/* Status message */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* DIGESTIVE SENSITIVITY MODAL (WHEN CUCUMBER DOES NOT SUIT HER) */}
      {pendingSensitivityConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shrink-0">
                🥒
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800">
                    Grandma's Digestion Care Alert
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    Doesn't Always Suit
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {pendingSensitivityConflict.warningMessage}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-900 block">
                ✨ Recommended Soothing Food Options for Grandma:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pendingSensitivityConflict.soothingAlternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const matchedBase = DEFAULT_FOOD_DATABASE.find(f => f.name.toLowerCase().includes(alt.name.toLowerCase().slice(0, 8)));
                      const weight = alt.weightGrams;
                      let swappedFood: LoggedFood;
                      if (matchedBase) {
                        const calculated = calculateNutrientsForWeight(matchedBase, weight);
                        swappedFood = {
                          id: `log_swap_${Date.now()}`,
                          foodId: matchedBase.id,
                          name: matchedBase.name,
                          emoji: matchedBase.emoji,
                          weightGrams: weight,
                          mealType: selectedMeal,
                          ...calculated,
                          dietType: 'veg',
                          researchNote: 'Gentle swap for Grandma: soothing on digestion with safe sugar balance.',
                          loggedAt: new Date().toISOString(),
                        };
                      } else {
                        swappedFood = {
                          ...pendingSensitivityConflict.food,
                          name: alt.name,
                          emoji: alt.emoji,
                          weightGrams: weight,
                          sugar: 0.5,
                          calories: 22,
                          protein: 1.0,
                          fat: 0.2,
                          calcium: 26,
                          researchNote: 'Soothing vegetable chosen for Grandma.',
                        };
                      }
                      onAddFood(swappedFood);
                      setPendingSensitivityConflict(null);
                      setInputText('');
                      setStatusMessage(`Swapped to soothing ${alt.name} for Grandma! ✨`);
                      setTimeout(() => setStatusMessage(null), 3500);
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950">
                      <span>{alt.emoji}</span>
                      <span className="group-hover:text-emerald-700">{alt.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{alt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingSensitivityConflict(null)}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddFood(pendingSensitivityConflict.food);
                  setPendingSensitivityConflict(null);
                  setInputText('');
                  setStatusMessage(`Added ${pendingSensitivityConflict.food.name} (marked with digestive note).`);
                  setTimeout(() => setStatusMessage(null), 3000);
                }}
                className="px-4 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
              >
                Keep Cucumber Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOUNDARY CONFLICT INTERCEPTION MODAL */}
      {pendingFoodConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Dietary Boundary Alert
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                  {currentBoundary === 'veg_only' ? 'Pure Veg Boundary' : 'Eggetarian Boundary'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {pendingFoodConflict.warningMessage}
            </p>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <strong className="block mb-1">Recommended Veg Alternative:</strong>
              <span>{pendingFoodConflict.suggestedAlternative}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSwitchToVegAlternative}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all"
              >
                Switch to Veg Alternative (Paneer)
              </button>

              <button
                type="button"
                onClick={handleConfirmConflictAnyway}
                className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Add Anyway
              </button>

              <button
                type="button"
                onClick={() => setPendingFoodConflict(null)}
                className="w-full sm:w-auto py-2.5 px-3 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TODAY'S FOOD LIST WITH VEG / NON-VEG BADGES & CLEAR DELETE OPTION */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Today's Food List ({loggedFoods.length} items)
              </h2>
              <p className="text-xs text-slate-400">
                Nutrients calculated by research. Click Delete to remove any food.
              </p>
            </div>
          </div>

          {/* Veg / Non-Veg Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setBoundaryFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                boundaryFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({loggedFoods.length})
            </button>
            <button
              onClick={() => setBoundaryFilter('veg')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
                boundaryFilter === 'veg'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span>🟢 Veg</span>
            </button>
            <button
              onClick={() => setBoundaryFilter('egg')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
                boundaryFilter === 'egg'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <span>🟡 Egg</span>
            </button>
            <button
              onClick={() => setBoundaryFilter('non_veg')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
                boundaryFilter === 'non_veg'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span>🔴 Non-Veg</span>
            </button>

            {loggedFoods.length > 0 && (
              <button
                onClick={onClearFoods}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2 py-1 ml-1 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredFoods.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-4xl">🥣</div>
            <p className="text-sm font-bold text-slate-700">No foods in this category yet!</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Type what you ate in the text box above (e.g. "200g Greek yogurt" or "100g paneer") and click <strong>Add Food</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFoods.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-pink-200 bg-slate-50/50 hover:bg-pink-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-pink-100 flex items-center justify-center text-2xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform relative">
                    {item.emoji}
                    {/* Tiny Corner Badge for Veg / Non-Veg */}
                    <span className="absolute -top-1 -right-1 text-[11px]" title={item.dietType === 'non_veg' ? 'Non-Vegetarian' : item.dietType === 'egg' ? 'Egg' : 'Vegetarian'}>
                      {item.dietType === 'non_veg' ? '🔴' : item.dietType === 'egg' ? '🟡' : '🟢'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                        {item.name}
                      </h3>

                      {/* Veg / Non-Veg Tag */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold border ${
                        item.dietType === 'non_veg'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.dietType === 'egg'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {item.dietType === 'non_veg' ? '🔴 Non-Veg' : item.dietType === 'egg' ? '🟡 Egg' : '🟢 Veg'}
                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold capitalize">
                        {item.mealType}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-pink-100 text-pink-800 font-bold">
                        ⚖️ {item.weightGrams}g
                      </span>
                    </div>

                    {/* Researched Nutrients Badge */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        🔥 {item.calories} kcal
                      </span>
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        🍗 {item.protein}g Protein
                      </span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        🥑 {item.fat}g Fat
                      </span>
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        🥛 {item.calcium}mg Calcium ⭐
                      </span>
                      <span className={`font-extrabold px-2 py-0.5 rounded-md border ${
                        (item.sugar || 0) > 15
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : (item.sugar || 0) >= 5
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}>
                        🍬 {item.sugar || 0}g Sugar {(item.sugar || 0) > 15 ? '⚠️ Spike Risk' : (item.sugar || 0) >= 5 ? '🟡 Moderate' : '🟢 Safe'}
                      </span>
                    </div>

                    {/* Digestive Sensitivity Alert Badge for Grandma */}
                    {(item.digestiveWarning || item.name.toLowerCase().includes('cucumber')) && (
                      <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 text-[11px]">
                          <span>🥒 May Not Suit Grandma (Digestive Sensitivity)</span>
                        </span>
                        {onUpdateFood && (
                          <button
                            type="button"
                            onClick={() => {
                              const laukiFood = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_lauki_bottle_gourd')!;
                              const recomputed = calculateNutrientsForWeight(laukiFood, item.weightGrams);
                              const swapped: LoggedFood = {
                                ...item,
                                foodId: laukiFood.id,
                                name: 'Stewed Bottle Gourd (Lauki)',
                                emoji: '🥣',
                                ...recomputed,
                                digestiveWarning: undefined,
                                researchNote: 'Swapped for Grandma: Soothing & gentle on digestion (0.5g sugar).',
                              };
                              onUpdateFood(swapped);
                              setStatusMessage('Swapped to gentle Stewed Bottle Gourd (Lauki) for Grandma! ✨');
                              setTimeout(() => setStatusMessage(null), 3500);
                            }}
                            className="font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs text-[11px] flex items-center gap-1 cursor-pointer"
                            title="Swap cucumber for gentle, soothing Stewed Bottle Gourd (Lauki)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Swap to Soothing Lauki (0.5g Sugar)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {item.researchNote && (
                      <p className="text-[11px] text-slate-400 italic">
                        {item.researchNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* THE ACTIONS: EDIT & DELETE */}
                <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => setEditingFood(item)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95"
                    title="Change food data (weight, sugar, calcium, protein, or name)"
                  >
                    <Pencil className="w-3.5 h-3.5 text-purple-600" />
                    <span>Edit Data</span>
                  </button>

                  <button
                    onClick={() => onDeleteFood(item.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95"
                    title="Delete this food from today's intake"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA to Calories Stats Page */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Total calculated calories today: <strong className="text-slate-800">{totals.calories} kcal</strong> ({totals.weightGrams}g food)
          </span>

          <button
            onClick={onGoToCaloriesPage}
            className="flex items-center gap-1 text-purple-700 font-extrabold hover:underline"
          >
            <span>View Full Stats & Macro Breakdown on Page 3 →</span>
          </button>
        </div>
      </div>

      {/* Edit Food Data Modal */}
      <EditFoodModal
        isOpen={!!editingFood}
        food={editingFood}
        onClose={() => setEditingFood(null)}
        onSave={(updated) => {
          if (onUpdateFood) {
            onUpdateFood(updated);
          }
          setStatusMessage(`Updated ${updated.name} successfully! ✨`);
          setTimeout(() => setStatusMessage(null), 3000);
        }}
        onDelete={(id) => {
          onDeleteFood(id);
          setStatusMessage('Item removed.');
          setTimeout(() => setStatusMessage(null), 3000);
        }}
      />
    </div>
  );
};
