export interface FoodItem {
  id: string;
  name: string;
  category: 'dairy' | 'protein' | 'fruit' | 'vegetable' | 'grain' | 'nuts_fats' | 'treats_drinks';
  emoji: string;
  caloriesPer100g: number; // kcal
  proteinPer100g: number;  // grams
  fatPer100g: number;      // grams
  calciumPer100g: number;  // milligrams
  carbsPer100g: number;    // grams
  sugarPer100g?: number;   // grams (important for diabetes tracking)
  fiberPer100g?: number;   // grams
  defaultWeightGrams: number;
  servingDescription?: string;
  isCustom?: boolean;
  dietType?: 'veg' | 'non_veg' | 'egg';
  digestiveSuitability?: 'gentle' | 'sensitive' | 'standard'; // e.g. 'sensitive' for cucumber
  gentleAlternativeName?: string; // e.g. 'Steamed Zucchini or Bottle Gourd (Lauki)'
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface LoggedFood {
  id: string;
  foodId: string;
  name: string;
  emoji: string;
  weightGrams: number;
  mealType: MealType;
  calories: number;
  protein: number;
  fat: number;
  calcium: number;
  carbs: number;
  sugar: number; // grams of sugar
  sugarLevel?: 'low' | 'moderate' | 'high'; // diabetic classification
  dietType?: 'veg' | 'non_veg' | 'egg';
  digestiveWarning?: string; // e.g. "Cucumber does not always suit Grandma (causes bloating/reflux)"
  suggestedAlternative?: string; // e.g. "Steamed Zucchini or Bottle Gourd (Lauki)"
  researchNote?: string;
  loggedAt: string; // ISO date string
}

export interface UserPreferences {
  // Personalized Health & Age/Weight Profile
  age: number; // e.g. 72 years
  weightKg: number; // e.g. 58 kg
  heightCm: number; // e.g. 158 cm
  gender: 'female' | 'male';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active';
  hasDiabetes: boolean;
  sensitiveFoods: string[]; // List of foods that don't suit digestion, e.g. ['cucumber']

