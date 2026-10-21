import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  Calculator,
  Flame,
  Dumbbell,
  Milk,
  ShieldCheck,
  Scale,
  Sparkles,
  Info,
  Droplet,
  Heart,
  TrendingUp,
  Activity,
  Edit2,
  Plus,
  Trash2,
  RotateCcw,
  Users
} from 'lucide-react';
import { UserPreferences, FamilyPreset, DEFAULT_FAMILY_PRESETS } from '../types';
import { calculateNutrientTargetsFromProfile, CalculatedNutrientTargets } from '../utils/nutrition';

interface AgeWeightCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (newPrefs: UserPreferences) => void;
  familyPresets: FamilyPreset[];
  onSaveFamilyPresets: (newPresets: FamilyPreset[]) => void;
}

export const AgeWeightCalculatorModal: React.FC<AgeWeightCalculatorModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  familyPresets,
  onSaveFamilyPresets,
}) => {
  if (!isOpen) return null;

  return (
    <AgeWeightCalculatorForm
      preferences={preferences}
      onClose={onClose}
      onSavePreferences={onSavePreferences}
      familyPresets={familyPresets}
      onSaveFamilyPresets={onSaveFamilyPresets}
    />
  );
};

interface AgeWeightCalculatorFormProps {
  preferences: UserPreferences;
  onClose: () => void;
  onSavePreferences: (newPrefs: UserPreferences) => void;
  familyPresets: FamilyPreset[];
  onSaveFamilyPresets: (newPresets: FamilyPreset[]) => void;
}

const EMOJI_OPTIONS = ['👵', '👴', '👨', '👩', '🧑', '👧', '👶', '🥑', '🏃‍♂️', '🏃‍♀️', '🧘‍♀️', '❤️'];

