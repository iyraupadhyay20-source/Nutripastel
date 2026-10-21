import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Dumbbell,
  Droplet,
  Milk,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Heart,
  RotateCcw,
  CheckCircle,
  Copy,
  Info,
  Scale,
  Lightbulb,
  Check,
  Pencil,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { FoodItem, LoggedFood, MealType, UserPreferences } from '../types';
import { sumNutrients, calculateNutrientsForWeight } from '../utils/nutrition';
import { DEFAULT_FOOD_DATABASE } from '../data/foodDatabase';
import { EditFoodModal } from './EditFoodModal';

interface CaloriesDashboardPageProps {
  loggedFoods: LoggedFood[];
  preferences: UserPreferences;
  onDeleteLog: (id: string) => void;
  onUpdateWeight: (id: string, deltaGrams: number) => void;
  onUpdateFood?: (food: LoggedFood) => void;
  onClearAll: () => void;
  onLoadSample: () => void;
  onGoToFoodChoices: () => void;
  onAddQuickFood?: (food: FoodItem, weightGrams: number, mealType: MealType) => void;
  onOpenCalculator?: () => void;
}

export const CaloriesDashboardPage: React.FC<CaloriesDashboardPageProps> = ({
  loggedFoods,
  preferences,
  onDeleteLog,
  onUpdateWeight,
  onUpdateFood,
  onClearAll,
  onLoadSample,
  onGoToFoodChoices,
  onAddQuickFood,
  onOpenCalculator,
}) => {
  const [mealFilter, setMealFilter] = useState<'all' | MealType>('all');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [recommendationAddedMsg, setRecommendationAddedMsg] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<LoggedFood | null>(null);

  const totals = sumNutrients(loggedFoods);

  // Targets
  const calTarget = preferences.calorieTarget || 2000;
  const protTarget = preferences.proteinTarget || 80;
  const fatTarget = preferences.fatTarget || 65;
  const calciumTarget = preferences.calciumTarget || 1000;

  // Percentages
  const calPercent = Math.min(150, Math.round((totals.calories / calTarget) * 100));
  const protPercent = Math.min(150, Math.round((totals.protein / protTarget) * 100));
  const fatPercent = Math.min(150, Math.round((totals.fat / fatTarget) * 100));
  const calciumPercent = Math.min(150, Math.round((totals.calcium / calciumTarget) * 100));

  // Calories remaining or surplus
  const calDiff = totals.calories - calTarget;
  const calRemaining = Math.max(0, calTarget - totals.calories);

  // Macro calorie contributions (Protein: 4 kcal/g, Fat: 9 kcal/g, Carbs: 4 kcal/g)
  const calFromProtein = Math.round(totals.protein * 4);
  const calFromFat = Math.round(totals.fat * 9);
  const calFromCarbs = Math.round(totals.carbs * 4);
  const macroTotalKcal = (calFromProtein + calFromFat + calFromCarbs) || 1;

  const proteinRatio = Math.round((calFromProtein / macroTotalKcal) * 100);
  const fatRatio = Math.round((calFromFat / macroTotalKcal) * 100);
  const carbsRatio = Math.max(0, 100 - proteinRatio - fatRatio);

  // Meal breakdown
  const mealBreakdown: Record<MealType, { count: number; calories: number; calcium: number; protein: number }> = {
    breakfast: { count: 0, calories: 0, calcium: 0, protein: 0 },
    lunch: { count: 0, calories: 0, calcium: 0, protein: 0 },
    dinner: { count: 0, calories: 0, calcium: 0, protein: 0 },
    snack: { count: 0, calories: 0, calcium: 0, protein: 0 },
  };

  loggedFoods.forEach(item => {
    mealBreakdown[item.mealType].count += 1;
    mealBreakdown[item.mealType].calories += item.calories;
    mealBreakdown[item.mealType].calcium += item.calcium;
    mealBreakdown[item.mealType].protein += item.protein;
  });

  // Top calorie contributors
  const sortedByCalories = [...loggedFoods].sort((a, b) => b.calories - a.calories);
  // Top calcium contributors
  const sortedByCalcium = [...loggedFoods].sort((a, b) => b.calcium - a.calcium);

  // Filtered food list
  const filteredList = mealFilter === 'all'
    ? loggedFoods
    : loggedFoods.filter(f => f.mealType === mealFilter);

  // Celebrate with confetti
  const handleCelebrate = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F472B6', '#C084FC', '#60A5FA', '#34D399', '#FBBF24'],
      });
    } catch {}
  };

  // Copy summary to clipboard
  const handleCopySummary = () => {
    const text = `🥗 NutriPastel Day Intake Summary (Created by Iyra Upadhyay for Grandmother):
🔥 Calories Changed To: ${totals.calories} / ${calTarget} kcal (${calPercent}%)
🍬 Sugar (Diabetes Care): ${totals.sugar}g / ${preferences.sugarLimit || 25}g limit (${totals.sugar > (preferences.sugarLimit || 25) ? '⚠️ Above Limit' : '🟢 Safe'})
🍗 Protein: ${totals.protein}g / ${protTarget}g (${protPercent}%)
🥑 Healthy Fat: ${totals.fat}g / ${fatTarget}g (${fatPercent}%)
🥛 Calcium: ${totals.calcium}mg / ${calciumTarget}mg (${calciumPercent}%)
🌾 Total Carbs: ${totals.carbs}g
Total Foods Eaten: ${loggedFoods.length} items (${totals.weightGrams}g food weight)
Dietary Notes: ${preferences.preferenceNotes}`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Adaptive recommendation helper: based on today's food, find what's missing
  const getSmartRecommendations = () => {
    const suggestions: { title: string; desc: string; food: FoodItem; weight: number; benefit: string }[] = [];

    // Calcium deficiency recommendation (Prioritizing Indian diabetic staples)
    if (totals.calcium < calciumTarget) {
      const paneer = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_paneer');
      const dahi = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_dahi_curd');
      const chaas = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_chaas_buttermilk');
      const ragi = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_ragi_roti');
      const milk = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_milk_whole');

      if (paneer) {
        suggestions.push({
          title: 'Add Fresh Paneer Cubes (60g)',
          desc: `Adds 288mg bioavailable Calcium & 11g Protein for bone strength with only 1.2g sugar!`,
          food: paneer,
          weight: 60,
          benefit: '+288mg Calcium & 11g Protein',
        });
      }
      if (dahi && suggestions.length < 2) {
        suggestions.push({
          title: 'Add Homemade Dahi / Plain Curd (150g)',
          desc: `Adds 188mg Calcium with gut probiotics that naturally help blunt blood sugar spikes.`,
          food: dahi,
          weight: 150,
          benefit: '+188mg Calcium (Probiotic)',
        });
      }
      if (chaas && suggestions.length < 3) {
        suggestions.push({
          title: 'Add Spiced Chaas with Roasted Jeera (200ml)',
          desc: `Cooling buttermilk adding 144mg Calcium and soothing Grandma's digestion.`,
          food: chaas,
          weight: 200,
          benefit: '+144mg Calcium & Cooling',
        });
      }
      if (ragi && suggestions.length < 3) {
        suggestions.push({
          title: 'Add 1 Ragi Roti (40g)',
          desc: `Calcium-rich millet roti with 138mg Calcium and low-glycemic fiber.`,
          food: ragi,
          weight: 40,
          benefit: '+138mg Calcium (Millet)',
        });
      }
      if (milk && suggestions.length < 3) {
        suggestions.push({
          title: 'Add 1 Cup Warm Milk (200ml)',
          desc: `Delivers 240mg Calcium & 6.4g Protein for evening bone nourishment.`,
          food: milk,
          weight: 200,
          benefit: '+240mg Calcium',
        });
      }
    }

    // Protein deficiency recommendation (Authentic Indian Vegetarian / Eggetarian)
    if (totals.protein < protTarget && suggestions.length < 3) {
      const isEggetarian = preferences.dietBoundary === 'eggetarian';
      const isAll = preferences.dietBoundary === 'all';
      const moongDal = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_moong_dal');
      const besanCheela = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_besan_cheela');
      const roastedChana = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_roasted_chana');
      const paneer = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_paneer');
      const egg = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_egg_whole');

      if (moongDal && !suggestions.some(s => s.food.id === 'food_moong_dal')) {
        suggestions.push({
          title: 'Add 1 Bowl Cooked Yellow Moong Dal (150g)',
          desc: `Adds 7.5g light vegetarian protein with soluble fiber that stabilizes blood glucose.`,
          food: moongDal,
          weight: 150,
          benefit: '🟢 +7.5g Plant Protein',
        });
      } else if (besanCheela) {
        suggestions.push({
          title: 'Add 1 Besan Cheela (80g)',
          desc: `Savory gram flour pancake with 6.8g protein and low glycemic index.`,
          food: besanCheela,
          weight: 80,
          benefit: '🟢 +6.8g Protein',
        });
      } else if (roastedChana) {
        suggestions.push({
          title: 'Add Roasted Chana / Bhuna Chana (30g)',
          desc: `Adds 6.2g protein and high fiber to prevent between-meal sugar crashes.`,
          food: roastedChana,
          weight: 30,
          benefit: '🟢 +6.2g Protein (Low GI)',
        });
      } else if (paneer && !suggestions.some(s => s.food.id === 'food_paneer')) {
        suggestions.push({
          title: 'Add Fresh Paneer Cubes (60g)',
          desc: `Adds 11g pure vegetarian protein to support senior muscle tone.`,
          food: paneer,
          weight: 60,
          benefit: '🟢 +11g Protein',
        });
      }

      if ((isEggetarian || isAll) && egg && suggestions.length < 3) {
        suggestions.push({
          title: 'Add 1 Whole Boiled Egg (50g)',
          desc: `6.5g complete protein fuel with 0g added sugar and only 78 kcal!`,
          food: egg,
          weight: 50,
          benefit: '🟡 +6.5g Protein',
        });
      }
    }

    // If both are met, suggest soothing low-sugar Indian vegetable / hydration
    if (suggestions.length === 0) {
      const lauki = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_lauki_bottle_gourd');
      const chaas = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_chaas_buttermilk');
      const methi = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_methi_water');

      if (lauki) {
        suggestions.push({
          title: 'Add Stewed Bottle Gourd / Lauki (150g)',
          desc: `Soothing, hydrating Indian sabzi with only 0.8g sugar; gentle on Grandma's digestion.`,
          food: lauki,
          weight: 150,
          benefit: 'Soothing & 0.8g Sugar',
        });
      } else if (chaas) {
        suggestions.push({
          title: 'Add Spiced Chaas (200ml)',
          desc: `Refreshing probiotic drink with roasted cumin to aid gentle digestion.`,
          food: chaas,
          weight: 200,
          benefit: 'Probiotics & Calcium',
        });
      } else if (methi) {
        suggestions.push({
          title: 'Add Warm Methi Dana Water (150ml)',
          desc: `Natural Ayurvedic tonic with 0.1g sugar to stimulate natural insulin sensitivity.`,
          food: methi,
          weight: 150,
          benefit: 'Blood Sugar Balancer',
        });
      }
    }

    return suggestions;
  };

  const smartRecommendations = getSmartRecommendations();

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-3 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-pink-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 mb-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Page 3 of 3 · Calories & Nutrition Stats</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Calories & Nutrition Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            See how your foods for the day changed your calories, energy balance, protein, fats, and calcium!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCalculator && (
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-extrabold text-xs sm:text-sm border border-pink-200 shadow-2xs hover:shadow-xs active:scale-95 transition-all"
              title="Recalculate targets based on Grandma's age & weight"
            >
              <span>🧮</span>
              <span>Age {preferences.age || 72} · {preferences.weightKg || 58}kg</span>
            </button>
          )}

          <button
            onClick={onGoToFoodChoices}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Change Food Choices</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC HOW YOUR FOOD CHANGED YOUR CALORIES BANNER */}
      <div className="rounded-3xl bg-gradient-to-br from-white via-pink-50/40 to-purple-50/40 border-2 border-pink-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-pink-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 text-white flex items-center justify-center text-xl shadow-xs">
              📊
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-pink-600 uppercase tracking-wider block">
                Food-to-Calorie Dynamic Analysis
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                How Your Food Today Changed Your Calories & Macros
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCelebrate}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-100 text-pink-800 hover:bg-pink-200 transition-colors flex items-center gap-1"
            >
              <span>Celebrate Today ✨</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotification ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic verdict based on today's food */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Sugar & Diabetes Verdict */}
          <div className={`p-4 rounded-2xl border space-y-1.5 ${
            totals.sugar > (preferences.sugarLimit || 25)
              ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-200'
              : 'bg-emerald-50/80 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={`flex items-center gap-1 ${totals.sugar > (preferences.sugarLimit || 25) ? 'text-rose-800' : 'text-emerald-800'}`}>
                <span>🍬 Diabetes & Sugar</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                totals.sugar > (preferences.sugarLimit || 25)
                  ? 'bg-rose-200 text-rose-900'
                  : 'bg-emerald-200 text-emerald-900'
              }`}>
                {Math.round((totals.sugar / (preferences.sugarLimit || 25)) * 100)}% of Limit
              </span>
            </div>
            <div className={`text-2xl font-black ${totals.sugar > (preferences.sugarLimit || 25) ? 'text-rose-950' : 'text-emerald-950'}`}>
              {totals.sugar}g <span className="text-xs font-normal text-slate-600">/ {preferences.sugarLimit || 25}g max</span>
            </div>
            <p className={`text-xs leading-normal ${totals.sugar > (preferences.sugarLimit || 25) ? 'text-rose-800' : 'text-emerald-800'}`}>
              {totals.sugar <= (preferences.sugarLimit || 25)
                ? `Grandmother's blood sugar is safe! Total sugar (${totals.sugar}g) is within the diabetic threshold.`
                : `⚠️ Sugar Alert for Grandmother! Exceeded safe limit by +${Math.round((totals.sugar - (preferences.sugarLimit || 25)) * 10) / 10}g. Balance with greens or paneer.`}
            </p>
          </div>

          {/* Calorie Verdict */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Calorie Verdict</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-extrabold">
                {calPercent}% of Goal
              </span>
            </div>
            <div className="text-2xl font-black text-amber-950">
              {totals.calories} <span className="text-xs font-normal text-amber-800">/ {calTarget} kcal</span>
            </div>
            <p className="text-xs text-amber-800 leading-normal">
              {calDiff < -100
                ? `You have ${calRemaining} kcal remaining today (a mild calorie deficit). Perfect for light, healthy eating!`
                : calDiff <= 100
                ? `Spot-on maintenance! Today's food intake matches your daily energy expenditure within 5%.`
                : `You are in a surplus of +${calDiff} kcal today. Great fuel for active days!`}
            </p>
          </div>

          {/* Calcium Verdict */}
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-800">
              <span className="flex items-center gap-1">
                <Milk className="w-3.5 h-3.5 text-indigo-500" />
                <span>Calcium & Bones ⭐</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-900 font-extrabold">
                {calciumPercent}% RDA
              </span>
            </div>
            <div className="text-2xl font-black text-indigo-950">
              {totals.calcium} <span className="text-xs font-normal text-indigo-800">/ {calciumTarget} mg</span>
            </div>
            <p className="text-xs text-indigo-800 leading-normal">
              {totals.calcium >= calciumTarget
                ? `Outstanding! Provides 100% of Grandmother's daily Calcium, protecting her bone density & strength!`
                : `You are at ${totals.calcium}mg (${Math.max(0, calciumTarget - totals.calcium)}mg to goal). Check smart suggestions below to top up!`}
            </p>
          </div>

          {/* Protein & Repair Verdict */}
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-rose-800">
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-rose-500" />
                <span>Protein Fuel</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 font-extrabold">
                {protPercent}%
              </span>
            </div>
            <div className="text-2xl font-black text-rose-950">
              {totals.protein}g <span className="text-xs font-normal text-rose-800">/ {protTarget}g</span>
            </div>
            <p className="text-xs text-rose-800 leading-normal">
              {totals.protein >= protTarget
                ? `Optimal protein target achieved! Supports cellular repair, muscle tone, and daytime fullness.`
                : `Currently at ${totals.protein}g. Need ${Math.round((protTarget - totals.protein) * 10) / 10}g more protein to reach daily target.`}
            </p>
          </div>
        </div>
      </div>

      {/* TOP 5 PASTEL NUTRIENT HERO CARDS WITH LIVE BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CARD 1: CALORIES */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border border-amber-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                  🔥
                </div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Calories</span>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {calPercent}%
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800">{totals.calories}</span>
                <span className="text-xs text-slate-500 font-medium">/ {calTarget} kcal</span>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                {calRemaining > 0 ? `${calRemaining} kcal left today` : 'Target met or exceeded! 🎉'}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-amber-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                style={{ width: `${Math.min(100, calPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0 kcal</span>
              <span>{calTarget} kcal</span>
            </div>
          </div>
        </div>

        {/* CARD 2: PROTEIN */}
        <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50/50 to-white border border-rose-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg">
                  🍗
                </div>
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Protein</span>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {protPercent}%
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800">{totals.protein}</span>
                <span className="text-xs text-slate-500 font-medium">/ {protTarget}g</span>
              </div>
              <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                {totals.protein >= protTarget ? 'Muscle fuel optimal! ✨' : `${Math.round((protTarget - totals.protein) * 10) / 10}g to target`}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-rose-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-400 transition-all duration-500"
                style={{ width: `${Math.min(100, protPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0g</span>
              <span>{protTarget}g</span>
            </div>
          </div>
        </div>

        {/* CARD 3: HEALTHY FAT */}
        <div className="rounded-3xl bg-gradient-to-br from-teal-50 via-emerald-50/40 to-white border border-teal-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center text-lg">
                  🥑
                </div>
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Healthy Fat</span>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {fatPercent}%
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800">{totals.fat}</span>
                <span className="text-xs text-slate-500 font-medium">/ {fatTarget}g</span>
              </div>
              <div className="text-[11px] text-teal-700 font-semibold mt-0.5">
                {totals.fat >= fatTarget ? 'Hormone balance fueled' : `${Math.round((fatTarget - totals.fat) * 10) / 10}g to target`}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-teal-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, fatPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0g</span>
              <span>{fatTarget}g</span>
            </div>
          </div>
        </div>

        {/* CARD 4: CALCIUM */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white border-2 border-indigo-200 p-5 shadow-xs flex flex-col justify-between space-y-4 ring-2 ring-indigo-100/50">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                  🥛
                </div>
                <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                  <span>Calcium</span>
                  <span className="text-amber-500">⭐</span>
                </span>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {calciumPercent}%
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800">{totals.calcium}</span>
                <span className="text-xs text-slate-500 font-medium">/ {calciumTarget}mg</span>
              </div>
              <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                {totals.calcium >= calciumTarget ? 'Bone strength champion! 🦴' : `${Math.max(0, calciumTarget - totals.calcium)}mg to RDA`}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-500"
                style={{ width: `${Math.min(100, calciumPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0mg</span>
              <span>{calciumTarget}mg RDA</span>
            </div>
          </div>
        </div>

        {/* CARD 5: SUGAR INTAKE & DIABETES CARE */}
        <div className={`rounded-3xl border-2 p-5 shadow-xs flex flex-col justify-between space-y-4 ${
          totals.sugar > (preferences.sugarLimit || 25)
            ? 'bg-gradient-to-br from-rose-50 via-red-50/50 to-white border-rose-300 ring-2 ring-rose-200'
            : totals.sugar >= (preferences.sugarLimit || 25) * 0.8
            ? 'bg-gradient-to-br from-amber-50 via-yellow-50/50 to-white border-amber-300'
            : 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-300'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
                  🍬
                </div>
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Sugar</span>
              </div>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                totals.sugar > (preferences.sugarLimit || 25)
                  ? 'bg-rose-100 text-rose-800'
                  : totals.sugar >= (preferences.sugarLimit || 25) * 0.8
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {Math.round((totals.sugar / (preferences.sugarLimit || 25)) * 100)}%
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800">{totals.sugar}g</span>
                <span className="text-xs text-slate-500 font-medium">/ {preferences.sugarLimit || 25}g limit</span>
              </div>
              <div className={`text-[11px] font-bold mt-0.5 ${
                totals.sugar > (preferences.sugarLimit || 25) ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {totals.sugar > (preferences.sugarLimit || 25)
                  ? '⚠️ Exceeded safe limit for Grandmother'
                  : `${Math.round(((preferences.sugarLimit || 25) - totals.sugar) * 10) / 10}g buffer left today`}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totals.sugar > (preferences.sugarLimit || 25)
                    ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, Math.round((totals.sugar / (preferences.sugarLimit || 25)) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0g</span>
              <span>{preferences.sugarLimit || 25}g max</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADAPTIVE RECOMMENDATIONS: WHAT TO EAT NEXT ACCORDING TO TODAY'S FOOD */}
      {smartRecommendations.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/40 border border-indigo-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Adaptive Next Food Suggestions (According to Today's Gaps)
                </h2>
                <p className="text-xs text-slate-500">
                  The app sees what nutrients your food is currently missing today and suggests the best foods:
                </p>
              </div>
            </div>

            {recommendationAddedMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-bounce">
                {recommendationAddedMsg}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {smartRecommendations.map((sug, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{sug.food.emoji}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {sug.benefit}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800">{sug.title}</h3>
                  <p className="text-xs text-slate-600 leading-normal">{sug.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onAddQuickFood) {
                      onAddQuickFood(sug.food, sug.weight, 'snack');
                    } else {
                      onUpdateWeight(loggedFoods[0]?.id || '', 10);
                    }
                    setRecommendationAddedMsg(`Added ${sug.food.name} to today's plate! ✨`);
                    setTimeout(() => setRecommendationAddedMsg(null), 3500);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Add {sug.weight}g to Today's Plate</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEDICATED SECTION: INDIAN DIABETES CARE & SUGGESTIONS TO REDUCE SUGAR */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
              🇮🇳
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ICMR-NIN Verified Indian Nutrition</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                Grandma's Suggestions to Reduce Sugar & Lower Glucose Spikes
              </h2>
              <p className="text-xs text-slate-500">
                Clinically double-checked Indian dietary strategies & soothing foods to stabilize blood glucose without digestive irritation.
              </p>
            </div>
          </div>

          {/* Current Live Sugar Meter */}
          <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs self-start sm:self-auto min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Today's Sugar:</span>
              <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                totals.sugar > (preferences.sugarLimit || 20)
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : totals.sugar >= (preferences.sugarLimit || 20) * 0.75
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {totals.sugar > (preferences.sugarLimit || 20) ? '⚠️ Above Target' : totals.sugar >= (preferences.sugarLimit || 20) * 0.75 ? '🟡 Near Limit' : '🟢 Safe Range'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-800">{totals.sugar}g</span>
              <span className="text-xs text-slate-400 font-semibold">/ {preferences.sugarLimit || 20}g max limit</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totals.sugar > (preferences.sugarLimit || 20)
                    ? 'bg-rose-500'
                    : totals.sugar >= (preferences.sugarLimit || 20) * 0.75
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((totals.sugar / (preferences.sugarLimit || 20)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Clinical Status Message */}
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-start sm:items-center gap-3 ${
          totals.sugar > (preferences.sugarLimit || 20)
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : totals.sugar >= (preferences.sugarLimit || 20) * 0.75
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="text-xl shrink-0">
            {totals.sugar > (preferences.sugarLimit || 20) ? '⚠️' : totals.sugar >= (preferences.sugarLimit || 20) * 0.75 ? '🟡' : '✅'}
          </div>
          <div>
            {totals.sugar > (preferences.sugarLimit || 20) ? (
              <span>
                <strong>Sugar Alert for Grandmother (+{Math.round((totals.sugar - (preferences.sugarLimit || 20)) * 10) / 10}g above target):</strong> Today's total sugar intake has exceeded the safe ceiling. For the next meal, select <strong>Stewed Lauki</strong> (0.8g sugar), <strong>Warm Methi Water</strong> (0.1g sugar), or <strong>Spiced Chaas</strong> below to help blunt post-prandial glycemic spikes!
              </span>
            ) : totals.sugar >= (preferences.sugarLimit || 20) * 0.75 ? (
              <span>
                <strong>Nearing Daily Limit ({Math.round(((preferences.sugarLimit || 20) - totals.sugar) * 10) / 10}g buffer remaining):</strong> Choose low-glycemic, high-fiber Indian vegetables (Lauki, Turai, Palak, Bhindi) and avoid sweets or added table sugar for the rest of today.
              </span>
            ) : (
              <span>
                <strong>Optimal Diabetes Control ({Math.round(((preferences.sugarLimit || 20) - totals.sugar) * 10) / 10}g buffer safe):</strong> Grandmother's blood sugar risk is low today! Keep following the Indian food pairing guidelines below to maintain steady energy.
              </span>
            )}
          </div>
        </div>

        {/* SUGAR-LOWERING INDIAN FOODS: 1-CLICK ADD TO TODAY'S PLATE */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span>🥣 Instant Indian Sugar-Lowering Foods & Tonics (Click to Add):</span>
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold hidden sm:inline">
              Zero Cucumber · Gentle on Grandma's Digestion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                foodId: 'food_lauki_bottle_gourd',
                name: 'Stewed Bottle Gourd (Lauki)',
                weight: 150,
                sugar: '0.8g',
                cal: '24 kcal',
                emoji: '🥣',
                badge: 'Replaces Cucumber',
                benefit: 'Ultra gentle on stomach · 0.8g sugar · Non-gassy hydration',
                tagCol: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              },
              {
                foodId: 'food_methi_water',
                name: 'Warm Methi Dana Water',
                weight: 150,
                sugar: '0.1g',
                cal: '12 kcal',
                emoji: '🍵',
                badge: 'Ayurvedic Regulator',
                benefit: '4-hydroxyisoleucine in fenugreek stimulates natural insulin sensitivity',
                tagCol: 'bg-teal-100 text-teal-800 border-teal-200',
              },
              {
                foodId: 'food_chaas_buttermilk',
                name: 'Spiced Chaas (Roasted Jeera)',
                weight: 200,
                sugar: '3.4g',
                cal: '46 kcal',
                emoji: '🥛',
                badge: '144mg Calcium',
                benefit: 'Lactic acid & probiotics slow gastric transit, flattening glucose curve',
                tagCol: 'bg-indigo-100 text-indigo-800 border-indigo-200',
              },
              {
                foodId: 'food_karela_sabzi',
                name: 'Karela Sabzi (Bitter Gourd)',
                weight: 100,
                sugar: '0.8g',
                cal: '68 kcal',
                emoji: '🥗',
                badge: 'Natural Charantin',
                benefit: 'Plant polypeptide-p mimics insulin to actively lower blood sugar',
                tagCol: 'bg-amber-100 text-amber-800 border-amber-200',
              },
              {
                foodId: 'food_moong_soup',
                name: 'Warm Moong Dal Soup',
                weight: 180,
                sugar: '1.1g',
                cal: '94 kcal',
                emoji: '🍲',
                badge: '7.6g Plant Protein',
                benefit: 'High soluble fiber forms a gel in the gut to slow sugar absorption',
                tagCol: 'bg-rose-100 text-rose-800 border-rose-200',
              },
              {
                foodId: 'food_roasted_chana',
                name: 'Roasted Chana (Bhuna Chana)',
                weight: 30,
                sugar: '0.8g',
                cal: '115 kcal',
                emoji: '🧆',
                badge: 'Low-GI Snack',
                benefit: 'Crunchy high-fiber snack (6.2g protein) that prevents sugar crashes',
                tagCol: 'bg-purple-100 text-purple-800 border-purple-200',
              },
            ].map((item, idx) => {
              const dbFood = DEFAULT_FOOD_DATABASE.find(f => f.id === item.foodId);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${item.tagCol}`}>
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        🍬 {item.sugar} sugar
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800">{item.name}</h4>
                    <p className="text-xs text-slate-600 leading-normal">{item.benefit}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (dbFood && onAddQuickFood) {
                        onAddQuickFood(dbFood, item.weight, 'snack');
                        setRecommendationAddedMsg(`Added ${dbFood.name} to Grandma's plate! ✨`);
                        setTimeout(() => setRecommendationAddedMsg(null), 3500);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add {item.weight}g ({item.cal})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 CLINICAL INDIAN DIETARY PRINCIPLES FOR GRANDMOTHER */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-emerald-100 space-y-3">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <span>📚 5 Evidence-Based Indian Nutrition Rules to Reduce Sugar for Grandma:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-700">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <span className="font-extrabold text-emerald-900 block flex items-center gap-1">
                <span>🥒 1. Gentle Alternative to Cucumber:</span>
              </span>
              <p className="text-slate-600">
                Raw cucumber often creates gas, coldness, or bloating in elderly stomachs. Warm cooked <strong>Stewed Lauki (Bottle Gourd)</strong> or <strong>Turai (Ridge Gourd)</strong> provides the exact same hydration and ultra-low sugar (0.5–0.8g) with soothing digestion.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 space-y-1">
              <span className="font-extrabold text-teal-900 block flex items-center gap-1">
                <span>🫓 2. The 'Dal-Roti Buffer' Rule:</span>
              </span>
              <p className="text-slate-600">
                Never serve handmade Phulka or Rice in isolation. Always pair carbs with <strong>Moong Dal, Dahi, or Paneer</strong>. The protein and healthy fats delay stomach emptying, flattening the post-prandial glycemic spike.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
              <span className="font-extrabold text-indigo-900 block flex items-center gap-1">
                <span>🌾 3. Switch to Ragi & Millets:</span>
              </span>
              <p className="text-slate-600">
                Ragi (Finger Millet / Nachni) provides <strong>344mg of Calcium per 100g</strong> and releases carbs slowly into the bloodstream, avoiding the steep glucose spike associated with polished white rice.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1">
              <span className="font-extrabold text-amber-900 block flex items-center gap-1">
                <span>☕ 4. Masala Chai without Added Sugar:</span>
              </span>
              <p className="text-slate-600">
                Brew Grandma's tea with cinnamon (dalchini) and fresh ginger without table sugar. Cinnamon acts as a natural insulin-sensitizer, whereas 1 single teaspoon of table sugar dumps 5g of pure sucrose.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1 sm:col-span-2">
              <span className="font-extrabold text-rose-900 block flex items-center gap-1">
                <span>🍬 5. Double Check on Indian Sweets (High Spike Alert):</span>
              </span>
              <p className="text-slate-600">
                Traditional sweets are soaked in pure syrup: 1 piece of Gulab Jamun has <strong>22g sugar</strong>, and 2 spirals of Jalebi have <strong>29g sugar</strong>! Even a single sweet will completely breach Grandma's entire daily sugar allowance (20g).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MID SECTION: MACRO RATIOS & MEAL TIMING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Macro Distribution (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Macronutrient Calorie Ratio
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Total: {totals.calories} kcal
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full rounded-xl overflow-hidden flex bg-slate-100 shadow-inner">
              <div
                style={{ width: `${proteinRatio}%` }}
                className="h-full bg-rose-400 hover:opacity-90 transition-all"
                title={`Protein: ${proteinRatio}%`}
              />
              <div
                style={{ width: `${fatRatio}%` }}
                className="h-full bg-teal-400 hover:opacity-90 transition-all"
                title={`Fat: ${fatRatio}%`}
              />
              <div
                style={{ width: `${carbsRatio}%` }}
                className="h-full bg-amber-400 hover:opacity-90 transition-all"
                title={`Carbs: ${carbsRatio}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Protein</span>
                <span className="text-base font-black text-rose-900">{proteinRatio}%</span>
                <span className="text-[10px] text-slate-400 block">{totals.protein}g ({calFromProtein} kcal)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-center">
                <span className="text-[10px] font-bold text-teal-700 uppercase block">Fat</span>
                <span className="text-base font-black text-teal-900">{fatRatio}%</span>
                <span className="text-[10px] text-slate-400 block">{totals.fat}g ({calFromFat} kcal)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Carbs</span>
                <span className="text-base font-black text-amber-900">{carbsRatio}%</span>
                <span className="text-[10px] text-slate-400 block">{totals.carbs}g ({calFromCarbs} kcal)</span>
              </div>
            </div>
          </div>

          {/* Calcium Breakdown */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Milk className="w-3.5 h-3.5 text-indigo-500" />
                <span>Top Calcium Foods Today:</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">{totals.calcium}mg total</span>
            </div>

            {sortedByCalcium.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sortedByCalcium.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center">
                    <span className="text-base block">{item.emoji}</span>
                    <span className="text-[11px] font-bold text-slate-800 truncate block mt-0.5">{item.name}</span>
                    <span className="text-[10px] font-extrabold text-indigo-700">+{item.calcium}mg</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No foods logged yet.</p>
            )}
          </div>
        </div>

        {/* Meal Timing Breakdown (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Calories by Meal Timing
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">4 Meals tracked</span>
          </div>

          <div className="space-y-3">
            {[
              { key: 'breakfast' as MealType, label: 'Breakfast', emoji: '🥞', color: 'from-amber-400 to-orange-300' },
              { key: 'lunch' as MealType, label: 'Lunch', emoji: '🥗', color: 'from-emerald-400 to-teal-300' },
              { key: 'dinner' as MealType, label: 'Dinner', emoji: '🍲', color: 'from-purple-400 to-indigo-300' },
              { key: 'snack' as MealType, label: 'Snacks & Drinks', emoji: '🍓', color: 'from-pink-400 to-rose-300' },
            ].map((meal) => {
              const data = mealBreakdown[meal.key];
              const pct = totals.calories > 0 ? Math.round((data.calories / totals.calories) * 100) : 0;

              return (
                <div key={meal.key} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span>{meal.emoji}</span>
                      <span>{meal.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({data.count} items)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{data.calories} kcal</span>
                      <span className="text-[10px] text-slate-400">({pct}%)</span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meal.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Protein: {Math.round(data.protein * 10) / 10}g</span>
                    <span className="text-indigo-600 font-medium">Calcium: {data.calcium}mg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TODAY'S FOOD LOG WITH INSTANT WEIGHT SLIDERS */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Today's Food Plate ({loggedFoods.length} items, {totals.weightGrams}g total)
              </h2>
              <p className="text-xs text-slate-400">
                Change any food weight below and watch all calories & nutrients immediately update!
              </p>
            </div>
          </div>

          {/* Meal Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setMealFilter(filter)}
                className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-colors ${
                  mealFilter === filter
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Food List Cards */}
        {filteredList.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-4xl">🍽️</div>
            <p className="text-sm font-bold text-slate-700">No foods logged in this section yet!</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Head over to Page 2 (Food Choices) to type or select foods, set their weights, and calculate your calories.
            </p>
            <button
              onClick={onGoToFoodChoices}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-pink-500 text-white font-bold text-xs shadow-sm hover:bg-pink-600 transition-all"
            >
              <span>Add Your First Food</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-pink-200 hover:bg-pink-50/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {item.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-800">{item.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold capitalize border border-purple-100">
                        {item.mealType}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold border ${
                        item.dietType === 'non_veg'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.dietType === 'egg'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {item.dietType === 'non_veg' ? '🔴 Non-Veg' : item.dietType === 'egg' ? '🟡 Egg' : '🟢 Veg'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                      <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {item.calories} kcal
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-rose-600">{item.protein}g Protein</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-teal-600">{item.fat}g Fat</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {item.calcium}mg Calcium
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                        (item.sugar || 0) > 15
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : (item.sugar || 0) >= 5
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}>
                        🍬 {item.sugar || 0}g Sugar {(item.sugar || 0) > 15 ? '⚠️ Spike' : (item.sugar || 0) >= 5 ? '🟡 Mod' : '🟢 Safe'}
                      </span>
                    </div>

                    {/* Digestive Sensitivity Alert Badge for Grandma */}
                    {(item.digestiveWarning || item.name.toLowerCase().includes('cucumber')) && (
                      <div className="flex items-center gap-2 flex-wrap text-xs mt-1.5">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px]">
                          🥒 Doesn't Always Suit Grandma
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
                            }}
                            className="font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs text-[11px] cursor-pointer"
                            title="Swap cucumber for gentle, soothing Stewed Bottle Gourd (Lauki)"
                          >
                            🔄 Swap to Soothing Lauki (0.5g Sugar)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Instant Weight Steppers & Weight Adjuster */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 pl-1">Weight:</span>
                    <button
                      onClick={() => onUpdateWeight(item.id, -10)}
                      title="Reduce weight by 10g"
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition-colors shadow-2xs"
                    >
                      -10g
                    </button>
                    <span className="px-2 font-extrabold text-pink-600 min-w-12 text-center">
                      {item.weightGrams}g
                    </span>
                    <button
                      onClick={() => onUpdateWeight(item.id, 10)}
                      title="Increase weight by 10g"
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition-colors shadow-2xs"
                    >
                      +10g
                    </button>
                  </div>

                  {/* Edit Food Data Button */}
                  <button
                    onClick={() => setEditingFood(item)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95"
                    title="Change food data (weight, sugar, calcium, protein, or name)"
                  >
                    <Pencil className="w-3.5 h-3.5 text-purple-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onDeleteLog(item.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95"
                    title="Delete item from today"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Day</span>
            </button>
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors"
            >
              Clear Today's Plate
            </button>
          </div>

          <p className="text-slate-400 text-[11px]">
            NutriPastel by <strong className="text-slate-600">Iyra Upadhyay</strong> · Real-time calorie calculations
          </p>
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
        }}
        onDelete={(id) => {
          onDeleteLog(id);
        }}
      />
    </div>
  );
};