  dietStyle: string; // 'balanced' | 'vegetarian' | 'vegan' | 'high_protein' | 'dairy_free' | 'low_carb' | 'keto' | 'gluten_free';
  dietBoundary: 'all' | 'veg_only' | 'eggetarian' | 'non_veg_only'; // Veg / Non-veg boundary setting
  preferenceNotes: string; // The user type box notes
  allergiesOrDislikes: string;
  calorieTarget: number;
  proteinTarget: number;
  fatTarget: number;
  calciumTarget: number;
  sugarLimit: number; // Max daily sugar grams (crucial for diabetes monitoring, e.g. 20g-25g)
  diabetesMode: boolean; // Highlights sugar alerts and blood sugar safety
  waterTarget: number; // glasses or ml
  activeProfileId?: string;
  activeProfileName?: string;
  activeProfileEmoji?: string;
}

export interface FamilyPreset {
  id: string;
  name: string;
  role: string;
  emoji: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: 'female' | 'male';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active';
  hasDiabetes: boolean;
  sensitiveFoods: string[];
  dietStyle: string;
  notes: string;
  allergiesOrDislikes?: string;
  calorieTarget?: number;
  proteinTarget?: number;
  fatTarget?: number;
  calciumTarget?: number;
  sugarLimit?: number;
  waterTarget?: number;
}

export const DEFAULT_FAMILY_PRESETS: FamilyPreset[] = [
  {
    id: 'preset_grandma',
    name: 'Grandmother',
    role: 'Senior / Dadi / Nani',
    emoji: '👵',
    age: 72,
    weightKg: 58,
    heightCm: 158,
    gender: 'female',
    activityLevel: 'lightly_active',
    hasDiabetes: true,
    sensitiveFoods: ['cucumber'],
    dietStyle: 'diabetic_friendly',
    notes: 'Diabetes care, bone calcium (1200mg), gentle ICMR Indian foods',
    allergiesOrDislikes: 'Raw cucumber causes bloating/burping; prefer warm cooked lauki or turai.',
    calorieTarget: 1650,
    proteinTarget: 65,
    fatTarget: 52,
    calciumTarget: 1200,
    sugarLimit: 20,
    waterTarget: 8,
  },
  {
    id: 'preset_grandpa',
    name: 'Grandfather',
    role: 'Senior / Dada / Nana',
    emoji: '👴',
    age: 75,
    weightKg: 70,
    heightCm: 172,
    gender: 'male',
    activityLevel: 'sedentary',
    hasDiabetes: true,
    sensitiveFoods: [],
    dietStyle: 'diabetic_friendly',
    notes: 'Blood sugar & heart care: whole grains, soft dals, low oil & glycemic control',
    allergiesOrDislikes: 'Avoid deep fried foods and high-sugar mithai.',
    calorieTarget: 1800,
    proteinTarget: 80,
    fatTarget: 54,
    calciumTarget: 1200,
    sugarLimit: 22,
    waterTarget: 8,
  },
  {
    id: 'preset_dad',
    name: 'Father (Dad)',
    role: 'Adult / Working',
    emoji: '👨',
    age: 48,
    weightKg: 75,
    heightCm: 174,
    gender: 'male',
    activityLevel: 'moderately_active',
    hasDiabetes: false,
    sensitiveFoods: [],
    dietStyle: 'balanced',
    notes: 'Active daily routine, stamina, muscle preservation & heart wellness',
    allergiesOrDislikes: 'Avoid very late heavy dinners.',
    calorieTarget: 2250,
    proteinTarget: 75,
    fatTarget: 68,
    calciumTarget: 1000,
    sugarLimit: 36,
    waterTarget: 10,
  },
  {
    id: 'preset_mom',
    name: 'Mother (Mom)',
    role: 'Adult / Active',
    emoji: '👩',
    age: 45,
    weightKg: 62,
    heightCm: 160,
    gender: 'female',
    activityLevel: 'lightly_active',
    hasDiabetes: false,
    sensitiveFoods: [],
    dietStyle: 'balanced',
    notes: 'Bone density, iron-rich greens, steady metabolism & daily vitality',
    allergiesOrDislikes: 'Prefers lighter vegetarian dinners.',
    calorieTarget: 1750,
    proteinTarget: 60,
    fatTarget: 52,
    calciumTarget: 1000,
    sugarLimit: 28,
    waterTarget: 8,
  },
  {
    id: 'preset_teen',
    name: 'Teenager (Aarav)',
    role: 'Youth / Student (16y)',
    emoji: '🧑',
    age: 16,
    weightKg: 56,
    heightCm: 168,
    gender: 'male',
    activityLevel: 'moderately_active',
    hasDiabetes: false,
    sensitiveFoods: [],
    dietStyle: 'high_protein',
    notes: 'Adolescent growth spurt: 1300mg calcium for peak bone mass, sports energy & protein',
    allergiesOrDislikes: 'High energy requirement, wholesome home snacks.',
    calorieTarget: 2400,
    proteinTarget: 70,
    fatTarget: 70,
    calciumTarget: 1300,
    sugarLimit: 35,
    waterTarget: 9,
  },
  {
    id: 'preset_kid',
    name: 'Child (Anaya)',
    role: 'Kid / Growing (9y)',
    emoji: '👧',
    age: 9,
    weightKg: 28,
    heightCm: 130,
    gender: 'female',
    activityLevel: 'moderately_active',
    hasDiabetes: false,
    sensitiveFoods: [],
    dietStyle: 'balanced',
    notes: 'Active child: bone development, milk & paneer calcium, fruit energy, low refined sugar',
    allergiesOrDislikes: 'Limit artificial juices & sugary packaged sweets.',
    calorieTarget: 1550,
    proteinTarget: 35,
    fatTarget: 46,
    calciumTarget: 1000,
    sugarLimit: 22,
    waterTarget: 6,
  },
];

export const INITIAL_PREFERENCES: UserPreferences = {
  age: 72,
  weightKg: 58,
  heightCm: 158,
  gender: 'female',
  activityLevel: 'lightly_active',
  hasDiabetes: true,
  sensitiveFoods: ['cucumber'], // Cucumber does not always suit Grandma's digestion
  dietStyle: 'diabetic_friendly',
  dietBoundary: 'all',
  preferenceNotes: 'Specially created for Grandmother with diabetes care: monitoring sugar intake, calcium for bones, and protein for strength!',
  allergiesOrDislikes: 'Cucumber does not always suit Grandma (causes bloating/burping). Prefer gentle cooked squash or lauki.',
  calorieTarget: 1650, // Calculated for 72yo, 58kg female with light activity
  proteinTarget: 65,   // Geriatric clinical recommendation: ~1.1g/kg for senior bone & muscle maintenance
  fatTarget: 52,       // ~28% healthy dietary fats
  calciumTarget: 1200, // 1200 mg clinical standard for women age 51+ (osteoporosis prevention)
  sugarLimit: 20,      // 20g daily sugar limit (≤5% total energy for diabetes control)
  diabetesMode: true,
  waterTarget: 8,
  activeProfileId: 'preset_grandma',
  activeProfileName: 'Grandmother',
  activeProfileEmoji: '👵',
};

export interface AIChatMessage {
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

