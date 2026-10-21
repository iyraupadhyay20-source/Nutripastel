import React from 'react';
import { Sparkles, ArrowRight, Heart, ShieldCheck, Scale, Flame, Dumbbell, Droplet, Milk, CheckCircle2, Calculator, Activity } from 'lucide-react';
import { UserPreferences } from '../types';

interface WelcomePageProps {
  onStartTracking: () => void;
  onViewStats: () => void;
  preferences?: UserPreferences;
  onOpenCalculator?: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onStartTracking,
  onViewStats,
  preferences,
  onOpenCalculator,
}) => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto py-4 px-2 sm:px-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 border border-pink-200/80 p-6 sm:p-10 shadow-[0_10px_30px_rgba(244,114,182,0.12)]">
        {/* Decorative pastel circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-pink-200/50 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-purple-200/50 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            {/* Creator Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-pink-200 shadow-xs text-xs font-bold text-pink-700">
              <Sparkles className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
              <span>Created with love by <span className="underline decoration-pink-300 decoration-2 font-extrabold text-pink-900">Iyra Upadhyay</span> for Grandmother (Diabetes Care) 👵❤️</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 leading-tight">
              Eat Mindfully, Track <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">Colorfully</span> & Care for Diabetes.
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Welcome to <span className="font-bold text-pink-600">NutriPastel</span> — a personalized nutrition tracker crafted by <strong className="text-slate-800 font-semibold">Iyra Upadhyay</strong> for her grandmother with diabetes. Easily monitor daily <strong>Sugar Intake</strong> to prevent glucose spikes, along with <strong>Calcium</strong> for strong bones, <strong>Protein</strong> for vitality, and <strong>Calories</strong>!
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={onStartTracking}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-sm sm:text-base shadow-md shadow-pink-200 hover:shadow-lg hover:shadow-pink-300 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Enter Food Choices</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onViewStats}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/90 text-purple-700 font-bold text-sm sm:text-base border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-xs"
              >
                <span>View Calorie Stats</span>
              </button>
            </div>
          </div>

          {/* Cute Pastel Visual Card */}
          <div className="w-full md:w-auto flex justify-center">
            <div className="w-72 sm:w-80 p-5 rounded-3xl bg-white/95 border border-pink-200/90 shadow-lg relative transform rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🥣</span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">NutriPastel Daily Plate</h2>
                    <span className="text-[11px] text-slate-400">Accurate weight calculator</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Active</span>
              </div>

              {/* Sample micro metrics */}
              <div className="grid grid-cols-2 gap-2.5 my-4">
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
                  <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Calories</span>
                  </div>
                  <div className="text-lg font-extrabold text-amber-900 mt-1">Real-time</div>
                  <div className="text-[10px] text-amber-600">Calculated per gram</div>
                </div>

                <div className="p-2.5 rounded-xl bg-pink-50/80 border border-pink-200/60">
                  <div className="flex items-center gap-1.5 text-pink-700 text-xs font-bold">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Protein</span>
                  </div>
                  <div className="text-lg font-extrabold text-pink-900 mt-1">Grams (g)</div>
                  <div className="text-[10px] text-pink-600">Muscle & repair</div>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200/60">
                  <div className="flex items-center gap-1.5 text-teal-700 text-xs font-bold">
                    <Droplet className="w-3.5 h-3.5" />
                    <span>Healthy Fat</span>
                  </div>
                  <div className="text-lg font-extrabold text-teal-900 mt-1">Grams (g)</div>
                  <div className="text-[10px] text-teal-600">Hormones & cells</div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/60">
                  <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold">
                    <Milk className="w-3.5 h-3.5" />
                    <span>Calcium</span>
                  </div>
                  <div className="text-lg font-extrabold text-indigo-900 mt-1">mg Intake</div>
                  <div className="text-[10px] text-indigo-600">Bones & teeth</div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/90 border border-purple-300 col-span-2">
                  <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
                    <span className="flex items-center gap-1">🍬 Sugar (Diabetes)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 font-extrabold">&lt; 25g Daily Limit</span>
                  </div>
                  <div className="text-base font-extrabold text-purple-950 mt-1">Diabetic Safety Monitor</div>
                  <div className="text-[10px] text-purple-600">Blood glucose spike prevention for Grandmother</div>
                </div>
              </div>

              <div className="text-center p-2 rounded-xl bg-rose-50 border border-rose-100 text-xs font-medium text-rose-700">
                ✨ Accurate research for calories, sugar, protein & calcium!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Dedication & Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Creator Card */}
        <div className="md:col-span-1 rounded-3xl bg-gradient-to-br from-pink-50 via-rose-50 to-white border border-pink-200 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center text-3xl shadow-sm border-2 border-white mb-4">
              👩‍🍳
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">App Creator</span>
              <h2 className="text-xl font-extrabold text-slate-800">Iyra Upadhyay</h2>
            </div>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              "I created this app to make nutrition simple, welcoming, and cute for everyone. Instead of confusing spreadsheets, NutriPastel gives you a personalized food preference box, weight-accurate calculations, and transparent tracking of your calories, protein, fats, and calcium!"
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-pink-100 flex items-center gap-2 text-xs font-bold text-pink-700">
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
            <span>Dedicated to healthy & joyful habits</span>
          </div>
        </div>

        {/* What the App Does */}
        <div className="md:col-span-2 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">What Does NutriPastel Do?</h2>
                <p className="text-xs text-slate-500">Built exactly to keep you healthy, energized, and informed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100 space-y-1.5">
                <div className="flex items-center gap-2 text-pink-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-pink-500" />
                  <span>Tracks Food & Weight</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  Add the exact weight of any food in grams. Whether it is 40g of oats or 180g of chicken, nutrients scale instantly!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Tracks Calcium & Fats</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  Most apps ignore calcium! Here, you can safeguard your bone and dental health with real calcium metrics and healthy fat ratios.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Food Preferences Box</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  A personalized type box where you can specify your diet preferences, cravings, allergies, and daily targets.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span>Calculates Calories & Protein</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  Comprehensive macro dashboard with progress bars, meal distribution, and daily targets.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page 1 of 3 · Created by Iyra Upadhyay</span>
            <button
              onClick={onStartTracking}
              className="text-pink-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Continue to Page 2 (Food Choices)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PERSONALIZED HEALTH & AGE/WEIGHT TARGETS CARD */}
      <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50/60 to-amber-50/70 border border-pink-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 text-white flex items-center justify-center text-2xl shadow-sm">
              🧮
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                  Calculated by Weight & Age
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                  Clinically Calibrated
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeting Grandma's specific metabolic profile: <strong className="text-slate-700">{preferences?.age || 72} years old</strong> · <strong className="text-slate-700">{preferences?.weightKg || 58} kg</strong> · <span className="text-rose-600 font-bold">Diabetes Care Active</span>
              </p>
            </div>
          </div>

          {onOpenCalculator && (
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-pink-100 text-pink-700 font-extrabold text-xs border border-pink-300 shadow-2xs hover:shadow-xs active:scale-95 transition-all self-start sm:self-auto"
            >
              <Calculator className="w-4 h-4 text-pink-500" />
              <span>Change Weight & Age</span>
            </button>
          )}
        </div>

        {/* 4 Scientifically Calculated Targets Display */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Daily Energy Target</span>
            <div className="text-2xl font-black text-amber-950">
              {preferences?.calorieTarget || 1650} <span className="text-xs font-normal text-amber-800">kcal</span>
            </div>
            <p className="text-[10px] text-slate-500">Mifflin-St Jeor equation calibrated for senior female metabolism.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 border border-rose-200 shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Geriatric Protein Target</span>
            <div className="text-2xl font-black text-rose-950">
              {preferences?.proteinTarget || 65} <span className="text-xs font-normal text-rose-800">g</span>
            </div>
            <p className="text-[10px] text-slate-500">1.15g/kg for senior bone & muscle maintenance (ESPEN guidelines).</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 border border-indigo-200 shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block">Bone Calcium Target</span>
            <div className="text-2xl font-black text-indigo-950">
              {preferences?.calciumTarget || 1200} <span className="text-xs font-normal text-indigo-800">mg</span>
            </div>
            <p className="text-[10px] text-slate-500">1,200mg/day to protect bone density in women age 51+.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200 shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Diabetic Sugar Cap</span>
            <div className="text-2xl font-black text-emerald-950">
              ≤{preferences?.sugarLimit || 20} <span className="text-xs font-normal text-emerald-800">g</span>
            </div>
            <p className="text-[10px] text-slate-500">Strictly ≤5% daily calories to avoid blood glucose spikes.</p>
          </div>
        </div>
      </div>

      {/* Deep Dive: The 4 Key Nutrients Tracked */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-800">The 4 Key Nutrients You Track</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Every bite nourishes your body with specific macro and micronutrients
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nutrient 1: Calories */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-5 space-y-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
              🔥
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">Calories (kcal)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The fuel that powers your brain, heart, workouts, and daily movements. NutriPastel helps you hit your sweet spot without under or over-fueling.
            </p>
            <div className="text-[11px] font-semibold text-amber-800 pt-1">
              ✨ Target: ~2,000 kcal / day
            </div>
          </div>

          {/* Nutrient 2: Protein */}
          <div className="rounded-2xl bg-rose-50/70 border border-rose-200 p-5 space-y-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl">
              🍗
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">Protein (g)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The building block for muscles, skin, lustrous hair, and immune antibodies. Keeps you satiated and energized between meals.
            </p>
            <div className="text-[11px] font-semibold text-rose-800 pt-1">
              ✨ Target: ~80g - 120g / day
            </div>
          </div>

          {/* Nutrient 3: Fat */}
          <div className="rounded-2xl bg-teal-50/70 border border-teal-200 p-5 space-y-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl">
              🥑
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">Healthy Fats (g)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Essential for brain function, hormone balance, and absorbing fat-soluble vitamins (A, D, E, K). Never fear wholesome healthy fats!
            </p>
            <div className="text-[11px] font-semibold text-teal-800 pt-1">
              ✨ Target: ~50g - 75g / day
            </div>
          </div>

          {/* Nutrient 4: Calcium */}
          <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200 p-5 space-y-2 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl">
              🥛
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">Calcium (mg)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Critical mineral that 99% resides in your bones & teeth. Also vital for heart rhythm and nerve conduction.
            </p>
            <div className="text-[11px] font-semibold text-indigo-800 pt-1">
              ✨ Target: ~1,000mg / day
            </div>
          </div>
        </div>
      </div>

      {/* 4 Step Interactive Tour */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 text-center">How to Use NutriPastel with Your Family</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              1
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Family Presets</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Custom presets for all ages (Grandmother, Grandfather, Parents, Teens & Kids) with clinical targets for calories, calcium, and diabetes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              2
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Food Choices</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Type foods like "2 rotis", "1 katori moong dal", or "1 glass chaas". Real ICMR-NIN calculations with 0g added sugar for homemade phulkas!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              3
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Calories & Stats</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Live nutrient dashboard with dedicated Indian Sugar Reduction guide, calcium bone metrics, and digestion tips.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              4
            </div>
            <h3 className="font-bold text-slate-800 text-sm">NutriAI Assistant</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask your personal AI nutritionist questions anytime for any family member, analyze today's diary, and log recommended dishes in 1 click!
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onStartTracking}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-base shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <span>Proceed to Step 2: Food Choices</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
