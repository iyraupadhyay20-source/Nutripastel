import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Heart,
  Flame,
  Milk,
  ShieldCheck,
  Plus,
  Check,
  RefreshCw,
  Trash2,
  AlertCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { LoggedFood, UserPreferences, FamilyPreset, MealType } from '../types';
import { sumNutrients } from '../utils/nutrition';

interface AIAssistantPageProps {
  preferences: UserPreferences;
  loggedFoods: LoggedFood[];
  familyPresets: FamilyPreset[];
  onSelectFamilyPreset: (preset: FamilyPreset) => void;
  onAddFood: (researchedFood: LoggedFood) => void;
  onOpenCalculator: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedFoods?: {
    name: string;
    emoji: string;
    weightGrams: number;
    calories: number;
    protein: number;
    calcium: number;
    sugar: number;
    mealType: MealType;
    reason: string;
  }[];
  quickActions?: string[];
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg_welcome',
  sender: 'assistant',
  text: `### 🥑 Namaste! I am NutriAI, your Indian Family Diet Assistant

I'm specially designed for **NutriPastel** (created by Iyra Upadhyay) to support your entire family's nutrition — from **Grandmother's gentle diabetic care and bone calcium**, to parents' active stamina, teenagers' growth spurts, and wholesome tiffin meals for kids!

You can ask me about:
* **Blood sugar control**: Indian food swaps to prevent post-meal spikes
* **Bone health & Calcium**: Richest sources in Indian vegetarian cuisine (paneer, chaas, ragi)
* **Family meal ideas**: Healthy dishes for seniors, parents, teens, and children
* **Daily check**: Tap **"Analyze today's food log"** below to see how today's plate measures up!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  quickActions: [
    '📊 Analyze today\'s food log',
    '🩸 How to reduce blood sugar spikes in Indian meals?',
    '🥛 High calcium vegetarian foods without milk',
    '💪 Protein snacks for my 16yo teenager',
    '👧 Wholesome school tiffin ideas for kids',
    '🥒 Why avoid raw cucumber for seniors?',
  ],
};

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  preferences,
  loggedFoods,
  familyPresets,
  onSelectFamilyPreset,
  onAddFood,
  onOpenCalculator,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('nutripastel_ai_chat');
      return saved ? JSON.parse(saved) : [DEFAULT_WELCOME_MESSAGE];
    } catch {
      return [DEFAULT_WELCOME_MESSAGE];
    }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loggedItemsFeedback, setLoggedItemsFeedback] = useState<{ [key: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Today's nutritional totals
  const totals = sumNutrients(loggedFoods);

  // Active family member preset info
  const activePreset = familyPresets.find((p) => p.id === preferences.activeProfileId) || {
    id: preferences.activeProfileId || 'preset_grandma',
    name: preferences.activeProfileName || 'Grandmother',
    role: 'Senior / Dadi',
    emoji: preferences.activeProfileEmoji || '👵',
    age: preferences.age,
    weightKg: preferences.weightKg,
    heightCm: preferences.heightCm,
    gender: preferences.gender,
    activityLevel: preferences.activityLevel,
    hasDiabetes: preferences.hasDiabetes,
    sensitiveFoods: preferences.sensitiveFoods || ['cucumber'],
    dietStyle: preferences.dietStyle,
    notes: preferences.preferenceNotes,
    calorieTarget: preferences.calorieTarget,
    proteinTarget: preferences.proteinTarget,
    calciumTarget: preferences.calciumTarget,
    sugarLimit: preferences.sugarLimit,
  };

  // Persist chat
  useEffect(() => {
    try {
      localStorage.setItem('nutripastel_ai_chat', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const payload = {
        message: userText,
        chatHistory: messages.slice(-6).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
        })),
        familyMember: {
          name: activePreset.name,
          role: activePreset.role,
          age: preferences.age,
          weightKg: preferences.weightKg,
          heightCm: preferences.heightCm,
          gender: preferences.gender,
          hasDiabetes: preferences.hasDiabetes,
          sensitiveFoods: preferences.sensitiveFoods,
          calorieTarget: preferences.calorieTarget,
          proteinTarget: preferences.proteinTarget,
          calciumTarget: preferences.calciumTarget,
          sugarLimit: preferences.sugarLimit,
        },
        todayLogs: {
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCalcium: totals.calcium,
          totalCarbs: totals.carbs,
          totalSugar: totals.sugar,
          items: loggedFoods.map((f) => ({
            name: f.name,
            weightGrams: f.weightGrams,
            calories: f.calories,
            protein: f.protein,
            calcium: f.calcium,
            sugar: f.sugar,
            mealType: f.mealType,
          })),
        },
      };

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data && data.data) {
        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: data.data.text || 'I have analyzed your request based on Indian nutritional guidelines.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedFoods: data.data.suggestedFoods || [],
          quickActions: data.data.quickActions || [
            'Analyze today\'s nutrition',
            'How to reduce sugar in Indian food?',
            'High calcium snacks without milk',
          ],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Invalid response');
      }
    } catch {
      // Local fallback on client if network fails
      const fallbackMsg: ChatMessage = {
        id: `ai_fb_${Date.now()}`,
        sender: 'assistant',
        text: `### 🥑 Nutrition Insight for ${activePreset.name}

To maintain optimal wellness and keep blood sugar safe:
* **Focus on complex fiber**: Handmade whole wheat rotis have 0g added sugar.
* **Calcium intake**: Fresh paneer (60g = ~288mg calcium) or spiced buttermilk (chaas = ~180mg calcium).
* **Sugar moderation**: Sequence sabzi and dal before carbohydrates to slow glucose absorption.

Tap "Analyze today's food log" to inspect today's entries!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          '📊 Analyze today\'s food log',
          '🩸 How to reduce blood sugar spikes in Indian meals?',
          '🥛 High calcium vegetarian foods without milk',
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogSuggestedFood = (food: {
    name: string;
    emoji: string;
    weightGrams: number;
    calories: number;
    protein: number;
    calcium: number;
    sugar: number;
    mealType: MealType;
    reason: string;
  }) => {
    const key = `${food.name}_${food.weightGrams}_${Date.now()}`;
    const newLoggedFood: LoggedFood = {
      id: `ai_log_${Date.now()}`,
      foodId: `custom_${Date.now()}`,
      name: food.name,
      emoji: food.emoji || '🥑',
      weightGrams: food.weightGrams,
      mealType: food.mealType || 'snack',
      calories: food.calories,
      protein: food.protein,
      fat: Math.round(food.calories * 0.25 / 9 * 10) / 10,
      calcium: food.calcium,
      carbs: Math.max(0, Math.round((food.calories - (food.protein * 4) - (food.calories * 0.25)) / 4 * 10) / 10),
      sugar: food.sugar || 0,
      sugarLevel: food.sugar > 15 ? 'high' : food.sugar >= 5 ? 'moderate' : 'low',
      dietType: 'veg',
      researchNote: `NutriAI suggested: ${food.reason}`,
      loggedAt: new Date().toISOString(),
    };

    onAddFood(newLoggedFood);
    setLoggedItemsFeedback((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setLoggedItemsFeedback((prev) => ({ ...prev, [key]: false }));
    }, 2500);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear your conversation with NutriAI?')) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      try {
        localStorage.removeItem('nutripastel_ai_chat');
      } catch {}
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: NutriAI Branding & Active Profile Switcher */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50 border border-purple-200/80 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-400 via-pink-400 to-amber-200 flex items-center justify-center text-3xl shadow-md border-2 border-white shrink-0">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                  NutriAI Family Assistant
                </h1>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 border border-purple-300">
                  Gemini 3.8 · ICMR Indian Standards
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                Your loving AI nutritionist by <span className="font-bold text-pink-600">Iyra Upadhyay</span>.
                Get clinical Indian meal advice, lower glucose spikes, calculate nutrients, and find food solutions for every family age!
              </p>
            </div>
          </div>

