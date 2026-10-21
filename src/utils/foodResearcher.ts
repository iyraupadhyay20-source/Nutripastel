import { LoggedFood, MealType } from '../types';
import { DEFAULT_FOOD_DATABASE } from '../data/foodDatabase';
import { calculateNutrientsForWeight } from './nutrition';

export interface BoundaryCheckResult {
  violatesBoundary: boolean;
  message?: string;
  suggestedAlternative?: string;
}

export interface DigestiveSensitivityResult {
  hasSensitivity: boolean;
  foodName: string;
  warningMessage?: string;
  soothingAlternatives: { name: string; emoji: string; desc: string; weightGrams: number }[];
}

/**
 * Checks whether a food item is known to cause digestive discomfort (like cucumber for Grandma)
 */
export function checkDigestiveSensitivity(
  foodName: string,
  sensitiveFoods: string[] = ['cucumber']
): DigestiveSensitivityResult {
  const lower = foodName.toLowerCase();
  const isCucumber = lower.includes('cucumber') || lower.includes('kheera') || lower.includes('kakdi');
  const matchesCustom = (sensitiveFoods || ['cucumber']).some(
    (s) => s && s.trim().length > 1 && lower.includes(s.toLowerCase().trim())
  );

  if (isCucumber || matchesCustom) {
    return {
      hasSensitivity: true,
      foodName: isCucumber ? 'Cucumber' : foodName,
      warningMessage: `Cucumber does not always suit Grandma's digestion (it often causes bloating, burping, or coldness in senior stomachs).`,
      soothingAlternatives: [
        {
          name: 'Stewed Bottle Gourd (Lauki)',
          emoji: '🥣',
          desc: 'Ultra gentle, non-gassy & soothing (0.5g sugar)',
          weightGrams: 150,
        },
        {
          name: 'Steamed Tender Zucchini Slices',
          emoji: '🥒',
          desc: 'Tender cooked alternative to raw cucumber (1.7g sugar)',
          weightGrams: 120,
        },
        {
          name: 'Stewed Ridge Gourd (Turai)',
          emoji: '🥗',
          desc: 'Warm & light on senior stomachs (1.1g sugar)',
          weightGrams: 140,
        },
        {
          name: 'Warm Moong Dal & Veg Broth',
          emoji: '🍲',
          desc: 'Soothing protein broth, zero digestive irritation (0.8g sugar)',
          weightGrams: 200,
        },
      ],
    };
  }

  return {
    hasSensitivity: false,
    foodName,
    soothingAlternatives: [],
  };
}

/**
 * Checks whether a food violates the user's Veg / Non-Veg boundary
 */
export function checkDietaryBoundary(
  foodDietType: 'veg' | 'non_veg' | 'egg',
  boundary: 'all' | 'veg_only' | 'eggetarian' | 'non_veg_only',
  foodName: string
): BoundaryCheckResult {
  if (boundary === 'all') {
    return { violatesBoundary: false };
  }

  if (boundary === 'veg_only') {
    if (foodDietType === 'non_veg') {
      return {
        violatesBoundary: true,
        message: `"${foodName}" contains meat/poultry/fish, which crosses your Pure Vegetarian boundary!`,
        suggestedAlternative: 'Try high-protein Paneer, Firm Tofu, Greek Yogurt, or Cooked Lentils instead! 🥦🥛',
      };
    }
    if (foodDietType === 'egg') {
      return {
        violatesBoundary: true,
        message: `"${foodName}" contains egg, which crosses your Pure Vegetarian boundary!`,
        suggestedAlternative: 'Try Paneer Bhurji, Tofu Scramble, or Greek Yogurt for comparable protein & calcium! 🧀',
      };
    }
  }

  if (boundary === 'eggetarian') {
    if (foodDietType === 'non_veg') {
      return {
        violatesBoundary: true,
        message: `"${foodName}" is meat/poultry/fish, which crosses your Eggetarian boundary!`,
        suggestedAlternative: 'Try Boiled Eggs, Omelet, Paneer, or Firm Tofu instead! 🥚🥢',
      };
    }
  }

  return { violatesBoundary: false };
}

/**
 * Intelligent food researcher that:
 * 1. Checks backend `/api/research-food`
 * 2. If offline / key not set, executes category-aware scientific local research
 */
