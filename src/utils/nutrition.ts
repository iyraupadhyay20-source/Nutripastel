import { FoodItem, LoggedFood, MealType } from '../types';
import { DEFAULT_FOOD_DATABASE } from '../data/foodDatabase';

export function calculateNutrientsForWeight(food: FoodItem, weightGrams: number) {
  const factor = Math.max(0, weightGrams) / 100;
  const sugar = Math.round((food.sugarPer100g || 0) * factor * 10) / 10;
  let sugarLevel: 'low' | 'moderate' | 'high' = 'low';
  if (sugar > 15) sugarLevel = 'high';
  else if (sugar >= 5) sugarLevel = 'moderate';

  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    calcium: Math.round(food.calciumPer100g * factor),
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    sugar,
    sugarLevel,
  };
}

export function createLoggedFoodItem(food: FoodItem, weightGrams: number, mealType: MealType): LoggedFood {
  const nutrients = calculateNutrientsForWeight(food, weightGrams);
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    foodId: food.id,
    name: food.name,
    emoji: food.emoji,
    weightGrams,
    mealType,
    ...nutrients,
    dietType: food.dietType || 'veg',
    loggedAt: new Date().toISOString(),
  };
}

export function sumNutrients(items: LoggedFood[]) {
  return items.reduce(
    (acc, curr) => ({
      calories: acc.calories + curr.calories,
      protein: Math.round((acc.protein + curr.protein) * 10) / 10,
      fat: Math.round((acc.fat + curr.fat) * 10) / 10,
      calcium: acc.calcium + curr.calcium,
      carbs: Math.round((acc.carbs + curr.carbs) * 10) / 10,
      sugar: Math.round((acc.sugar + (curr.sugar || 0)) * 10) / 10,
      weightGrams: acc.weightGrams + curr.weightGrams,
    }),
    { calories: 0, protein: 0, fat: 0, calcium: 0, carbs: 0, sugar: 0, weightGrams: 0 }
  );
}

/**
 * Parses free text from the user's food type box (e.g. "150g grilled chicken, 200g milk, 50g oats, 1 apple")
 * and extracts matching foods and weights to update the day's meals!
 */