          {/* Quick Active Member Pill & Profile Switcher */}
          <div className="p-3 bg-white/90 rounded-2xl border border-purple-200 shadow-2xs space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Chatting For:</span>
              <button
                type="button"
                onClick={onOpenCalculator}
                className="text-[11px] font-bold text-pink-600 hover:text-pink-800 hover:underline"
              >
                ⚙️ Manage Presets
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-xl border border-pink-200">
                {activePreset.emoji || '👵'}
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-xs block">
                  {activePreset.name} ({preferences.age} yrs · {preferences.weightKg} kg)
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 block">
                  {preferences.hasDiabetes ? '🩸 Diabetes Mode ON (≤20g sugar)' : '🌟 Balanced Wellness'}
                </span>
              </div>
            </div>

            {/* Quick Family Member Switching Chips */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-purple-100 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400">Switch:</span>
              {familyPresets.slice(0, 5).map((preset) => {
                const isActive = preset.id === preferences.activeProfileId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectFamilyPreset(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-2xs scale-105'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <span>{preset.emoji}</span> {preset.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-time Nutrition Progress Bar for Active Member */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-purple-200/60">
          <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-xs">
            <span className="text-[10px] font-bold text-amber-600 block">Calories Today</span>
            <span className="font-extrabold text-amber-950 text-sm">
              {totals.calories} <span className="text-[10px] font-normal text-slate-500">/ {preferences.calorieTarget} kcal</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-xs">
            <span className="text-[10px] font-bold text-emerald-600 block">Sugar (Safe Limit)</span>
            <span className="font-extrabold text-emerald-950 text-sm">
              {totals.sugar}g <span className="text-[10px] font-normal text-slate-500">/ {preferences.sugarLimit}g limit</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-200 text-xs">
            <span className="text-[10px] font-bold text-indigo-600 block">Calcium (Bones)</span>
            <span className="font-extrabold text-indigo-950 text-sm">
              {totals.calcium}mg <span className="text-[10px] font-normal text-slate-500">/ {preferences.calciumTarget}mg</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 border border-rose-200 text-xs">
            <span className="text-[10px] font-bold text-rose-600 block">Protein (Muscle)</span>
            <span className="font-extrabold text-rose-950 text-sm">
              {totals.protein}g <span className="text-[10px] font-normal text-slate-500">/ {preferences.proteinTarget}g</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="rounded-3xl bg-white border border-pink-100 shadow-sm overflow-hidden flex flex-col h-[650px] relative">
        {/* Chat Header Bar */}
        <div className="p-3.5 px-5 bg-gradient-to-r from-purple-50 via-pink-50 to-white border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">
              NutriAI Online · Ready to answer questions for {activePreset.name}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FCFAF8]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-2xs border ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white border-pink-300'
                    : 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 border-purple-200'
                }`}
              >
                {msg.sender === 'user' ? (activePreset.emoji || '👤') : '✨'}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-tr-xs'
                    : 'bg-white border border-pink-100/90 text-slate-800 rounded-tl-xs'
                }`}
              >
                {/* Text rendered with simple markdown support */}
                <div className={`text-xs sm:text-sm leading-relaxed space-y-2 whitespace-pre-wrap ${msg.sender === 'user' ? 'text-white' : 'text-slate-800'}`}>
                  {msg.text}
                </div>

                {/* 1-Click Interactive Food Cards (when AI suggests foods) */}
                {msg.suggestedFoods && msg.suggestedFoods.length > 0 && (
                  <div className="pt-3 border-t border-purple-100/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-purple-900">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Recommended Indian Foods for {activePreset.name}:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.suggestedFoods.map((food, fIdx) => {
                        const feedbackKey = `${food.name}_${food.weightGrams}_${fIdx}`;
                        const isAdded = loggedItemsFeedback[feedbackKey];

                        return (
                          <div
                            key={fIdx}
                            className="p-3 rounded-2xl bg-gradient-to-br from-purple-50/60 to-pink-50/60 border border-purple-200 hover:border-purple-300 transition-all flex flex-col justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-2xl">{food.emoji || '🍲'}</span>
                              <div className="flex-1 min-w-0">
                                <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                                  {food.name}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {food.weightGrams}g portion · {food.reason}
                                </span>
                              </div>
                            </div>

                            {/* Macro Badges */}
                            <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                {food.calories} kcal
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                                {food.protein}g P
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                                {food.calcium}mg Ca
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${
                                food.sugar <= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {food.sugar}g sugar
                              </span>
                            </div>

                            {/* 1-Click Log Button */}
                            <button
                              type="button"
                              onClick={() => handleLogSuggestedFood(food)}
                              disabled={isAdded}
                              className={`w-full py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added to Plate!</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Log to Today's Diary</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Follow-up Action Chips */}
                {msg.quickActions && msg.quickActions.length > 0 && msg.sender === 'assistant' && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    {msg.quickActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleSendMessage(action)}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`text-[9px] pt-1 ${
                    msg.sender === 'user' ? 'text-pink-100 text-right' : 'text-slate-400 text-left'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 flex items-center justify-center text-lg border border-purple-200 shadow-2xs animate-bounce">
                ✨
              </div>
              <div className="bg-white border border-pink-100 rounded-3xl p-4 shadow-2xs flex items-center gap-2 text-xs font-semibold text-purple-800">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                <span>NutriAI is thinking & analyzing ICMR guidelines...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-pink-100 space-y-2">
          {/* Quick prompt suggestions bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="font-bold text-slate-400 shrink-0">Quick Ask:</span>
            {[
              '📊 Analyze today\'s food log',
              '🩸 How to prevent sugar spike?',
              '🥛 High calcium without milk',
              '💪 Protein snack for 16yo teen',
              '👧 School tiffin ideas for kids',
              '🫓 Whole wheat roti sugar content',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-pink-50 border border-slate-200 text-slate-700 hover:text-pink-800 font-semibold whitespace-nowrap transition-all shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask NutriAI about food for ${activePreset.name} (e.g. "What low-sugar Indian snacks suit Grandma?")...`}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-pink-200 hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
