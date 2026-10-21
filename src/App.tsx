/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WelcomePage } from './components/WelcomePage';
import { FoodChoicesPage } from './components/FoodChoicesPage';
import { CaloriesDashboardPage } from './components/CaloriesDashboardPage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { AgeWeightCalculatorModal } from './components/AgeWeightCalculatorModal';
import { DEFAULT_FOOD_DATABASE } from './data/foodDatabase';
import { INITIAL_SAMPLE_LOG, createLoggedFoodItem, calculateNutrientsForWeight } from './utils/nutrition';
import { FoodItem, LoggedFood, MealType, UserPreferences, INITIAL_PREFERENCES, FamilyPreset, DEFAULT_FAMILY_PRESETS } from './types';
import { Sparkles, Heart, Bot } from 'lucide-react';

export default function App() {
  // Active page state: 1: welcome, 2: choices, 3: calories, 4: ai-assistant
  const [activePage, setActivePage] = useState<'welcome' | 'choices' | 'calories' | 'ai-assistant'>('welcome');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Family Presets state (stored in localStorage)
  const [familyPresets, setFamilyPresets] = useState<FamilyPreset[]>(() => {
    try {
      const saved = localStorage.getItem('nutripastel_family_presets');
      if (saved) {
        const parsed: FamilyPreset[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_FAMILY_PRESETS;
  });

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('nutripastel_preferences');
      return saved ? JSON.parse(saved) : INITIAL_PREFERENCES;
    } catch {
      return INITIAL_PREFERENCES;
    }
  });

  // Food items list (defaults + user custom foods)
  const [foods, setFoods] = useState<FoodItem[]>(() => {
    try {
      const savedCustom = localStorage.getItem('nutripastel_custom_foods');
      if (savedCustom) {
        const customItems: FoodItem[] = JSON.parse(savedCustom);
        return [...DEFAULT_FOOD_DATABASE, ...customItems];
      }
    } catch {}
    return DEFAULT_FOOD_DATABASE;
  });

  // Logged foods for the day
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>(() => {
    try {
      const saved = localStorage.getItem('nutripastel_food_logs');
      return saved ? JSON.parse(saved) : INITIAL_SAMPLE_LOG;
    } catch {
      return INITIAL_SAMPLE_LOG;
    }
  });

  // Persist family presets
  useEffect(() => {
    try {
      localStorage.setItem('nutripastel_family_presets', JSON.stringify(familyPresets));
    } catch {}
  }, [familyPresets]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem('nutripastel_preferences', JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  // Persist food logs
  useEffect(() => {
    try {
      localStorage.setItem('nutripastel_food_logs', JSON.stringify(loggedFoods));
    } catch {}
  }, [loggedFoods]);

  // Handler: Update preferences
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
  };

  // Handler: Update family presets
  const handleSaveFamilyPresets = (newPresets: FamilyPreset[]) => {
    setFamilyPresets(newPresets);
  };

  // Handler: Select a family preset & load their targets
  const handleSelectFamilyPreset = (preset: FamilyPreset) => {
    const updated: UserPreferences = {
      ...preferences,
      activeProfileId: preset.id,
      activeProfileName: preset.name,
      activeProfileEmoji: preset.emoji,
      age: preset.age,
      weightKg: preset.weightKg,
      heightCm: preset.heightCm || (preset.gender === 'female' ? 158 : 172),
      gender: preset.gender,
      activityLevel: preset.activityLevel || 'lightly_active',
      hasDiabetes: preset.hasDiabetes,
      diabetesMode: preset.hasDiabetes,
      sensitiveFoods: preset.sensitiveFoods || [],
      preferenceNotes: preset.notes || '',
      calorieTarget: preset.calorieTarget || 1650,
      proteinTarget: preset.proteinTarget || 65,
      fatTarget: preset.fatTarget || 52,
      calciumTarget: preset.calciumTarget || 1200,
      sugarLimit: preset.sugarLimit || 20,
      waterTarget: preset.waterTarget || 8,
    };
    setPreferences(updated);
  };

  // Handler: Add Custom Food
  const handleAddCustomFood = (newFood: FoodItem) => {
    setFoods((prev) => {
      const updated = [newFood, ...prev];
      try {
        const customOnly = updated.filter((f) => f.isCustom);
        localStorage.setItem('nutripastel_custom_foods', JSON.stringify(customOnly));
      } catch {}
      return updated;
    });
  };

  // Handler: Add Direct Researched Food
  const handleDirectAddFood = (researchedFood: LoggedFood) => {
    setLoggedFoods((prev) => [researchedFood, ...prev]);
  };

  // Handler: Add Food to Log (from preset/catalog)
  const handleAddFoodLog = (food: FoodItem, weightGrams: number, mealType: MealType) => {
    const newLogItem = createLoggedFoodItem(food, weightGrams, mealType);
    setLoggedFoods((prev) => [newLogItem, ...prev]);
  };

  // Handler: Delete logged food
  const handleDeleteLog = (id: string) => {
    setLoggedFoods((prev) => prev.filter((item) => item.id !== id));
  };

  // Handler: Update logged food data (full edit)
  const handleUpdateFood = (updatedItem: LoggedFood) => {
    setLoggedFoods((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  // Handler: Update logged food weight
  const handleUpdateWeight = (id: string, deltaGrams: number) => {
    setLoggedFoods((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newWeight = Math.max(10, item.weightGrams + deltaGrams);
        const baseFood = foods.find((f) => f.id === item.foodId) || {
          id: item.foodId,
          name: item.name,
          category: 'protein',
          emoji: item.emoji,
          caloriesPer100g: Math.round((item.calories / item.weightGrams) * 100),
          proteinPer100g: Math.round(((item.protein / item.weightGrams) * 100) * 10) / 10,
          fatPer100g: Math.round(((item.fat / item.weightGrams) * 100) * 10) / 10,
          calciumPer100g: Math.round((item.calcium / item.weightGrams) * 100),
          carbsPer100g: Math.round(((item.carbs / item.weightGrams) * 100) * 10) / 10,
          sugarPer100g: Math.round((((item.sugar || 0) / item.weightGrams) * 100) * 10) / 10,
          defaultWeightGrams: 100,
        };

        const recomputed = calculateNutrientsForWeight(baseFood as FoodItem, newWeight);
        return {
          ...item,
          weightGrams: newWeight,
          ...recomputed,
        };
      })
    );
  };

  // Handler: Clear all logs
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to reset your plate for today?')) {
      setLoggedFoods([]);
    }
  };

  // Handler: Load sample day
  const handleLoadSample = () => {
    setLoggedFoods(INITIAL_SAMPLE_LOG);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF8] text-slate-800 flex flex-col selection:bg-pink-200 selection:text-pink-900 relative">
      {/* Top Cute Pastel Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-pink-400 via-purple-300 via-teal-300 to-amber-300" />

      {/* Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        loggedFoods={loggedFoods}
        preferences={preferences}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        familyPresets={familyPresets}
        onSelectFamilyPreset={handleSelectFamilyPreset}
      />

      {/* Page Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 transition-all duration-300">
        {activePage === 'welcome' && (
          <WelcomePage
            onStartTracking={() => setActivePage('choices')}
            onViewStats={() => setActivePage('calories')}
            preferences={preferences}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
          />
        )}

        {activePage === 'choices' && (
          <FoodChoicesPage
            preferences={preferences}
            loggedFoods={loggedFoods}
            onAddFood={handleDirectAddFood}
            onUpdateFood={handleUpdateFood}
            onDeleteFood={handleDeleteLog}
            onClearFoods={handleClearAll}
            onUpdatePreferences={handleUpdatePreferences}
            onGoToCaloriesPage={() => setActivePage('calories')}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
          />
        )}

        {activePage === 'calories' && (
          <CaloriesDashboardPage
            loggedFoods={loggedFoods}
            preferences={preferences}
            onDeleteLog={handleDeleteLog}
            onUpdateWeight={handleUpdateWeight}
            onUpdateFood={handleUpdateFood}
            onClearAll={handleClearAll}
            onLoadSample={handleLoadSample}
            onGoToFoodChoices={() => setActivePage('choices')}
            onAddQuickFood={handleAddFoodLog}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
          />
        )}

        {activePage === 'ai-assistant' && (
          <AIAssistantPage
            preferences={preferences}
            loggedFoods={loggedFoods}
            familyPresets={familyPresets}
            onSelectFamilyPreset={handleSelectFamilyPreset}
            onAddFood={handleDirectAddFood}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
          />
        )}
      </main>

      {/* Floating NutriAI Quick Trigger Button (visible when not on AI page) */}
      {activePage !== 'ai-assistant' && (
        <button
          onClick={() => setActivePage('ai-assistant')}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-300/60 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group border-2 border-white"
          title="Open NutriAI Nutrition Assistant"
        >
          <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
          <span>Ask NutriAI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Personalized Age & Weight Health Calculator Modal */}
      <AgeWeightCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        preferences={preferences}
        onSavePreferences={handleUpdatePreferences}
        familyPresets={familyPresets}
        onSaveFamilyPresets={handleSaveFamilyPresets}
      />

      {/* Aesthetic Pastel Footer */}
      <footer className="mt-12 border-t border-pink-100 bg-white/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🥑</span>
            <span className="font-extrabold text-slate-800">NutriPastel</span>
            <span>·</span>
            <span className="text-pink-600 font-semibold">Created by Iyra Upadhyay</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap justify-center">
            <span>1. Welcome</span>
            <span>·</span>
            <span>2. Food Choices</span>
            <span>·</span>
            <span>3. Calories & Calcium</span>
            <span>·</span>
            <span className="text-purple-600 font-bold">4. NutriAI Family Assistant</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-pink-500 font-medium">
            <Heart className="w-3 h-3 fill-pink-400" />
            <span>Eat joyful, stay healthy!</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