export async function researchFoodAndCalculate(
  userInput: string,
  preferredMeal: MealType = 'breakfast'
): Promise<LoggedFood> {
  const trimmed = userInput.trim();

  // Try Server-Side Research first
  try {
    const res = await fetch('/api/research-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: trimmed, mealType: preferredMeal }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        // Validate dietType
        let dietType: 'veg' | 'non_veg' | 'egg' = 'veg';
        if (d.dietType === 'non_veg' || d.dietType === 'egg' || d.dietType === 'veg') {
          dietType = d.dietType;
        } else {
          dietType = inferDietType(d.name || trimmed);
        }

        const sugar = Math.round((Number(d.sugar) || 0) * 10) / 10;
        const sugarLevel: 'low' | 'moderate' | 'high' =
          d.sugarLevel || (sugar > 15 ? 'high' : sugar >= 5 ? 'moderate' : 'low');

        const sensitivity = checkDigestiveSensitivity(d.name || trimmed);

        return {
          id: `log_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          foodId: `ai_${encodeURIComponent((d.name || trimmed).toLowerCase().replace(/\s+/g, '_'))}`,
          name: d.name || trimmed,
          emoji: d.emoji || '🍽️',
          weightGrams: Number(d.weightGrams) || 100,
          mealType: (d.mealType as MealType) || preferredMeal,
          calories: Math.round(Number(d.calories) || 0),
          protein: Math.round((Number(d.protein) || 0) * 10) / 10,
          fat: Math.round((Number(d.fat) || 0) * 10) / 10,
          calcium: Math.round(Number(d.calcium) || 0),
          carbs: Math.round((Number(d.carbs) || 0) * 10) / 10,
          sugar,
          sugarLevel,
          dietType,
          digestiveWarning: sensitivity.hasSensitivity ? sensitivity.warningMessage : undefined,
          suggestedAlternative: sensitivity.hasSensitivity ? 'Stewed Bottle Gourd (Lauki) or Steamed Zucchini' : undefined,
          researchNote: d.researchNote || 'Researched by nutrition engine ✨',
          loggedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Seamless fallback to local nutritional research engine
  }

  // Local Intelligent Research Engine
  return localResearchFood(trimmed, preferredMeal);
}

/**
 * Infer diet type from food text
 */
export function inferDietType(text: string): 'veg' | 'non_veg' | 'egg' {
  const lower = text.toLowerCase();

  const nonVegKeywords = [
    'chicken', 'poultry', 'turkey', 'fish', 'salmon', 'tuna', 'sardine', 'cod', 'mackerel',
    'beef', 'steak', 'pork', 'bacon', 'ham', 'mutton', 'lamb', 'meat', 'prawn', 'shrimp',
    'crab', 'lobster', 'seafood', 'duck', 'sausage'
  ];

  const eggKeywords = ['egg', 'eggs', 'omelet', 'omelette', 'scramble', 'egg white', 'yolk'];

  if (nonVegKeywords.some(k => lower.includes(k))) {
    return 'non_veg';
  }

  if (eggKeywords.some(k => lower.includes(k))) {
    return 'egg';
  }

  return 'veg';
}

export function localResearchFood(input: string, preferredMeal: MealType): LoggedFood {
  const lower = input.toLowerCase();

  // Determine Meal Type if mentioned in text
  let detectedMeal: MealType = preferredMeal;
  if (lower.includes('breakfast')) detectedMeal = 'breakfast';
  else if (lower.includes('lunch')) detectedMeal = 'lunch';
  else if (lower.includes('dinner')) detectedMeal = 'dinner';
  else if (lower.includes('snack')) detectedMeal = 'snack';

  // Determine Diet Type (Veg / Non-Veg / Egg)
  const dietType = inferDietType(input);

  // Extract Weight in Grams, Oz, Cups, Slices, Spoons, Rotis, Katoris, Glasses
  let weightGrams = 100; // default standard

  const rotiMatch = lower.match(/(\d+)\s*(?:rotis?|phulkas?|chapatis?|fulkas?)\b/);
  const katoriMatch = lower.match(/(\d+)\s*(?:katoris?|bowls?|cups?)\b/);
  const glassMatch = lower.match(/(\d+)\s*(?:glass(?:es)?|tumblers?|mugs?)\b/);
  const pieceMatch = lower.match(/(\d+)\s*(?:pieces?|pcs?)\b/);
  const gMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|grams|gram)\b/);
  const ozMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces|ounce)\b/);
  const mlMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliters)\b/);
  const sliceMatch = lower.match(/(\d+)\s*slices?\b/);
  const numMatch = lower.match(/\b(\d{1,4})\b/);

  if (rotiMatch) {
    weightGrams = parseInt(rotiMatch[1], 10) * 35; // 35g per handmade roti
  } else if (katoriMatch) {
    weightGrams = parseInt(katoriMatch[1], 10) * 150; // 150g per katori
  } else if (glassMatch) {
    weightGrams = parseInt(glassMatch[1], 10) * 200; // 200ml per glass
  } else if (pieceMatch) {
    weightGrams = parseInt(pieceMatch[1], 10) * 50;
  } else if (gMatch) {
    weightGrams = Math.round(parseFloat(gMatch[1]));
  } else if (ozMatch) {
    weightGrams = Math.round(parseFloat(ozMatch[1]) * 28.35);
  } else if (mlMatch) {
    weightGrams = Math.round(parseFloat(mlMatch[1]));
  } else if (sliceMatch) {
    weightGrams = Math.round(parseInt(sliceMatch[1], 10) * 35);
  } else if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 10 && n <= 2500) {
      weightGrams = n;
    } else if (n >= 1 && n <= 9 && (lower.includes('roti') || lower.includes('phulka'))) {
      weightGrams = n * 35;
    }
  }

  // Find best matching food in database
  let matched = DEFAULT_FOOD_DATABASE.find(f => {
    const fName = f.name.toLowerCase();
    return lower.includes(fName) || fName.split(' ').some(w => w.length > 3 && lower.includes(w));
  });

  // Keyword lookup if not exact
  if (!matched) {
    if (lower.includes('ragi')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_ragi_roti');
    } else if (lower.includes('roti') || lower.includes('phulka') || lower.includes('chapati') || lower.includes('chappati')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_roti_phulka');
    } else if (lower.includes('khichdi') || lower.includes('khichri')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_moong_khichdi');
    } else if (lower.includes('idli')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_steamed_idli');
    } else if (lower.includes('dosa')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_plain_dosa');
    } else if (lower.includes('poha') || lower.includes('pohe')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_poha');
    } else if (lower.includes('upma')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_upma');
    } else if (lower.includes('cheela') || lower.includes('chilla')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_besan_cheela');
    } else if (lower.includes('palak paneer')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_palak_paneer');
    } else if (lower.includes('paneer')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_paneer');
    } else if (lower.includes('chaas') || lower.includes('buttermilk') || lower.includes('mattha')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_chaas_buttermilk');
    } else if (lower.includes('dahi') || lower.includes('curd') || lower.includes('yogurt')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_dahi_curd');
    } else if (lower.includes('karela') || lower.includes('bitter gourd')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_karela_sabzi');
    } else if (lower.includes('lauki') || lower.includes('bottle gourd') || lower.includes('doodhi') || lower.includes('ghia')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_lauki_bottle_gourd');
    } else if (lower.includes('turai') || lower.includes('tori') || lower.includes('ridge gourd')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_ridge_gourd');
    } else if (lower.includes('bhindi') || lower.includes('okra') || lower.includes('ladyfinger')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_bhindi_okra');
    } else if (lower.includes('palak') || lower.includes('spinach')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_palak_spinach');
    } else if (lower.includes('moong dal') || lower.includes('yellow dal') || lower.includes('tadka dal')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_moong_dal');
    } else if (lower.includes('toor dal') || lower.includes('arhar dal') || lower.includes('dal') || lower.includes('daal')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_toor_dal');
    } else if (lower.includes('sambar') || lower.includes('sambhar')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_sambar');
    } else if (lower.includes('chole') || lower.includes('chickpea')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_chana_masala');
    } else if (lower.includes('rajma')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_rajma');
    } else if (lower.includes('chana') || lower.includes('bhuna chana')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_roasted_chana');
    } else if (lower.includes('methi water') || lower.includes('methi dana')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_methi_water');
    } else if (lower.includes('sweet chai') || (lower.includes('chai') && lower.includes('sugar'))) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_chai_sweetened');
    } else if (lower.includes('chai') || lower.includes('tea')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_chai_unsweetened');
    } else if (lower.includes('gulab jamun')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_gulab_jamun');
    } else if (lower.includes('jalebi')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_jalebi');
    } else if (lower.includes('ladoo') || lower.includes('laddoo')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_besan_ladoo');
    } else if (lower.includes('ghee')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_pure_ghee');
    } else if (lower.includes('papaya') || lower.includes('papita')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_papaya');
    } else if (lower.includes('guava') || lower.includes('amrood')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_guava');
    } else if (lower.includes('cucumber') || lower.includes('kheera') || lower.includes('kakdi')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_cucumber');
    } else if (lower.includes('zucchini')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_steamed_zucchini');
    } else if (lower.includes('rice') || lower.includes('chawal')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_basmati_rice');
    } else if (lower.includes('milk')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_milk_whole');
    } else if (lower.includes('egg')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_egg_whole');
    } else if (lower.includes('chicken')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_chicken_breast');
    } else if (lower.includes('sugar')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_table_sugar');
    } else if (lower.includes('almond') || lower.includes('badam')) {
      matched = DEFAULT_FOOD_DATABASE.find(f => f.id === 'food_raw_almonds');
    }
  }

  // If matched, compute based on matched nutrients
  if (matched) {
    const nutrients = calculateNutrientsForWeight(matched, weightGrams);
    const cleanTitle = input.replace(/\d+\s*(?:g|grams|gram|oz|ml|cups?|slices?)?/gi, '').trim() || matched.name;
    const finalName = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    const sugar = nutrients.sugar || 0;
    const sugarLevel: 'low' | 'moderate' | 'high' = sugar > 15 ? 'high' : sugar >= 5 ? 'moderate' : 'low';
    const sensitivity = checkDigestiveSensitivity(matched.name);

    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      foodId: matched.id,
      name: finalName.length > 2 ? finalName : matched.name,
      emoji: matched.emoji,
      weightGrams,
      mealType: detectedMeal,
      ...nutrients,
      sugar,
      sugarLevel,
      dietType: matched.dietType || dietType,
      digestiveWarning: sensitivity.hasSensitivity ? sensitivity.warningMessage : undefined,
      suggestedAlternative: sensitivity.hasSensitivity ? 'Stewed Bottle Gourd (Lauki) or Steamed Zucchini' : undefined,
      researchNote: `Researched data: ${nutrients.calories} kcal, ${nutrients.protein}g protein, ${nutrients.calcium}mg calcium, ${sugar}g sugar.`,
      loggedAt: new Date().toISOString(),
    };
  }

  // Domain-Accurate Category Classification (NOT everything has calcium, NOT everything has protein!)
  const cleanName = input.replace(/\d+\s*(?:g|grams|gram|oz|ml|cups?|slices?)?/gi, '').trim() || 'Nutritious Food';
  const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  const factor = weightGrams / 100;

  // 1. Pure Oils & Fats: 0 protein, 0 calcium, 0 sugar
  const isOil = ['oil', 'ghee', 'butter', 'fat', 'lard', 'mayo'].some(k => lower.includes(k));
  if (isOil) {
    return {
      id: `log_custom_${Date.now()}`,
      foodId: `custom_oil_${Date.now()}`,
      name: displayName,
      emoji: '🧈',
      weightGrams,
      mealType: detectedMeal,
      calories: Math.round(800 * factor),
      protein: 0,
      fat: Math.round(90 * factor * 10) / 10,
      calcium: 0,
      carbs: 0,
      sugar: 0,
      sugarLevel: 'low',
      dietType: 'veg',
      researchNote: 'Pure lipid — contains 0g protein, 0mg calcium, and 0g sugar.',
      loggedAt: new Date().toISOString(),
    };
  }

  // 2. Pure Sugars, Sweets & Sodas: 0 protein, 0 calcium, HIGH sugar
  const isSweet = ['sugar', 'candy', 'soda', 'coke', 'pepsi', 'sprite', 'syrup', 'mithai', 'jalebi', 'sweet', 'dessert', 'cake'].some(k => lower.includes(k));
  if (isSweet) {
    const sugar = Math.round(75 * factor * 10) / 10;
    return {
      id: `log_custom_${Date.now()}`,
      foodId: `custom_sweet_${Date.now()}`,
      name: displayName,
      emoji: '🍬',
      weightGrams,
      mealType: detectedMeal,
      calories: Math.round(360 * factor),
      protein: 0.5,
      fat: Math.round(4 * factor * 10) / 10,
      calcium: 5,
      carbs: Math.round(85 * factor * 10) / 10,
      sugar,
      sugarLevel: 'high',
      dietType: 'veg',
      researchNote: '⚠️ High sugar content! Watch blood glucose for grandmother\'s diabetes.',
      loggedAt: new Date().toISOString(),
    };
  }

  // 3. Water & Unsweetened Drinks: 0 protein, 0 calcium, 0 sugar
  const isWaterDrink = ['water', 'black coffee', 'green tea', 'tea', 'sparkling'].some(k => lower.includes(k));
  if (isWaterDrink) {
    return {
      id: `log_custom_${Date.now()}`,
      foodId: `custom_bev_${Date.now()}`,
      name: displayName,
      emoji: '☕',
      weightGrams,
      mealType: detectedMeal,
      calories: Math.round(2 * factor),
      protein: 0,
      fat: 0,
      calcium: 2,
      carbs: 0,
      sugar: 0,
      sugarLevel: 'low',
      dietType: 'veg',
      researchNote: 'Hydrating zero-sugar drink, safe for diabetes.',
      loggedAt: new Date().toISOString(),
    };
  }

  // 4. Fresh Fruits: low protein (< 1g), low calcium (< 10mg), natural sugar
  const isFruit = ['fruit', 'apple', 'banana', 'orange', 'grape', 'mango', 'melon', 'papaya', 'pineapple', 'berry', 'guava'].some(k => lower.includes(k));
  if (isFruit) {
    const sugar = Math.round(11 * factor * 10) / 10;
    return {
      id: `log_custom_${Date.now()}`,
      foodId: `custom_fruit_${Date.now()}`,
      name: displayName,
      emoji: '🍎',
      weightGrams,
      mealType: detectedMeal,
      calories: Math.round(55 * factor),
      protein: Math.round(0.6 * factor * 10) / 10,
      fat: Math.round(0.2 * factor * 10) / 10,
      calcium: Math.round(8 * factor),
      carbs: Math.round(14 * factor * 10) / 10,
      sugar,
      sugarLevel: sugar > 15 ? 'high' : sugar >= 5 ? 'moderate' : 'low',
      dietType: 'veg',
      researchNote: 'Natural fruit fructose; minimal protein & calcium. Fiber helps glycemic load.',
      loggedAt: new Date().toISOString(),
    };
  }

  // 5. Vegetables: low calories, low sugar (diabetic safe)
  const isVeg = ['vegetable', 'sabzi', 'salad', 'greens', 'cucumber', 'tomato', 'zucchini', 'cabbage', 'okra'].some(k => lower.includes(k));
  if (isVeg) {
    const sugar = Math.round(2.2 * factor * 10) / 10;
    return {
      id: `log_custom_${Date.now()}`,
      foodId: `custom_veg_${Date.now()}`,
      name: displayName,
      emoji: '🥦',
      weightGrams,
      mealType: detectedMeal,
      calories: Math.round(25 * factor),
      protein: Math.round(1.5 * factor * 10) / 10,
      fat: Math.round(0.3 * factor * 10) / 10,
      calcium: Math.round(28 * factor),
      carbs: Math.round(4.8 * factor * 10) / 10,
      sugar,
      sugarLevel: 'low',
      dietType: 'veg',
      researchNote: 'Diabetic-friendly green: low sugar, high fiber for steady glucose.',
      loggedAt: new Date().toISOString(),
    };
  }

  // 6. Non-Veg Meats: high protein, 0g sugar, low calcium
  if (dietType === 'non_veg') {
    return {
      id: `log_custom_${Date.now()}`,
      foodId: `custom_meat_${Date.now()}`,
      name: displayName,
      emoji: '🍗',
      weightGrams,
      mealType: detectedMeal,
      calories: Math.round(180 * factor),
      protein: Math.round(27 * factor * 10) / 10,
      fat: Math.round(7 * factor * 10) / 10,
      calcium: Math.round(14 * factor), // Meat has minimal calcium
      carbs: 0,
      sugar: 0,                         // 0g sugar
      sugarLevel: 'low',
      dietType: 'non_veg',
      researchNote: 'Complete lean protein, 0g sugar. Meats do not provide significant calcium.',
      loggedAt: new Date().toISOString(),
    };
  }

  // 7. General mixed fallback
  const sugar = Math.round(3.5 * factor * 10) / 10;
  return {
    id: `log_custom_${Date.now()}`,
    foodId: `custom_${Date.now()}`,
    name: displayName,
    emoji: dietType === 'egg' ? '🥚' : '🥗',
    weightGrams,
    mealType: detectedMeal,
    calories: Math.round(135 * factor),
    protein: Math.round((dietType === 'egg' ? 12 : 5) * factor * 10) / 10,
    fat: Math.round(4.5 * factor * 10) / 10,
    calcium: Math.round(25 * factor),
    carbs: Math.round(18 * factor * 10) / 10,
    sugar,
    sugarLevel: sugar > 15 ? 'high' : sugar >= 5 ? 'moderate' : 'low',
    dietType,
    researchNote: `Researched nutrition: calibrated for ${weightGrams}g portion ✨`,
    loggedAt: new Date().toISOString(),
  };
}
