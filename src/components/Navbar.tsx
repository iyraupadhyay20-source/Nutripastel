import React, { useState } from 'react';
import { Heart, Sparkles, Utensils, PieChart, Info, Flame, Milk, Bot, Users, ChevronDown, Check } from 'lucide-react';
import { LoggedFood, UserPreferences, FamilyPreset } from '../types';
import { sumNutrients } from '../utils/nutrition';

interface NavbarProps {
  activePage: 'welcome' | 'choices' | 'calories' | 'ai-assistant';
  setActivePage: (page: 'welcome' | 'choices' | 'calories' | 'ai-assistant') => void;
  loggedFoods: LoggedFood[];
  preferences: UserPreferences;
  onOpenCalculator?: () => void;
  familyPresets?: FamilyPreset[];
  onSelectFamilyPreset?: (preset: FamilyPreset) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  loggedFoods,
  preferences,
  onOpenCalculator,
  familyPresets = [],
  onSelectFamilyPreset,
}) => {
  const [isFamilyDropdownOpen, setIsFamilyDropdownOpen] = useState(false);

  const totals = sumNutrients(loggedFoods);
  const activeEmoji = preferences.activeProfileEmoji || '👵';
  const activeName = preferences.activeProfileName || 'Grandmother';

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-pink-100 shadow-[0_2px_15px_rgba(244,114,182,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Creator Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => setActivePage('welcome')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-300 via-rose-200 to-amber-100 flex items-center justify-center shadow-sm text-xl border border-pink-200 group-hover:scale-105 transition-transform">
              🥑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                  NutriPastel
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold border border-pink-200">
                  Family Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>By</span>
                <span className="text-pink-600 font-semibold">Iyra Upadhyay</span>
                <span>✨</span>
              </p>
            </div>
          </button>

          {/* Quick Stat Pill for Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setActivePage('ai-assistant')}
              className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-semibold text-purple-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI</span>
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{totals.calories} kcal</span>
            </div>
          </div>
        </div>

        {/* 4 Main Navigation Buttons */}
        <nav className="flex items-center gap-1 p-1 bg-pink-50/80 border border-pink-100 rounded-2xl w-full sm:w-auto justify-center flex-wrap">
          <button
            onClick={() => setActivePage('welcome')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activePage === 'welcome'
                ? 'bg-white text-pink-700 shadow-sm border border-pink-200 scale-[1.02]'
                : 'text-slate-600 hover:text-pink-600 hover:bg-white/50'
            }`}
          >
            <Info className="w-4 h-4 text-pink-500" />
            <span>1. Welcome</span>
          </button>

          <button
            onClick={() => setActivePage('choices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activePage === 'choices'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 scale-[1.02]'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-white/50'
            }`}
          >
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>2. Choices</span>
          </button>

          <button
            onClick={() => setActivePage('calories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 relative ${
              activePage === 'calories'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200 scale-[1.02]'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-white/50'
            }`}
          >
            <PieChart className="w-4 h-4 text-indigo-500" />
            <span>3. Stats</span>
            {loggedFoods.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </button>

          {/* New 4th Tab: AI Assistant */}
          <button
            onClick={() => setActivePage('ai-assistant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 relative ${
              activePage === 'ai-assistant'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-200 scale-[1.02]'
                : 'text-purple-700 hover:bg-purple-100/70 hover:text-purple-900'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activePage === 'ai-assistant' ? 'text-amber-200 animate-spin' : 'text-purple-600'}`} />
            <span>4. NutriAI</span>
            <span className={`text-[9px] px-1 py-0.2 rounded-full font-black ${
              activePage === 'ai-assistant' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-900'
            }`}>
              AI
            </span>
          </button>
        </nav>

        {/* Family Member Profile Selector & Nutrition Summary */}
        <div className="flex items-center gap-2">
          {/* Family Member Quick Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFamilyDropdownOpen(!isFamilyDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-900 text-xs font-bold transition-all border border-pink-200 shadow-2xs active:scale-95"
              title="Switch or customize family member profile"
            >
              <span className="text-sm">{activeEmoji}</span>
              <span className="font-extrabold max-w-[90px] truncate">{activeName}</span>
              <span className="text-[10px] text-pink-700 font-semibold hidden sm:inline">({preferences.age}y)</span>
              <ChevronDown className="w-3.5 h-3.5 text-pink-600" />
            </button>

            {/* Dropdown Menu */}
            {isFamilyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFamilyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white border border-pink-200 shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Family Members</span>
                    <span>{familyPresets.length} profiles</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {familyPresets.map((preset) => {
                      const isSelected = preset.id === preferences.activeProfileId;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (onSelectFamilyPreset) onSelectFamilyPreset(preset);
                            setIsFamilyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-pink-50 text-pink-900 font-bold border border-pink-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{preset.emoji}</span>
                            <div>
                              <span className="text-xs font-bold block leading-tight">{preset.name}</span>
                              <span className="text-[10px] text-slate-500 block">
                                {preset.age}y · {preset.weightKg}kg · {preset.hasDiabetes ? '🩸 Diabetes' : 'Standard'}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-pink-600" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1">
                    {onOpenCalculator && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsFamilyDropdownOpen(false);
                          onOpenCalculator();
                        }}
                        className="w-full py-1.5 px-2 text-center text-xs font-bold text-pink-600 hover:bg-pink-50 rounded-xl transition-colors"
                      >
                        ⚙️ Manage & Add Family Presets
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop Macro Highlights */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <div>
                <span className="text-[9px] uppercase text-amber-600 block leading-none font-bold">Calories</span>
                <span className="font-extrabold text-amber-900 text-xs">{totals.calories} <span className="font-normal text-amber-700 text-[10px]">/ {preferences.calorieTarget}</span></span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl text-xs">
              <Milk className="w-3.5 h-3.5 text-indigo-500" />
              <div>
                <span className="text-[9px] uppercase text-indigo-600 block leading-none font-bold">Calcium</span>
                <span className="font-extrabold text-indigo-900 text-xs">{totals.calcium} <span className="font-normal text-indigo-700 text-[10px]">/ {preferences.calciumTarget}mg</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