export function parseFoodTextToLogs(text: string, existingFoods: FoodItem[]): LoggedFood[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/[\n,;•]+/).map(s => s.trim()).filter(Boolean);
  const results: LoggedFood[] = [];

  let currentMeal: MealType = 'breakfast';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Check if line indicates a meal header
    if (lower.includes('breakfast')) {
      currentMeal = 'breakfast';
      continue;
    }
    if (lower.includes('lunch')) {
      currentMeal = 'lunch';
      continue;
    }
    if (lower.includes('dinner')) {
      currentMeal = 'dinner';
      continue;
    }
    if (lower.includes('snack')) {
      currentMeal = 'snack';
      continue;
    }

    // Extract weight number: e.g. "150g", "200 grams", "240ml", or simple numbers
    let weight = 100; // default
    const weightMatch = lower.match(/(\d+)\s*(g|grams|gram|ml|oz)?/);
    if (weightMatch) {
      const num = parseInt(weightMatch[1], 10);
      if (weightMatch[2] === 'oz') {
        weight = Math.round(num * 28.35);
      } else if (num > 0) {
        weight = num;
      }
    }

    // Try finding a matching food item in the database
    let matchedFood: FoodItem | undefined = existingFoods.find(f => {
      const foodWords = f.name.toLowerCase().split(/\s+/);
      return foodWords.some(w => w.length > 3 && lower.includes(w));
    });

    if (!matchedFood) {
      // Fuzzy keywords
      if (lower.includes('milk') || lower.includes('latte')) {
        matchedFood = existingFoods.find(f => f.id.includes('milk'));
      } else if (lower.includes('chicken') || lower.includes('poultry')) {
        matchedFood = existingFoods.find(f => f.id.includes('chicken'));
      } else if (lower.includes('yogurt') || lower.includes('curd')) {
        matchedFood = existingFoods.find(f => f.id.includes('yogurt'));
      } else if (lower.includes('egg')) {
        matchedFood = existingFoods.find(f => f.id.includes('egg'));
      } else if (lower.includes('cheese') || lower.includes('cheddar')) {
        matchedFood = existingFoods.find(f => f.id.includes('cheese'));
      } else if (lower.includes('oat') || lower.includes('oatmeal') || lower.includes('porridge')) {
        matchedFood = existingFoods.find(f => f.id.includes('oats'));
      } else if (lower.includes('apple')) {
        matchedFood = existingFoods.find(f => f.id.includes('apple'));
      } else if (lower.includes('banana')) {
        matchedFood = existingFoods.find(f => f.id.includes('banana'));
      } else if (lower.includes('strawberr') || lower.includes('berr')) {
        matchedFood = existingFoods.find(f => f.id.includes('strawberries'));
      } else if (lower.includes('broccoli')) {
        matchedFood = existingFoods.find(f => f.id.includes('broccoli'));
      } else if (lower.includes('tofu') || lower.includes('paneer')) {
        matchedFood = existingFoods.find(f => f.id.includes('tofu') || f.id.includes('paneer'));
      } else if (lower.includes('salmon') || lower.includes('fish')) {
        matchedFood = existingFoods.find(f => f.id.includes('salmon'));
      } else if (lower.includes('rice')) {
        matchedFood = existingFoods.find(f => f.id.includes('rice'));
      } else if (lower.includes('spinach')) {
        matchedFood = existingFoods.find(f => f.id.includes('spinach'));
      } else if (lower.includes('avocado')) {
        matchedFood = existingFoods.find(f => f.id.includes('avocado'));
      } else if (lower.includes('almond') || lower.includes('nut')) {
        matchedFood = existingFoods.find(f => f.id.includes('almond'));
      }
    }

    if (matchedFood) {
      results.push(createLoggedFoodItem(matchedFood, weight, currentMeal));
    } else {
      // Create a fallback custom entry from the line
      // Clean up the line text
      const cleanName = line.replace(/\d+\s*(g|grams|gram|ml|oz)?/gi, '').trim() || 'Custom Meal';
      const customFood: FoodItem = {
        id: `parsed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        category: 'protein',
        emoji: '🍽️',
        caloriesPer100g: 130,
        proteinPer100g: 8,
        fatPer100g: 4,
        calciumPer100g: 40,
        carbsPer100g: 15,
        defaultWeightGrams: weight,
      };
      results.push(createLoggedFoodItem(customFood, weight, currentMeal));
    }
  }

  return results;
}

export const INITIAL_SAMPLE_LOG: LoggedFood[] = [
  {
    id: 'log_sample_1',
    foodId: 'food_roti_phulka',
    name: 'Handmade Whole Wheat Phulka / Roti',
    emoji: '🫓',
    weightGrams: 35,
    mealType: 'breakfast',
    calories: 85,
    protein: 3.0,
    fat: 0.5,
    calcium: 15,
    carbs: 17.0,
    sugar: 0.2, // NO added sugar! Only 0.2g natural carb
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Fresh homemade phulka: zero added sugar, gentle complex grain.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_2',
    foodId: 'food_dahi_curd',
    name: 'Homemade Dahi (Plain Curd)',
    emoji: '🥣',
    weightGrams: 150,
    mealType: 'breakfast',
    calories: 92,
    protein: 5.2,
    fat: 4.8,
    calcium: 188,
    carbs: 6.6,
    sugar: 4.8, // Natural lactose only, blunts morning blood sugar spikes
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Probiotic dahi: 188mg calcium for Grandma with 0g added sugar.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_3',
    foodId: 'food_chai_unsweetened',
    name: 'Indian Masala Chai (No Added Sugar)',
    emoji: '☕',
    weightGrams: 150,
    mealType: 'breakfast',
    calories: 45,
    protein: 2.2,
    fat: 2.1,
    calcium: 80,
    carbs: 3.5,
    sugar: 2.5, // Natural milk lactose only
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Ginger-cardamom chai without sugar: warms digestion safely.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_4',
    foodId: 'food_roti_phulka',
    name: 'Handmade Whole Wheat Phulka / Roti',
    emoji: '🫓',
    weightGrams: 70, // 2 rotis
    mealType: 'lunch',
    calories: 170,
    protein: 6.0,
    fat: 1.0,
    calcium: 30,
    carbs: 34.0,
    sugar: 0.4,
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: '2 rotis paired with dal to slow down starch absorption.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_5',
    foodId: 'food_moong_dal',
    name: 'Cooked Yellow Moong Dal',
    emoji: '🍲',
    weightGrams: 150,
    mealType: 'lunch',
    calories: 129,
    protein: 7.5,
    fat: 2.5,
    calcium: 28,
    carbs: 19.2,
    sugar: 1.0,
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Yellow moong dal: easy on senior digestion & stabilizes glucose.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_6',
    foodId: 'food_lauki_bottle_gourd',
    name: 'Stewed Bottle Gourd (Lauki / Doodhi Sabzi)',
    emoji: '🥣',
    weightGrams: 150,
    mealType: 'lunch',
    calories: 24,
    protein: 0.9,
    fat: 0.8,
    calcium: 38,
    carbs: 3.6,
    sugar: 0.8, // Ultra low sugar, soothing alternative to cucumber
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Soothing cooked lauki: gentle on Grandma (unlike raw cucumber).',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_7',
    foodId: 'food_paneer',
    name: 'Fresh Paneer (Cottage Cheese)',
    emoji: '🧀',
    weightGrams: 60,
    mealType: 'lunch',
    calories: 159,
    protein: 11.0,
    fat: 12.5,
    calcium: 288,
    carbs: 2.1,
    sugar: 1.2,
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: '288mg bioavailable calcium & 11g protein to support bone density.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_8',
    foodId: 'food_chaas_buttermilk',
    name: 'Spiced Chaas (Roasted Jeera)',
    emoji: '🥛',
    weightGrams: 200,
    mealType: 'snack',
    calories: 46,
    protein: 3.2,
    fat: 1.6,
    calcium: 144,
    carbs: 4.8,
    sugar: 3.4,
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Cooling buttermilk with cumin: gut-friendly calcium snack.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_9',
    foodId: 'food_moong_khichdi',
    name: 'Moong Dal Khichdi (Mild Turmeric)',
    emoji: '🍲',
    weightGrams: 180,
    mealType: 'dinner',
    calories: 176,
    protein: 6.5,
    fat: 3.2,
    calcium: 36,
    carbs: 30.2,
    sugar: 0.9,
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Gentle dinner khichdi: light on stomach before sleep.',
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'log_sample_10',
    foodId: 'food_ridge_gourd',
    name: 'Stewed Ridge Gourd (Turai / Tori)',
    emoji: '🥗',
    weightGrams: 140,
    mealType: 'dinner',
    calories: 25,
    protein: 1.0,
    fat: 0.8,
    calcium: 25,
    carbs: 3.6,
    sugar: 1.1,
    sugarLevel: 'low',
    dietType: 'veg',
    researchNote: 'Warm cooked turai: light fiber that prevents nocturnal glucose spikes.',
    loggedAt: new Date().toISOString(),
  },
];

export interface HealthCalculationParams {
  age: number; // in years (e.g. 72)
  weightKg: number; // in kg (e.g. 58)
  heightCm?: number; // in cm (e.g. 158)
  gender?: 'female' | 'male';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active';
  hasDiabetes?: boolean;
}

export interface CalculatedNutrientTargets {
  calorieTarget: number;
  proteinTarget: number;
  fatTarget: number;
  carbsTarget: number;
  calciumTarget: number;
  sugarLimit: number;
  waterTarget: number;
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  bmr: number;
  tdee: number;
  explanation: {
    caloriesReason: string;
    proteinReason: string;
    calciumReason: string;
    sugarReason: string;
    waterReason: string;
  };
}

/**
 * Calculates scientifically grounded daily calorie, protein, calcium, fat, and diabetic sugar targets
 * customized according to individual Weight, Age, Gender, and Diabetes status!
 */
export function calculateNutrientTargetsFromProfile(params: HealthCalculationParams): CalculatedNutrientTargets {
  const age = Math.max(1, Math.min(120, Number(params.age) || 72));
  const weightKg = Math.max(15, Math.min(250, Number(params.weightKg) || 58));
  const gender = params.gender || 'female';
  const defaultHeight = gender === 'female' ? 158 : 172;
  const heightCm = Math.max(100, Math.min(230, Number(params.heightCm) || defaultHeight));
  const activityLevel = params.activityLevel || 'lightly_active';
  const hasDiabetes = params.hasDiabetes !== false; // defaults to true for Grandmother

  // 1. Basal Metabolic Rate (Mifflin-St Jeor equation)
  const bmrBase = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  const bmr = Math.round(gender === 'male' ? bmrBase + 5 : bmrBase - 161);

  // 2. Total Daily Energy Expenditure (TDEE) based on activity level
  let activityMultiplier = 1.35; // lightly active
  if (activityLevel === 'sedentary') activityMultiplier = 1.2;
  else if (activityLevel === 'moderately_active') activityMultiplier = 1.5;

  const tdee = Math.round(bmr * activityMultiplier);
  // Caloric range tailored for children, teens, adults, and seniors
  let minCal = 1300;
  let maxCal = 2600;
  if (age < 12) {
    minCal = 1100;
    maxCal = 2200;
  } else if (age < 19) {
    minCal = 1500;
    maxCal = 3000;
  } else if (gender === 'male') {
    maxCal = 2900;
  }
  const calorieTarget = Math.max(minCal, Math.min(maxCal, tdee));

  // 3. Protein target based on Weight & Age (Pediatric, Adult & ESPEN/PROT-AGE Geriatric standards)
  let proteinPerKg = 0.9;
  let proteinReason = '';
  if (age < 12) {
    proteinPerKg = 1.15;
    proteinReason = `For growing children (age ${age}), pediatric RDA recommends ~1.15g protein per kg (${weightKg}kg × 1.15 = ${Math.round(weightKg * 1.15)}g) for tissue formation, strong immunity, and healthy growth.`;
  } else if (age < 19) {
    proteinPerKg = 1.1;
    proteinReason = `During adolescent growth spurts (age ${age}), ~1.1g protein per kg (${weightKg}kg × 1.1 = ${Math.round(weightKg * 1.1)}g) supports rapid height gain, muscle development, and sports activity.`;
  } else if (age >= 65) {
    proteinPerKg = 1.15;
    proteinReason = `At age ${age}, clinical geriatric guidelines (PROT-AGE) recommend 1.1–1.2g protein per kg (${weightKg}kg × 1.15 = ${Math.round(weightKg * proteinPerKg)}g) to prevent muscle loss (sarcopenia) and maintain mobility.`;
  } else {
    proteinPerKg = 0.9;
    proteinReason = `For adults under 65, 0.9g protein per kg (${weightKg}kg × 0.9 = ${Math.round(weightKg * proteinPerKg)}g) supports daily cellular repair and metabolic maintenance.`;
  }
  const proteinTarget = Math.max(25, Math.min(160, Math.round(weightKg * proteinPerKg)));

  // 4. Calcium target based on Age & Sex (NIH & ICMR-NIN standards for all family stages)
  let calciumTarget = 1000;
  let calciumReason = '';
  if (age < 10) {
    calciumTarget = 800;
    calciumReason = `Growing children (age ${age}) need 800 mg calcium daily for milk-teeth replacement and bone elongation.`;
  } else if (age < 19) {
    calciumTarget = 1300;
    calciumReason = `Teenagers (age ${age}) require 1,300 mg calcium daily to build peak bone mass that prevents bone thinning in adult life.`;
  } else if ((gender === 'female' && age >= 51) || (gender === 'male' && age >= 71)) {
    calciumTarget = 1200;
    calciumReason = `Women 51+ and senior family members require 1,200 mg daily calcium to slow bone resorption and protect against osteoporosis and fractures.`;
  } else {
    calciumTarget = 1000;
    calciumReason = `Standard adult RDA of 1,000 mg calcium ensures optimal bone mineral density and cardiac muscle signaling.`;
  }

  // 5. Sugar limit based on Diabetes & Calorie Target (ADA & WHO guidelines)
  let sugarLimit = 20;
  let sugarReason = '';
  if (hasDiabetes) {
    // ADA guideline: ≤ 5% of total caloric intake from simple sugars
    sugarLimit = Math.min(25, Math.max(15, Math.round((calorieTarget * 0.05) / 4)));
    sugarReason = `For diabetes care, added/simple sugars are strictly capped at ≤ 5% of energy (${sugarLimit}g/day) to prevent blood glucose spikes.`;
  } else {
    sugarLimit = Math.min(45, Math.max(25, Math.round((calorieTarget * 0.10) / 4)));
    sugarReason = `Standard dietary guideline: maximum 10% daily calories from sugar (${sugarLimit}g/day).`;
  }

  // 6. Healthy Fats (approx 28% of total daily energy)
  const fatTarget = Math.round((calorieTarget * 0.28) / 9);

  // 7. Carbohydrates (remainder of energy balance)
  const carbsTarget = Math.max(80, Math.round((calorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4));

  // 8. Water Target (senior hydration: ~32 ml per kg of body weight)
  const waterTarget = Math.max(5, Math.min(12, Math.round((weightKg * 32) / 250)));
  const waterReason = `Hydration for ${weightKg}kg body weight: approx ${Math.round((weightKg * 32) / 100) * 100} ml/day (~${waterTarget} glasses).`;

  // 9. BMI & Classification
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal';
  if (bmi < 18.5) bmiCategory = 'underweight';
  else if (bmi < (age >= 65 ? 27.0 : 25.0)) bmiCategory = 'normal';
  else if (bmi < 30.0) bmiCategory = 'overweight';
  else bmiCategory = 'obese';

  const caloriesReason = `Calculated with Mifflin-St Jeor equation: BMR is ${bmr} kcal/day; adjusted for ${activityLevel.replace('_', ' ')} gives ${tdee} kcal maintenance.`;

  return {
    calorieTarget,
    proteinTarget,
    fatTarget,
    carbsTarget,
    calciumTarget,
    sugarLimit,
    waterTarget,
    bmi,
    bmiCategory,
    bmr,
    tdee,
    explanation: {
      caloriesReason,
      proteinReason,
      calciumReason,
      sugarReason,
      waterReason,
    },
  };
}