const AgeWeightCalculatorForm: React.FC<AgeWeightCalculatorFormProps> = ({
  preferences,
  onClose,
  onSavePreferences,
  familyPresets,
  onSaveFamilyPresets,
}) => {
  // Active member profile ID
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    preferences.activeProfileId || (familyPresets[0]?.id || 'preset_grandma')
  );

  // Form State
  const [name, setName] = useState<string>(preferences.activeProfileName || 'Grandmother');
  const [role, setRole] = useState<string>('Senior / Grandmother');
  const [emoji, setEmoji] = useState<string>(preferences.activeProfileEmoji || '👵');
  const [age, setAge] = useState<number>(preferences.age || 72);
  const [weightKg, setWeightKg] = useState<number>(preferences.weightKg || 58);
  const [heightCm, setHeightCm] = useState<number>(preferences.heightCm || 158);
  const [gender, setGender] = useState<'female' | 'male'>(preferences.gender || 'female');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'lightly_active' | 'moderately_active'>(
    preferences.activityLevel || 'lightly_active'
  );
  const [hasDiabetes, setHasDiabetes] = useState<boolean>(preferences.hasDiabetes ?? true);
  const [sensitiveFoods, setSensitiveFoods] = useState<string[]>(
    preferences.sensitiveFoods || ['cucumber']
  );
  const [notes, setNotes] = useState<string>(preferences.preferenceNotes || '');

  // Edit / Add Preset Mode
  const [isEditingPreset, setIsEditingPreset] = useState<boolean>(false);
  const [presetSaveFeedback, setPresetSaveFeedback] = useState<string>('');

  // Real-time calculation based on age and weight
  const [results, setResults] = useState<CalculatedNutrientTargets>(() =>
    calculateNutrientTargetsFromProfile({
      age,
      weightKg,
      heightCm,
      gender,
      activityLevel,
      hasDiabetes,
    })
  );

  useEffect(() => {
    setResults(
      calculateNutrientTargetsFromProfile({
        age,
        weightKg,
        heightCm,
        gender,
        activityLevel,
        hasDiabetes,
      })
    );
  }, [age, weightKg, heightCm, gender, activityLevel, hasDiabetes]);

  // Handle selecting a preset
  const handleSelectPreset = (preset: FamilyPreset) => {
    setSelectedPresetId(preset.id);
    setName(preset.name);
    setRole(preset.role);
    setEmoji(preset.emoji);
    setAge(preset.age);
    setWeightKg(preset.weightKg);
    setHeightCm(preset.heightCm || (preset.gender === 'female' ? 158 : 172));
    setGender(preset.gender);
    setActivityLevel(preset.activityLevel || 'lightly_active');
    setHasDiabetes(preset.hasDiabetes);
    setSensitiveFoods(preset.sensitiveFoods || []);
    setNotes(preset.notes || '');
    setIsEditingPreset(false);
  };

  // Handle saving changes to current preset
  const handleSaveCurrentPreset = () => {
    const updatedPresets = familyPresets.map((p) => {
      if (p.id === selectedPresetId) {
        return {
          ...p,
          name,
          role,
          emoji,
          age,
          weightKg,
          heightCm,
          gender,
          activityLevel,
          hasDiabetes,
          sensitiveFoods,
          notes,
          calorieTarget: results.calorieTarget,
          proteinTarget: results.proteinTarget,
          calciumTarget: results.calciumTarget,
          sugarLimit: results.sugarLimit,
        };
      }
      return p;
    });

    onSaveFamilyPresets(updatedPresets);
    setIsEditingPreset(false);
    setPresetSaveFeedback(`Saved changes for ${name}!`);
    setTimeout(() => setPresetSaveFeedback(''), 3000);
  };

  // Handle adding as a brand new family member preset
  const handleCreateNewPreset = () => {
    const newId = `preset_custom_${Date.now()}`;
    const newPreset: FamilyPreset = {
      id: newId,
      name: name || 'Family Member',
      role: role || (age < 18 ? 'Child / Teen' : age >= 65 ? 'Senior' : 'Adult'),
      emoji: emoji || '👤',
      age,
      weightKg,
      heightCm,
      gender,
      activityLevel,
      hasDiabetes,
      sensitiveFoods,
      dietStyle: hasDiabetes ? 'diabetic_friendly' : 'balanced',
      notes: notes || `Custom preset for ${name}`,
      calorieTarget: results.calorieTarget,
      proteinTarget: results.proteinTarget,
      calciumTarget: results.calciumTarget,
      sugarLimit: results.sugarLimit,
    };

    const updatedPresets = [...familyPresets, newPreset];
    onSaveFamilyPresets(updatedPresets);
    setSelectedPresetId(newId);
    setIsEditingPreset(false);
    setPresetSaveFeedback(`Added ${name} to Family Presets!`);
    setTimeout(() => setPresetSaveFeedback(''), 3000);
  };

  // Handle deleting a preset
  const handleDeletePreset = (idToDelete: string) => {
    if (familyPresets.length <= 1) {
      alert('You must keep at least one profile preset.');
      return;
    }
    const filtered = familyPresets.filter((p) => p.id !== idToDelete);
    onSaveFamilyPresets(filtered);
    if (selectedPresetId === idToDelete && filtered[0]) {
      handleSelectPreset(filtered[0]);
    }
  };

  // Handle resetting presets to default
  const handleResetDefaults = () => {
    if (window.confirm('Reset all family presets to the default family list (Grandmother, Grandfather, Dad, Mom, Teenager, Child)?')) {
      onSaveFamilyPresets(DEFAULT_FAMILY_PRESETS);
      handleSelectPreset(DEFAULT_FAMILY_PRESETS[0]);
    }
  };

  // Handle applying the profile to the dashboard
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: UserPreferences = {
      ...preferences,
      activeProfileId: selectedPresetId,
      activeProfileName: name,
      activeProfileEmoji: emoji,
      age: Math.max(1, Math.min(120, Number(age) || 72)),
      weightKg: Math.max(10, Math.min(250, Number(weightKg) || 58)),
      heightCm: Math.max(80, Math.min(230, Number(heightCm) || 158)),
      gender,
      activityLevel,
      hasDiabetes,
      diabetesMode: hasDiabetes,
      sensitiveFoods,
      preferenceNotes: notes,
      calorieTarget: results.calorieTarget,
      proteinTarget: results.proteinTarget,
      fatTarget: results.fatTarget,
      calciumTarget: results.calciumTarget,
      sugarLimit: results.sugarLimit,
      waterTarget: results.waterTarget,
    };

    onSavePreferences(updated);

    try {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#F472B6', '#A855F7', '#34D399', '#FBBF24'],
      });
    } catch {
      // ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-pink-200 shadow-2xl max-w-3xl w-full p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto space-y-6">
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
        <div className="flex items-start gap-3 border-b border-pink-100 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-amber-100 text-pink-600 flex items-center justify-center text-2xl shrink-0 shadow-2xs border border-pink-200">
            👨‍👩‍👧‍👦
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-slate-800 text-lg sm:text-xl">
                Family Presets & Health Targets
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                All Ages · Customizable
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or edit quick presets for every family member (Grandmother, Parents, Teenagers, and Kids) to calculate age-tailored calories, protein, calcium, and sugar limits!
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FAMILY MEMBER PRESETS CAROUSEL / SELECTOR                      */}
        {/* ============================================================== */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-50/90 via-purple-50/70 to-amber-50/60 border border-pink-200/90 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-600" />
              <span className="font-extrabold text-xs text-pink-950 uppercase tracking-wide">
                Family Members ({familyPresets.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingPreset(true);
                  setName('New Member');
                  setRole('Family Member');
                  setEmoji('👤');
                  setAge(30);
                  setWeightKg(65);
                  setHasDiabetes(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white text-purple-700 hover:bg-purple-50 border border-purple-200 text-xs font-bold transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditingPreset(!isEditingPreset)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                  isEditingPreset
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'bg-white text-pink-700 hover:bg-pink-50 border-pink-200'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingPreset ? 'Done Editing' : 'Edit Presets'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                title="Reset to default family presets"
                className="p-1.5 rounded-xl bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {presetSaveFeedback && (
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{presetSaveFeedback}</span>
            </div>
          )}

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {familyPresets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-pink-500 ring-2 ring-pink-300 shadow-xs'
                      : 'bg-white/70 hover:bg-white border-pink-200/80 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{preset.emoji || '👤'}</span>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {preset.age} yrs · {preset.weightKg} kg
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-pink-500 ring-2 ring-pink-200 shrink-0" />
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className={`font-bold px-1.5 py-0.2 rounded ${
                      preset.hasDiabetes ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {preset.hasDiabetes ? 'Diabetic' : 'Standard'}
                    </span>

                    {isEditingPreset && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Delete Preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* PRESET CUSTOMIZATION & DETAILS                                 */}
        {/* ============================================================== */}
        <form onSubmit={handleApply} className="space-y-5">
          {/* Preset Metadata (Name, Emoji, Role) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Preset Identity for: <strong className="text-pink-600 font-black">{name}</strong>
              </span>
              <span className="text-[10px] text-slate-500">
                You can rename, change avatar, or save as a custom family profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Member Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dad, Grandmother, Aarav..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Family Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior, Working Adult, Teen, Kid..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {/* Emoji Picker */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Avatar Emoji</label>
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`text-lg p-1 rounded-lg transition-transform ${
                        emoji === em
                          ? 'bg-pink-100 scale-125 border border-pink-300'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Preset Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
              <button
                type="button"
                onClick={handleSaveCurrentPreset}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes to {name} Preset</span>
              </button>

              <button
                type="button"
                onClick={handleCreateNewPreset}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save as New Family Member Preset</span>
              </button>
            </div>
          </div>

          {/* INPUT GRID: Age, Weight, Height, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age input */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🎂 Age (years) *</span>
                </label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  {age < 12 ? 'Child' : age < 19 ? 'Teenager (13-18)' : age >= 65 ? 'Senior (65+)' : 'Adult'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value) || 0)}
                  className="w-28 px-3 py-2 rounded-xl bg-white border border-slate-300 text-base font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <div className="flex items-center gap-1 ml-auto">
                  {[-5, -1, 1, 5].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => setAge((prev) => Math.max(1, prev + delta))}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Age calibrates calcium absorption needs, growth spurts, and protein synthesis targets.
              </p>
            </div>

            {/* Body Weight input */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-pink-600" />
                  <span>Body Weight (kg) *</span>
                </label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  BMI: {results.bmi} ({results.bmiCategory})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="250"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                  className="w-28 px-3 py-2 rounded-xl bg-white border border-slate-300 text-base font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <span className="text-xs font-bold text-slate-400">kg</span>

                <div className="flex items-center gap-1 ml-auto">
                  {[-5, -1, 1, 5].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => setWeightKg((prev) => Math.max(10, prev + delta))}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                    >
                      {delta > 0 ? `+${delta}k` : `${delta}k`}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Protein is calibrated at {age >= 65 ? '1.15g/kg (geriatric)' : age < 18 ? '1.1g/kg (growth)' : '0.9g/kg (adult)'}.
              </p>
            </div>
          </div>

          {/* Gender & Height & Diabetes Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Gender */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Biological Sex
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    gender === 'female'
                      ? 'bg-pink-500 text-white border-pink-500 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  👩 Female
                </button>
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    gender === 'male'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  👨 Male
                </button>
              </div>
            </div>

            {/* Height */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Height (cm)
              </label>
              <input
                type="number"
                min="80"
                max="230"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            {/* Diabetes Mode Toggle */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Diabetes Condition
              </label>
              <button
                type="button"
                onClick={() => setHasDiabetes(!hasDiabetes)}
                className={`w-full py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  hasDiabetes
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span>{hasDiabetes ? '🩸 Diabetes Active (≤20g sugar)' : 'Normal / No Diabetes'}</span>
              </button>
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Daily Physical Activity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  key: 'sedentary',
                  label: 'Sedentary',
                  desc: 'Gentle indoor rest',
                  icon: '🛋️',
                },
                {
                  key: 'lightly_active',
                  label: 'Lightly Active',
                  desc: 'Walking & chores',
                  icon: '🚶‍♀️',
                },
                {
                  key: 'moderately_active',
                  label: 'Moderate',
                  desc: 'Daily active walk / sports',
                  icon: '👟',
                },
              ].map((act) => (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => setActivityLevel(act.key as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    activityLevel === act.key
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base block">{act.icon}</span>
                  <span className="text-xs font-extrabold block mt-0.5">{act.label}</span>
                  <span className="text-[10px] text-slate-500 block">{act.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FOODS THAT DON'T SUIT DIGESTION */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>🥒 Digestive Sensitivities & Dislikes</span>
              </label>
              <span className="text-[10px] text-amber-800 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
                Alerts Active
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              When these foods are entered, the app warns and recommends gentle alternatives (like cooked Lauki instead of raw cucumber):
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'cucumber', label: '🥒 Raw Cucumber (Bloating/Gas)' },
                { id: 'raw_onion', label: '🧅 Raw Onion / Heavy Garlic' },
                { id: 'chili', label: '🌶️ Hot Chilies / Heavy Spice' },
                { id: 'heavy_milk', label: '🥛 Cold Unboiled Milk' },
              ].map((item) => {
                const isSelected = sensitiveFoods.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSensitiveFoods(prev => prev.filter(s => s !== item.id));
                      } else {
                        setSensitiveFoods(prev => [...prev, item.id]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* REAL-TIME CALCULATED TARGETS PREVIEW */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 border border-pink-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-pink-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-pink-600" />
                <span>Calculated Targets for {name} ({age}y · {weightKg}kg)</span>
              </span>
              <span className="text-[10px] text-pink-700 font-bold bg-white/80 px-2 py-0.5 rounded-full border border-pink-200">
                ICMR Clinical Rules
              </span>
            </div>

            {/* 4 Hero Calculated Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Calories */}
              <div className="p-3 rounded-2xl bg-white/90 border border-amber-200 shadow-2xs text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Daily Energy</span>
                <span className="text-xl sm:text-2xl font-black text-amber-950 block">
                  {results.calorieTarget}
                </span>
                <span className="text-[10px] text-amber-800 font-semibold block">kcal / day</span>
              </div>

              {/* Protein */}
              <div className="p-3 rounded-2xl bg-white/90 border border-rose-200 shadow-2xs text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Protein Target</span>
                <span className="text-xl sm:text-2xl font-black text-rose-950 block">
                  {results.proteinTarget}g
                </span>
                <span className="text-[10px] text-rose-800 font-semibold block">
                  ({Math.round((results.proteinTarget / weightKg) * 10) / 10}g / kg)
                </span>
              </div>

              {/* Calcium */}
              <div className="p-3 rounded-2xl bg-white/90 border border-indigo-200 shadow-2xs text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-indigo-700 block">Calcium (Bones)</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-950 block">
                  {results.calciumTarget}
                </span>
                <span className="text-[10px] text-indigo-800 font-semibold block">mg / day</span>
              </div>

              {/* Sugar Limit */}
              <div className="p-3 rounded-2xl bg-white/90 border border-emerald-200 shadow-2xs text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Sugar Limit</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-950 block">
                  ≤{results.sugarLimit}g
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold block">
                  {hasDiabetes ? '≤5% calories (Diabetes)' : '≤10% calories (RDA)'}
                </span>
              </div>
            </div>

            {/* Clinical Explanations */}
            <div className="space-y-1.5 pt-1 border-t border-pink-200/60 text-[11px] text-slate-600">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-rose-700 shrink-0">🍗 Protein:</span>
                <span>{results.explanation.proteinReason}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-700 shrink-0">🥛 Calcium:</span>
                <span>{results.explanation.calciumReason}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-700 shrink-0">🍬 Sugar:</span>
                <span>{results.explanation.sugarReason}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-pink-200 hover:shadow-lg transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply {name}'s Profile to Dashboard ({results.calorieTarget} kcal · ≤{results.sugarLimit}g Sugar)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
