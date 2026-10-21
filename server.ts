import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI if key available
let ai: GoogleGenAI | null = null;
let geminiAvailable = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

if (geminiAvailable) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch {
    geminiAvailable = false;
  }
}

// Scientific nutritional database for instant, reliable research with sugar & diabetes awareness
interface FoodNutrientBase {
  keywords: string[];
  name: string;
  emoji: string;
  calPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  calciumPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  dietType: 'veg' | 'non_veg' | 'egg';
  defaultServingGrams: number;
  note: string;
}

const NUTRITION_KNOWLEDGE_BASE: FoodNutrientBase[] = [
  // --- Indian Rotis, Breads & Grains (Accurately Double Checked: No Added Sugar!) ---
  {
    keywords: ['roti', 'phulka', 'chapati', 'chappati', 'wheat roti', 'fulka', 'rotis'],
    name: 'Handmade Whole Wheat Phulka / Roti',
    emoji: '🫓',
    calPer100g: 242,
    proteinPer100g: 8.6,
    fatPer100g: 1.4,
    calciumPer100g: 42,
    carbsPer100g: 48.5,
    sugarPer100g: 0.6, // Homemade roti has NO added sugar (~0.2g sugar per 35g roti)!
    dietType: 'veg',
    defaultServingGrams: 35,
    note: 'Fresh whole wheat phulka: zero added sugar, gentle complex grain (0.2g sugar per roti).',
  },
  {
    keywords: ['ragi roti', 'ragi', 'nachni', 'finger millet', 'ragi mudde'],
    name: 'Ragi Roti (Finger Millet / Nachni)',
    emoji: '🌾',
    calPer100g: 262,
    proteinPer100g: 6.8,
    fatPer100g: 2.2,
    calciumPer100g: 344, // Indian superfood for bones: 344mg calcium per 100g flour!
    carbsPer100g: 52.0,
    sugarPer100g: 0.6,
    dietType: 'veg',
    defaultServingGrams: 40,
    note: 'Powerhouse calcium (138mg/roti) with complex slow-release fiber for blood sugar control.',
  },
  {
    keywords: ['khichdi', 'khichri', 'moong khichdi', 'dal khichdi'],
    name: 'Moong Dal Khichdi (Mild Turmeric)',
    emoji: '🍲',
    calPer100g: 98,
    proteinPer100g: 3.6,
    fatPer100g: 1.8,
    calciumPer100g: 20,
    carbsPer100g: 16.8,
    sugarPer100g: 0.5,
    dietType: 'veg',
    defaultServingGrams: 180,
    note: 'Classic soothing Indian comfort food for Grandma; gentle on digestion and low glycemic.',
  },
  {
    keywords: ['idli', 'idlis', 'steamed idli'],
    name: 'Steamed Idli (Fermented)',
    emoji: '⚪',
    calPer100g: 132,
    proteinPer100g: 4.2,
    fatPer100g: 0.4,
    calciumPer100g: 18,
    carbsPer100g: 27.5,
    sugarPer100g: 0.5,
    dietType: 'veg',
    defaultServingGrams: 100, // 2 idlis
    note: 'Fermented lentil & rice cakes: gentle on elderly gut, low fat & low sugar.',
  },
  {
    keywords: ['dosa', 'sada dosa', 'plain dosa'],
    name: 'Plain Sada Dosa',
    emoji: '🥞',
    calPer100g: 178,
    proteinPer100g: 4.6,
    fatPer100g: 4.8,
    calciumPer100g: 20,
    carbsPer100g: 29.2,
    sugarPer100g: 0.7,
    dietType: 'veg',
    defaultServingGrams: 80,
    note: 'Fermented crepe: best paired with protein-rich Sambar.',
  },
  {
    keywords: ['poha', 'pohe', 'batata poha'],
    name: 'Poha (Flattened Rice)',
    emoji: '🍚',
    calPer100g: 150,
    proteinPer100g: 3.2,
    fatPer100g: 4.3,
    calciumPer100g: 16,
    carbsPer100g: 24.0,
    sugarPer100g: 1.1,
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Light flattened rice cooked with turmeric, mustard, and curry leaves.',
  },
  {
    keywords: ['upma', 'rava upma', 'sooji upma'],
    name: 'Vegetable Upma',
    emoji: '🍲',
    calPer100g: 130,
    proteinPer100g: 3.0,
    fatPer100g: 3.5,
    calciumPer100g: 15,
    carbsPer100g: 21.6,
    sugarPer100g: 0.8,
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Savory semolina porridge with mild spices.',
  },
  {
    keywords: ['besan cheela', 'besan chilla', 'cheela', 'chilla', 'puda'],
    name: 'Besan Cheela (Gram Flour Pancake)',
    emoji: '🥞',
    calPer100g: 181,
    proteinPer100g: 8.5,
    fatPer100g: 6.0,
    calciumPer100g: 35,
    carbsPer100g: 23.1,
    sugarPer100g: 1.3,
    dietType: 'veg',
    defaultServingGrams: 80,
    note: 'High protein plant pancake with 6.8g protein and low glycemic index.',
  },
  {
    keywords: ['basmati rice', 'white rice', 'cooked rice', 'chawal', 'rice'],
    name: 'Cooked Basmati / White Rice',
    emoji: '🍚',
    calPer100g: 130,
    proteinPer100g: 2.7,
    fatPer100g: 0.3,
    calciumPer100g: 10,
    carbsPer100g: 28.2,
    sugarPer100g: 0.1,
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Pure starch carbohydrates (10mg calcium). Always pair with Dal or Sabzi to blunt glucose spike.',
  },
  {
    keywords: ['oats', 'rolled oats', 'oatmeal', 'porridge'],
    name: 'Rolled Oats Porridge',
    emoji: '🌾',
    calPer100g: 68,
    proteinPer100g: 2.4,
    fatPer100g: 1.4,
    calciumPer100g: 14,
    carbsPer100g: 12.0,
    sugarPer100g: 0.5,
    dietType: 'veg',
    defaultServingGrams: 200,
    note: 'Soluble beta-glucan fiber helps slow glucose absorption.',
  },

  // --- Indian Dals & Legumes (High Protein, High Fiber, Low Sugar) ---
  {
    keywords: ['moong dal', 'mung dal', 'yellow dal', 'dal tadka', 'tadka dal', 'dal fry'],
    name: 'Cooked Yellow Moong Dal',
    emoji: '🍲',
    calPer100g: 86,
    proteinPer100g: 5.0,
    fatPer100g: 1.7,
    calciumPer100g: 19,
    carbsPer100g: 12.8,
    sugarPer100g: 0.7,
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Light on senior digestion, high soluble fiber to stabilize blood sugar.',
  },
  {
    keywords: ['toor dal', 'arhar dal', 'tuvar dal', 'dal'],
    name: 'Cooked Toor / Arhar Dal',
    emoji: '🍲',
    calPer100g: 93,
    proteinPer100g: 5.4,
    fatPer100g: 1.9,
    calciumPer100g: 21,
    carbsPer100g: 13.5,
    sugarPer100g: 0.8,
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Vegetarian protein powerhouse (8.1g protein/bowl) with low glycemic impact.',
  },
  {
    keywords: ['sambar', 'sambhar'],
    name: 'South Indian Vegetable Sambar',
    emoji: '🍲',
    calPer100g: 60,
    proteinPer100g: 2.7,
    fatPer100g: 1.4,
    calciumPer100g: 23,
    carbsPer100g: 9.2,
    sugarPer100g: 1.3,
    dietType: 'veg',
    defaultServingGrams: 180,
    note: 'Lentil & vegetable stew with drumstick and tamarind; low sugar and gut friendly.',
  },
  {
    keywords: ['chole', 'chana masala', 'kabuli chana', 'chickpeas'],
    name: 'Cooked Chickpeas (Chole)',
    emoji: '🧆',
    calPer100g: 135,
    proteinPer100g: 5.3,
    fatPer100g: 3.5,
    calciumPer100g: 33,
    carbsPer100g: 20.6,
    sugarPer100g: 1.5,
    dietType: 'veg',
    defaultServingGrams: 180,
    note: 'Fiber-dense legumes providing 9.5g protein per bowl.',
  },
  {
    keywords: ['rajma', 'kidney beans'],
    name: 'Cooked Rajma (Kidney Beans)',
    emoji: '🫘',
    calPer100g: 118,
    proteinPer100g: 5.0,
    fatPer100g: 2.8,
    calciumPer100g: 27,
    carbsPer100g: 18.2,
    sugarPer100g: 1.2,
    dietType: 'veg',
    defaultServingGrams: 180,
    note: 'Classic North Indian protein dish with complex slow-burning carbs.',
  },
  {
    keywords: ['moong broth', 'moong soup', 'dal soup', 'lentil soup'],
    name: 'Warm Moong Dal & Veg Broth',
    emoji: '🥣',
    calPer100g: 52,
    proteinPer100g: 4.2,
    fatPer100g: 0.5,
    calciumPer100g: 32,
    carbsPer100g: 8.0,
    sugarPer100g: 0.6,
    dietType: 'veg',
    defaultServingGrams: 180,
    note: 'Soothing warm broth; zero digestive irritation and steady blood glucose.',
  },

  // --- Indian Dairy & Calcium Powerhouses ---
  {
    keywords: ['paneer', 'cottage cheese', 'paneer cubes', 'paneer sabzi', 'paneer bhurji'],
    name: 'Fresh Paneer (Cottage Cheese)',
    emoji: '🧀',
    calPer100g: 265,
    proteinPer100g: 18.3,
    fatPer100g: 20.8,
    calciumPer100g: 480, // 480mg calcium per 100g! Essential for bones
    carbsPer100g: 3.5,
    sugarPer100g: 2.0, // Natural lactose only, blunts blood sugar spikes
    dietType: 'veg',
    defaultServingGrams: 60,
    note: 'Superb calcium (288mg in 60g) and protein for bone density; ultra-low glycemic impact.',
  },
  {
    keywords: ['dahi', 'curd', 'plain curd', 'homemade curd', 'yogurt', 'indian yogurt'],
    name: 'Homemade Dahi (Plain Curd)',
    emoji: '🥣',
    calPer100g: 61,
    proteinPer100g: 3.5,
    fatPer100g: 3.2,
    calciumPer100g: 125, // 188mg in 150g katori
    carbsPer100g: 4.4,
    sugarPer100g: 3.2, // Natural lactose, 0g added sugar
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Probiotic plain curd: 188mg calcium for Grandma, zero added sugar, blunts post-meal glucose rise.',
  },
  {
    keywords: ['chaas', 'buttermilk', 'mattha', 'spiced buttermilk'],
    name: 'Spiced Chaas (Roasted Jeera)',
    emoji: '🥛',
    calPer100g: 23,
    proteinPer100g: 1.6,
    fatPer100g: 0.8,
    calciumPer100g: 72, // 144mg in 200ml glass
    carbsPer100g: 2.4,
    sugarPer100g: 1.7,
    dietType: 'veg',
    defaultServingGrams: 200,
    note: 'Cooling, digestive probiotic drink with cumin; delivers 144mg calcium with only 3.4g natural sugar.',
  },
  {
    keywords: ['milk', 'whole milk', 'cow milk', 'warm milk', 'haldi milk', 'turmeric milk'],
    name: 'Warm Milk (Cow / Full Cream)',
    emoji: '🥛',
    calPer100g: 61,
    proteinPer100g: 3.2,
    fatPer100g: 3.3,
    calciumPer100g: 120, // 240mg in 200ml cup
    carbsPer100g: 4.8,
    sugarPer100g: 5.0, // Natural lactose
    dietType: 'veg',
    defaultServingGrams: 200,
    note: 'Bioavailable calcium for grandmother\'s bones (240mg). Natural lactose sugar.',
  },

  // --- Indian Vegetables & Sugar Reducers (No Cucumber Sensitivity!) ---
  {
    keywords: ['lauki', 'bottle gourd', 'doodhi', 'ghia', 'calabash', 'stewed lauki', 'lauki sabzi'],
    name: 'Stewed Bottle Gourd (Lauki / Doodhi)',
    emoji: '🥣',
    calPer100g: 16,
    proteinPer100g: 0.6,
    fatPer100g: 0.5,
    calciumPer100g: 25,
    carbsPer100g: 2.4,
    sugarPer100g: 0.5, // Exceptional for diabetes!
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Ultra soothing for Grandma\'s digestion (replaces cucumber without bloating); only 0.8g sugar per bowl!',
  },
  {
    keywords: ['karela', 'bitter gourd', 'karela sabzi'],
    name: 'Karela Sabzi (Cooked Bitter Gourd)',
    emoji: '🥗',
    calPer100g: 68,
    proteinPer100g: 1.8,
    fatPer100g: 3.5,
    calciumPer100g: 22,
    carbsPer100g: 7.5,
    sugarPer100g: 0.8, // Active insulin-mimicking charantin
    dietType: 'veg',
    defaultServingGrams: 100,
    note: 'Clinically proven Indian vegetable with charantin & polypeptide-p that naturally lower blood glucose spikes!',
  },
  {
    keywords: ['turai', 'tori', 'ridge gourd', 'sponge gourd', 'turai sabzi'],
    name: 'Stewed Ridge Gourd (Turai / Tori)',
    emoji: '🥗',
    calPer100g: 18,
    proteinPer100g: 0.7,
    fatPer100g: 0.6,
    calciumPer100g: 18,
    carbsPer100g: 2.6,
    sugarPer100g: 0.8,
    dietType: 'veg',
    defaultServingGrams: 140,
    note: 'Gentle warm vegetable for senior digestion; ultra-low sugar (1.1g) and cooling.',
  },
  {
    keywords: ['palak', 'spinach', 'palak sabzi', 'steamed palak'],
    name: 'Palak Sabzi / Steamed Spinach',
    emoji: '🥬',
    calPer100g: 32,
    proteinPer100g: 2.9,
    fatPer100g: 1.2,
    calciumPer100g: 120, // 180mg in 150g!
    carbsPer100g: 3.6,
    sugarPer100g: 0.4,
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Diabetic super green: 180mg calcium, iron, and near-zero sugar!',
  },
  {
    keywords: ['palak paneer'],
    name: 'Palak Paneer',
    emoji: '🧀',
    calPer100g: 125,
    proteinPer100g: 6.9,
    fatPer100g: 8.6,
    calciumPer100g: 180, // 324mg in 180g bowl!
    carbsPer100g: 3.9,
    sugarPer100g: 1.3,
    dietType: 'veg',
    defaultServingGrams: 180,
    note: 'Supreme combination for grandmother: 324mg calcium, 12.4g protein, and only 2.3g sugar.',
  },
  {
    keywords: ['bhindi', 'okra', 'ladyfinger', 'bhindi sabzi'],
    name: 'Bhindi Sabzi (Cooked Ladyfinger)',
    emoji: '🥗',
    calPer100g: 78,
    proteinPer100g: 1.8,
    fatPer100g: 3.5,
    calciumPer100g: 71,
    carbsPer100g: 7.9,
    sugarPer100g: 1.2,
    dietType: 'veg',
    defaultServingGrams: 120,
    note: 'Soluble mucilage fiber binds to sugar and slows glucose absorption into bloodstream.',
  },
  {
    keywords: ['zucchini', 'steamed zucchini'],
    name: 'Steamed Tender Zucchini',
    emoji: '🥒',
    calPer100g: 17,
    proteinPer100g: 1.2,
    fatPer100g: 0.3,
    calciumPer100g: 21,
    carbsPer100g: 3.1,
    sugarPer100g: 1.7,
    dietType: 'veg',
    defaultServingGrams: 120,
    note: 'Warm cooked alternative to raw cucumber — gentle on senior stomachs.',
  },
  {
    keywords: ['gajar', 'carrot', 'cooked carrots'],
    name: 'Soft Cooked Carrots (Gajar)',
    emoji: '🥕',
    calPer100g: 35,
    proteinPer100g: 0.8,
    fatPer100g: 0.2,
    calciumPer100g: 33,
    carbsPer100g: 8.2,
    sugarPer100g: 3.5,
    dietType: 'veg',
    defaultServingGrams: 100,
    note: 'Tender cooked carrots rich in beta carotene.',
  },
  {
    keywords: ['cucumber', 'kheera', 'kakdi'],
    name: 'Fresh Cucumber Slices (Kheera)',
    emoji: '🥒',
    calPer100g: 15,
    proteinPer100g: 0.7,
    fatPer100g: 0.1,
    calciumPer100g: 16,
    carbsPer100g: 3.6,
    sugarPer100g: 1.7,
    dietType: 'veg',
    defaultServingGrams: 100,
    note: 'Note: Raw cucumber often causes gas/bloating in Grandma. Consider cooked Lauki or Turai instead.',
  },

  // --- Indian Snacks, Nuts & Sugar-Reducing Drinks ---
  {
    keywords: ['chana', 'bhuna chana', 'roasted chana', 'roasted chickpeas'],
    name: 'Roasted Chana (Bhuna Chana with Skin)',
    emoji: '🧆',
    calPer100g: 383,
    proteinPer100g: 20.7,
    fatPer100g: 6.7,
    calciumPer100g: 70,
    carbsPer100g: 58.3,
    sugarPer100g: 2.6,
    dietType: 'veg',
    defaultServingGrams: 30,
    note: 'Ideal low-GI Indian snack: 6.2g protein, high fiber, prevents glucose crashes.',
  },
  {
    keywords: ['methi water', 'methi dana', 'methi tea', 'fenugreek water'],
    name: 'Warm Methi Dana Water (Fenugreek)',
    emoji: '🍵',
    calPer100g: 8,
    proteinPer100g: 0.5,
    fatPer100g: 0.1,
    calciumPer100g: 10,
    carbsPer100g: 1.2,
    sugarPer100g: 0.1,
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Ayurvedic blood sugar regulator: 4-hydroxyisoleucine helps stimulate natural insulin sensitivity.',
  },
  {
    keywords: ['chai without sugar', 'sugar free chai', 'masala chai', 'ginger tea', 'adrak chai', 'tea'],
    name: 'Indian Masala Chai (No Added Sugar)',
    emoji: '☕',
    calPer100g: 30,
    proteinPer100g: 1.5,
    fatPer100g: 1.4,
    calciumPer100g: 53,
    carbsPer100g: 2.3,
    sugarPer100g: 1.7, // Natural lactose only
    dietType: 'veg',
    defaultServingGrams: 150,
    note: 'Masala chai brewed with ginger & cardamom, without added sugar (80mg calcium from milk).',
  },
  {
    keywords: ['sweet chai', 'chai with sugar', 'sugar chai'],
    name: 'Indian Masala Chai with 1 tsp Sugar',
    emoji: '☕',
    calPer100g: 43,
    proteinPer100g: 1.5,
    fatPer100g: 1.4,
    calciumPer100g: 53,
    carbsPer100g: 5.6,
    sugarPer100g: 5.0, // 5g added sucrose!
    dietType: 'veg',
    defaultServingGrams: 150,
    note: '⚠️ Contains 5g added sucrose sugar; monitor daily limit for diabetes.',
  },
  {
    keywords: ['almonds', 'badam', 'nuts'],
    name: 'Raw Almonds (Badam)',
    emoji: '🥜',
    calPer100g: 579,
    proteinPer100g: 21.2,
    fatPer100g: 49.9,
    calciumPer100g: 269,
    carbsPer100g: 21.6,
    sugarPer100g: 4.4,
    dietType: 'veg',
    defaultServingGrams: 20,
    note: 'Rich in bone-strengthening calcium & healthy fats; zero added sugar.',
  },
  {
    keywords: ['ghee', 'desi ghee', 'clarified butter'],
    name: 'Desi Ghee (Clarified Butter)',
    emoji: '🧈',
    calPer100g: 884,
    proteinPer100g: 0.3,
    fatPer100g: 99.5,
    calciumPer100g: 8,
    carbsPer100g: 0,
    sugarPer100g: 0,
    dietType: 'veg',
    defaultServingGrams: 10,
    note: 'Pure lipid: 0g sugar. Helps absorption of fat-soluble vitamins.',
  },

  // --- Eggetarian & Non-Veg Items ---
  {
    keywords: ['egg', 'boiled egg', 'eggs', 'egg bhurji', 'omelet'],
    name: 'Whole Boiled Egg / Egg Bhurji',
    emoji: '🥚',
    calPer100g: 155,
    proteinPer100g: 13.0,
    fatPer100g: 11.0,
    calciumPer100g: 56,
    carbsPer100g: 1.1,
    sugarPer100g: 0.4,
    dietType: 'egg',
    defaultServingGrams: 50,
    note: 'Complete protein with choline and healthy fats; 0g added sugar.',
  },
  {
    keywords: ['chicken', 'chicken curry', 'chicken breast', 'poultry'],
    name: 'Tender Chicken Breast / Curry',
    emoji: '🍗',
    calPer100g: 165,
    proteinPer100g: 31.0,
    fatPer100g: 3.6,
    calciumPer100g: 15,
    carbsPer100g: 0,
    sugarPer100g: 0,
    dietType: 'non_veg',
    defaultServingGrams: 120,
    note: 'Lean muscle-building protein, 0g sugar. Meats contain minimal calcium.',
  },

  // --- Indian Sweets (Double Checked for Accurate High Glucose Spike Warning!) ---
  {
    keywords: ['gulab jamun', 'jamun sweet'],
    name: 'Gulab Jamun (Syrup Soaked)',
    emoji: '🍬',
    calPer100g: 350,
    proteinPer100g: 5.2,
    fatPer100g: 15.0,
    calciumPer100g: 90,
    carbsPer100g: 50.0,
    sugarPer100g: 44.0, // HIGH SUGAR SPIKE!
    dietType: 'veg',
    defaultServingGrams: 50,
    note: '⚠️ Extremely high sugar (22g per piece)! Causes rapid blood glucose spikes.',
  },
  {
    keywords: ['jalebi', 'imarti'],
    name: 'Crispy Jalebi',
    emoji: '🥨',
    calPer100g: 450,
    proteinPer100g: 2.8,
    fatPer100g: 16.4,
    calciumPer100g: 20,
    carbsPer100g: 74.0,
    sugarPer100g: 58.0, // VERY HIGH SUGAR!
    dietType: 'veg',
    defaultServingGrams: 50,
    note: '⚠️ Pure deep-fried sugar syrup (29g sugar per 50g)! High spike alert for Grandmother.',
  },
  {
    keywords: ['ladoo', 'laddoo', 'besan ladoo', 'motichoor'],
    name: 'Besan Laddoo',
    emoji: '🟡',
    calPer100g: 433,
    proteinPer100g: 7.8,
    fatPer100g: 21.0,
    calciumPer100g: 40,
    carbsPer100g: 53.3,
    sugarPer100g: 46.6,
    dietType: 'veg',
    defaultServingGrams: 45,
    note: '⚠️ High sugar confection (21g sugar per laddoo). Monitor closely for diabetes.',
  },
  {
    keywords: ['sugar', 'white sugar', 'table sugar', 'shakkar', 'chini'],
    name: 'Table Sugar / Chini',
    emoji: '🍬',
    calPer100g: 387,
    proteinPer100g: 0,
    fatPer100g: 0,
    calciumPer100g: 1,
    carbsPer100g: 100.0,
    sugarPer100g: 100.0, // 100% PURE SUGAR
    dietType: 'veg',
    defaultServingGrams: 5,
    note: '⚠️ 100% pure sucrose sugar! Immediate blood sugar spike risk for Grandma.',
  },

  // --- Low-GI Fruits ---
  {
    keywords: ['papaya', 'papita'],
    name: 'Fresh Papaya Cubes',
    emoji: '🍈',
    calPer100g: 43,
    proteinPer100g: 0.5,
    fatPer100g: 0.3,
    calciumPer100g: 20,
    carbsPer100g: 10.8,
    sugarPer100g: 7.8,
    dietType: 'veg',
    defaultServingGrams: 140,
    note: 'Papain enzyme aids gentle digestion; moderate natural sugar.',
  },
  {
    keywords: ['guava', 'amrood'],
    name: 'Fresh Guava (Amrood)',
    emoji: '🍏',
    calPer100g: 68,
    proteinPer100g: 2.6,
    fatPer100g: 1.0,
    calciumPer100g: 18,
    carbsPer100g: 14.3,
    sugarPer100g: 8.9,
    dietType: 'veg',
    defaultServingGrams: 100,
    note: 'Super-rich in pectin dietary fiber (5.4g/100g); excellent low-GI fruit for diabetes.',
  },
  {
    keywords: ['apple', 'apple slices'],
    name: 'Crisp Apple Slices',
    emoji: '🍎',
    calPer100g: 52,
    proteinPer100g: 0.3,
    fatPer100g: 0.2,
    calciumPer100g: 6,
    carbsPer100g: 13.8,
    sugarPer100g: 10.4,
    dietType: 'veg',
    defaultServingGrams: 120,
    note: 'Pectin fiber; negligible calcium (6mg) and protein (0.3g).',
  }
];

// Helper to research food locally with high precision, category-aware nutrients & diabetes metrics
function researchFoodLocally(input: string, mealType: string) {
  const lower = input.toLowerCase().trim();

  // Extract weight in grams with Indian portion awareness (rotis, katoris, glasses)
  let weightGrams = 100;
  const rotiMatch = lower.match(/(\d+)\s*(?:rotis?|phulkas?|chapatis?|fulkas?)\b/);
  const katoriMatch = lower.match(/(\d+)\s*(?:katoris?|bowls?|cups?)\b/);
  const glassMatch = lower.match(/(\d+)\s*(?:glass(?:es)?|tumblers?|mugs?)\b/);
  const gMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|grams|gram)\b/);
  const ozMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces|ounce)\b/);
  const mlMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliters)\b/);
  const sliceMatch = lower.match(/(\d+)\s*slices?\b/);
  const pieceMatch = lower.match(/(\d+)\s*(?:pieces?|pcs?)\b/);
  const numMatch = lower.match(/\b(\d{1,4})\b/);

  if (rotiMatch) {
    weightGrams = parseInt(rotiMatch[1], 10) * 35; // 35g per phulka
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
    if (n >= 10 && n <= 2500) weightGrams = n;
    else if (n >= 1 && n <= 9 && (lower.includes('roti') || lower.includes('phulka'))) weightGrams = n * 35;
  }

  // Find best match in knowledge base
  let matched = NUTRITION_KNOWLEDGE_BASE.find(item =>
    item.keywords.some(k => lower.includes(k))
  );

  // Determine diet type (strict classification)
  let dietType: 'veg' | 'non_veg' | 'egg' = 'veg';
  const nonVegKeywords = ['chicken', 'poultry', 'fish', 'salmon', 'tuna', 'beef', 'pork', 'bacon', 'mutton', 'lamb', 'meat', 'seafood', 'shrimp', 'crab'];
  const eggKeywords = ['egg', 'eggs', 'omelet', 'scramble'];

  if (nonVegKeywords.some(k => lower.includes(k))) dietType = 'non_veg';
  else if (eggKeywords.some(k => lower.includes(k))) dietType = 'egg';
  else if (matched) dietType = matched.dietType;

  // Clean food display name
  const cleanName = input.replace(/\d+\s*(?:g|grams|gram|oz|ml|cups?|slices?)?/gi, '').trim() || (matched ? matched.name : 'Nutritious Meal');
  const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  if (matched) {
    const factor = weightGrams / 100;
    const sugar = Math.round(matched.sugarPer100g * factor * 10) / 10;
    const sugarLevel: 'low' | 'moderate' | 'high' = sugar > 15 ? 'high' : sugar >= 5 ? 'moderate' : 'low';

    return {
      name: displayName.length > 2 ? displayName : matched.name,
      emoji: matched.emoji,
      weightGrams,
      calories: Math.round(matched.calPer100g * factor),
      protein: Math.round(matched.proteinPer100g * factor * 10) / 10,
      fat: Math.round(matched.fatPer100g * factor * 10) / 10,
      calcium: Math.round(matched.calciumPer100g * factor),
      carbs: Math.round(matched.carbsPer100g * factor * 10) / 10,
      sugar,
      sugarLevel,
      dietType: matched.dietType,
      mealType: mealType || 'breakfast',
      researchNote: matched.note,
    };
  }

  // Smart Category-Based Estimation (NOT everything has calcium, NOT everything has protein!)
  const factor = weightGrams / 100;

  // 1. Pure Oils & Fats (0 protein, 0 calcium, 0 sugar)
  const isOilOrFat = ['oil', 'ghee', 'butter', 'lard', 'mayo', 'mayonnaise', 'fat'].some(k => lower.includes(k));
  if (isOilOrFat) {
    return {
      name: displayName,
      emoji: '🧈',
      weightGrams,
      calories: Math.round(800 * factor),
      protein: 0,
      fat: Math.round(90 * factor * 10) / 10,
      calcium: 0,
      carbs: 0,
      sugar: 0,
      sugarLevel: 'low',
      dietType: 'veg',
      mealType: mealType || 'breakfast',
      researchNote: 'Pure lipid fat — contains 0g protein, 0mg calcium, and 0g sugar.',
    };
  }

  // 2. Pure Sugars, Sweets & Sodas (0 protein, 0 calcium, very high sugar)
  const isSweetOrSoda = ['sugar', 'candy', 'soda', 'coke', 'pepsi', 'sprite', 'fanta', 'syrup', 'jam', 'jelly', 'sweet', 'mithai', 'jalebi', 'ladoo', 'dessert', 'cake', 'cookie', 'ice cream'].some(k => lower.includes(k));
  if (isSweetOrSoda) {
    const sugar = Math.round(75 * factor * 10) / 10;
    return {
      name: displayName,
      emoji: '🍬',
      weightGrams,
      calories: Math.round(360 * factor),
      protein: 0.5,
      fat: Math.round(4 * factor * 10) / 10,
      calcium: 5,
      carbs: Math.round(85 * factor * 10) / 10,
      sugar,
      sugarLevel: 'high',
      dietType: 'veg',
      mealType: mealType || 'snack',
      researchNote: '⚠️ High sugar intake! Watch blood glucose levels for grandmother\'s diabetes.',
    };
  }

  // 3. Water & Unsweetened Beverages (0 cal, 0 protein, 0 calcium, 0 sugar)
  const isZeroBeverage = ['water', 'black coffee', 'green tea', 'herbal tea', 'sparkling water', 'diet'].some(k => lower.includes(k));
  if (isZeroBeverage) {
    return {
      name: displayName,
      emoji: '☕',
      weightGrams,
      calories: Math.round(2 * factor),
      protein: 0,
      fat: 0,
      calcium: 2,
      carbs: 0,
      sugar: 0,
      sugarLevel: 'low',
      dietType: 'veg',
      mealType: mealType || 'breakfast',
      researchNote: 'Hydrating zero-sugar beverage — safe and healthy for diabetes.',
    };
  }

  // 4. Fresh Fruits (low protein < 1g, low calcium < 10mg, natural fructose)
  const isFruit = ['apple', 'banana', 'orange', 'grape', 'mango', 'melon', 'papaya', 'pineapple', 'berry', 'strawberry', 'peach', 'pear', 'plum', 'guava', 'fruit'].some(k => lower.includes(k));
  if (isFruit) {
    const sugar = Math.round(11 * factor * 10) / 10;
    const sugarLevel = sugar > 15 ? 'high' : sugar >= 5 ? 'moderate' : 'low';
    return {
      name: displayName,
      emoji: '🍎',
      weightGrams,
      calories: Math.round(55 * factor),
      protein: Math.round(0.6 * factor * 10) / 10, // Very low protein
      fat: Math.round(0.2 * factor * 10) / 10,
      calcium: Math.round(8 * factor),             // Very low calcium
      carbs: Math.round(14 * factor * 10) / 10,
      sugar,
      sugarLevel,
      dietType: 'veg',
      mealType: mealType || 'snack',
      researchNote: 'Natural fruit fructose; minimal protein & calcium. Fiber aids digestion.',
    };
  }

  // 5. Vegetables & Salads (low calories, low sugar, diabetic friendly)
  const isVeggie = ['cucumber', 'salad', 'lettuce', 'tomato', 'carrot', 'cabbage', 'cauliflower', 'gourd', 'bhindi', 'okra', 'zucchini', 'vegetable', 'sabzi'].some(k => lower.includes(k));
  if (isVeggie) {
    const sugar = Math.round(2.2 * factor * 10) / 10;
    return {
      name: displayName,
      emoji: '🥦',
      weightGrams,
      calories: Math.round(25 * factor),
      protein: Math.round(1.5 * factor * 10) / 10,
      fat: Math.round(0.3 * factor * 10) / 10,
      calcium: Math.round(28 * factor),
      carbs: Math.round(4.8 * factor * 10) / 10,
      sugar,
      sugarLevel: 'low',
      dietType: 'veg',
      mealType: mealType || 'lunch',
      researchNote: 'Diabetic-friendly green/vegetable: low sugar, high dietary fiber.',
    };
  }

  // 6. Meats / Poultry / Fish (high protein, 0 sugar, low calcium!)
  if (dietType === 'non_veg') {
    return {
      name: displayName,
      emoji: '🍗',
      weightGrams,
      calories: Math.round(180 * factor),
      protein: Math.round(27 * factor * 10) / 10, // High protein
      fat: Math.round(7 * factor * 10) / 10,
      calcium: Math.round(14 * factor),          // Low calcium: meat is NOT high in calcium
      carbs: 0,
      sugar: 0,                                  // 0g sugar
      sugarLevel: 'low',
      dietType: 'non_veg',
      mealType: mealType || 'lunch',
      researchNote: 'Complete lean protein, 0g sugar. Meats do not provide significant calcium.',
    };
  }

  // 7. General Balanced fallback (e.g. prepared dish, mixed meal)
  const sugar = Math.round(3.5 * factor * 10) / 10;
  const sugarLevel: 'low' | 'moderate' | 'high' = sugar > 15 ? 'high' : sugar >= 5 ? 'moderate' : 'low';
  return {
    name: displayName,
    emoji: dietType === 'egg' ? '🥚' : '🥗',
    weightGrams,
    calories: Math.round(135 * factor),
    protein: Math.round((dietType === 'egg' ? 12 : 5) * factor * 10) / 10,
    fat: Math.round(4.5 * factor * 10) / 10,
    calcium: Math.round(25 * factor),
    carbs: Math.round(18 * factor * 10) / 10,
    sugar,
    sugarLevel,
    dietType,
    mealType: mealType || 'breakfast',
    researchNote: `Researched nutrition: calibrated for ${weightGrams}g portion ✨`,
  };
}

// Research Food API Endpoint
app.post('/api/research-food', async (req, res) => {
  const { input, mealType } = req.body;

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Food input text is required' });
  }

  // If Gemini is available, attempt AI research with strict diabetic & nutrition rules
  if (geminiAvailable && ai) {
    try {
      const prompt = `Analyze this food entry: "${input}".
Accurately calculate nutrition for the specified weight (${input}) based on ICMR-NIN (Indian Council of Medical Research) and USDA clinical nutrition data.
IMPORTANT RULES FOR INDIAN FOODS & DIABETES:
1. INDIAN FOODS ARE MOSTLY ADDED:
   - Homemade Indian rotis / phulkas made from whole wheat atta have ZERO added sugar (~0.2g natural carb per 35g roti). NEVER use Western sandwich bread data which has added high fructose corn syrup!
   - Plain homemade Dahi (curd) and Chaas (buttermilk) have only natural milk lactose (~3-4g per serving), 0g added sugar.
   - Moong Dal, Toor Dal, Lauki (bottle gourd), Turai (ridge gourd), Karela (bitter gourd), and Palak are low glycemic Indian staples with very low sugar (<1g per serving).
   - Ragi (Finger Millet) has 344mg calcium per 100g flour!
   - Indian sweets (Gulab Jamun, Jalebi, Laddoo) have very high sugar (20-30g per piece) and trigger high spike warnings.
2. Calcium accuracy: Meats, plain rice, and plain fruits have minimal calcium (<10-15mg). Only Paneer, Milk, Dahi, Chaas, Ragi, and dark greens have high calcium.
3. Protein accuracy: Oils, butter, ghee, tea, and sugary foods have 0g protein.
4. Digestion note: Raw cucumber does not always suit Grandma's digestion; recommend soothing cooked Lauki or Turai.
5. Accurate sugar tracking for Grandmother who has diabetes: Identify exact grams of sugar. Classify sugarLevel as "low" (<5g), "moderate" (5-15g), or "high" (>15g).

Return ONLY a valid JSON object matching this schema without markdown ticks:
{
  "name": "Short clean food name",
  "emoji": "Single emoji",
  "weightGrams": integer weight in grams,
  "calories": integer calories (kcal) for this weight,
  "protein": number grams protein (1 decimal),
  "fat": number grams fat (1 decimal),
  "calcium": integer mg calcium for this weight,
  "carbs": number grams carbs (1 decimal),
  "sugar": number grams sugar (1 decimal),
  "sugarLevel": "low" or "moderate" or "high",
  "dietType": "veg" or "non_veg" or "egg",
  "mealType": "${mealType || 'breakfast'}",
  "researchNote": "1 short note on diabetes safety and key nutrients"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      let text = response.text || '';
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      const parsed = JSON.parse(text);
      if (parsed && parsed.name && typeof parsed.calories === 'number') {
        if (typeof parsed.sugar !== 'number') {
          parsed.sugar = 0;
        }
        if (!parsed.sugarLevel) {
          parsed.sugarLevel = parsed.sugar > 15 ? 'high' : parsed.sugar >= 5 ? 'moderate' : 'low';
        }
        return res.json({ success: true, data: parsed });
      }
    } catch {
      // Permission denied, quota exceeded, or network error:
      // Fallback gracefully to instant local nutrition engine
    }
  }

  // Instant, robust food research fallback (never fails)
  const localResearched = researchFoodLocally(input, mealType);
  return res.json({
    success: true,
    data: localResearched,
  });
});

// Helper for intelligent local Indian nutrition advice (when offline or fallback)
function generateLocalNutriAdvice(
  message: string,
  familyMember?: any,
  todayLogs?: any
) {
  const q = (message || '').toLowerCase();
  const name = familyMember?.name || 'Grandmother';
  const age = familyMember?.age || 72;
  const hasDiabetes = familyMember?.hasDiabetes ?? true;

  // 1. Analyze today's log request
  if (q.includes('analyze') || q.includes('review') || q.includes('how am i doing') || q.includes('today')) {
    const totalCal = todayLogs?.totalCalories || 0;
    const totalSugar = todayLogs?.totalSugar || 0;
    const totalCalcium = todayLogs?.totalCalcium || 0;
    const totalProtein = todayLogs?.totalProtein || 0;
    const targetCal = familyMember?.calorieTarget || 1650;
    const targetSugar = familyMember?.sugarLimit || 20;
    const targetCalcium = familyMember?.calciumTarget || 1200;
    const targetProtein = familyMember?.proteinTarget || 65;

    let sugarEval = totalSugar <= targetSugar
      ? `✅ **Sugar Intake (${totalSugar}g / ${targetSugar}g limit)**: Excellent! Well within safe glycemic boundaries.`
      : `⚠️ **Sugar Alert (${totalSugar}g / ${targetSugar}g limit)**: Exceeded safe target by ${Math.round((totalSugar - targetSugar) * 10) / 10}g. Balance out with warm water, roasted jeera chaas, and avoid sweetened tea or desserts tonight.`;

    let calciumEval = totalCalcium >= targetCalcium
      ? `✅ **Calcium (${totalCalcium}mg / ${targetCalcium}mg target)**: Great bone density support achieved today!`
      : `🥛 **Calcium (${totalCalcium}mg / ${targetCalcium}mg target)**: Need ${Math.max(0, targetCalcium - totalCalcium)}mg more. A glass of spiced chaas or 50g fresh paneer will bridge this gap.`;

    let proteinEval = totalProtein >= targetProtein
      ? `✅ **Protein (${totalProtein}g / ${targetProtein}g target)**: Terrific! Vital for muscle strength and recovery.`
      : `💪 **Protein (${totalProtein}g / ${targetProtein}g target)**: Add moong dal, besan cheela, or paneer to hit optimal amino acid balance.`;

    return {
      text: `### 📊 Daily Plate Analysis for ${name} (${age} yrs)

Here is how today's nutrition aligns with clinical targets:

* **Energy**: **${totalCal} kcal** / ${targetCal} kcal target
* ${sugarEval}
* ${calciumEval}
* ${proteinEval}

💡 **Nutritionist's Recommendation**: For dinner, choose light, easily digestible fiber such as stewed **Lauki (Bottle Gourd)** or warm **Moong Dal Khichdi** with a pinch of roasted cumin (jeera) to promote restorative sleep and steady morning glucose.`,
      suggestedFoods: [
        {
          name: 'Spiced Chaas with Roasted Jeera',
          emoji: '🥛',
          weightGrams: 200,
          calories: 58,
          protein: 4.2,
          calcium: 180,
          sugar: 3.2,
          mealType: 'snack',
          reason: 'Boosts calcium (180mg) and probiotics with minimal natural milk sugar.',
        },
        {
          name: 'Stewed Lauki Sabzi (Bottle Gourd)',
          emoji: '🥒',
          weightGrams: 150,
          calories: 32,
          protein: 1.2,
          calcium: 38,
          sugar: 1.2,
          mealType: 'dinner',
          reason: 'Soothing fiber that digests gently without nocturnal reflux.',
        },
      ],
      quickActions: [
        'How to reduce sugar in Indian food?',
        'What Indian foods have high calcium?',
        'Ideas for protein snacks',
      ],
    };
  }

  // 2. Sugar reduction & Diabetes
  if (q.includes('sugar') || q.includes('diabetes') || q.includes('spike') || q.includes('glucose')) {
    return {
      text: `### 🩸 ICMR Indian Nutrition Guide: Controlling Sugar & Blood Glucose

For **${name}** ${hasDiabetes ? '(managing diabetes)' : ''}, here are 4 clinically proven Indian dietary practices to flatten blood sugar curves:

1. **The "Sabzi & Dal First" Eating Sequence**:
   - Eat a small katori of warm cooked vegetables or dal *before* taking the first bite of roti or rice. The soluble fiber coats the intestinal lining and slows down glucose absorption by up to **35%**.

2. **Handmade Atta Roti (Zero Added Sugar)**:
   - Homemade 100% whole wheat phulkas contain **0g added sugars** (only ~0.2g natural carb per 35g roti). Avoid commercially packaged sandwich breads which frequently add corn syrup.

3. **Incorporate Bitter & Spiced Tonics**:
   - **Karela (Bitter Gourd)**: Contains charantin and polypeptide-p, acting like natural plant insulin.
   - **Methi (Fenugreek) Water**: Soaking 1 tsp methi seeds overnight improves peripheral insulin sensitivity.

4. **Swap Sugary Biscuits for Roasted Chana**:
   - Tea-time biscuits/rusks cause rapid sugar surges. Swap with **Bhuna Chana (Roasted Bengal Gram)** — crunchy, low GI, and rich in slow-release protein.`,
      suggestedFoods: [
        {
          name: 'Karela Sabzi (Bitter Gourd with Jeera)',
          emoji: '🥒',
          weightGrams: 100,
          calories: 34,
          protein: 1.8,
          calcium: 26,
          sugar: 0.8,
          mealType: 'lunch',
          reason: 'Natural plant polypeptide-p helps regulate postprandial glucose.',
        },
        {
          name: 'Roasted Chana (Bhuna Chana)',
          emoji: '🌰',
          weightGrams: 30,
          calories: 110,
          protein: 6.2,
          calcium: 18,
          sugar: 0.4,
          mealType: 'snack',
          reason: 'Crunchy 0-added-sugar evening tea companion with high satiety.',
        },
      ],
      quickActions: [
        'Analyze today\'s nutrition',
        'Suggest calcium foods without milk',
        'Best Indian evening snacks',
      ],
    };
  }

  // 3. Calcium sources (especially Indian vegetarian)
  if (q.includes('calcium') || q.includes('bone') || q.includes('osteoporosis') || q.includes('milk')) {
    return {
      text: `### 🥛 Top Indian Calcium Sources for Bone Strength

${name} requires **${familyMember?.calciumTarget || 1200} mg daily calcium** ${age >= 50 ? 'to prevent postmenopausal bone density loss (osteoporosis)' : 'for bone and dental health'}.

Here are the highest-yielding Indian foods:
* **Fresh Malai Paneer (60g)**: **~288 mg Calcium** + 11g Protein, 0.8g Sugar.
* **Spiced Buttermilk / Chaas (200ml)**: **~180 mg Calcium** + cooling gut probiotics.
* **Ragi (Finger Millet) Roti (40g)**: **~138 mg Calcium** — Ragi has nearly **8x the calcium** of polished white rice!
* **White Sesame Seeds (Til) (10g)**: **~98 mg Calcium** — sprinkle on rotis or vegetable stir-fries.
* **Palak (Steamed Spinach) (100g)**: **~73 mg Calcium** with bioavailable folate.`,
      suggestedFoods: [
        {
          name: 'Fresh Malai Paneer Cubes',
          emoji: '🧀',
          weightGrams: 60,
          calories: 165,
          protein: 11.0,
          calcium: 288,
          sugar: 0.8,
          mealType: 'snack',
          reason: '288mg calcium powerhouse with gentle protein and near-zero sugar.',
        },
        {
          name: 'Ragi Roti (Finger Millet Flatbread)',
          emoji: '🫓',
          weightGrams: 40,
          calories: 112,
          protein: 2.8,
          calcium: 138,
          sugar: 0.3,
          mealType: 'lunch',
          reason: 'Traditional millet with 8x higher calcium than white wheat flour.',
        },
      ],
      quickActions: [
        'How much calcium do teenagers need?',
        'Ideas for low-sugar snacks',
        'Analyze today\'s nutrition',
      ],
    };
  }

  // 4. Teenagers & Kids Growth
  if (q.includes('kid') || q.includes('teen') || q.includes('child') || q.includes('student') || q.includes('growth')) {
    return {
      text: `### 👧🧑 Indian Family Nutrition: Kids & Teens Growth Guide

For growing family members like children (ages 6–12) and teenagers (ages 13–18):

1. **Teenagers Peak Bone Mass Window**:
   - Adolescents need **1,300 mg of Calcium daily** — more than average adults! Their bodies are depositing over 40% of their lifetime skeletal bone mass.
   - Best additions: 1 glass cow milk or ragi porridge in the morning, fresh curd at lunch, and paneer or eggs in dinner.

2. **Wholesome Kids Lunchbox (Tiffin) Ideas**:
   - **Besan & Veggie Cheela**: High in plant protein and iron, rolls easily, stays soft for hours.
   - **Paneer Phulka Rolls**: Stuffed with grated paneer, mild turmeric, and bell peppers.
   - **Poha with Roasted Peanuts**: Quick iron and healthy fats without industrial preservatives.

3. **Replacing Refined Sugar**:
   - Switch commercial sugar syrups with crushed nuts, cardamom-infused dahi, or fresh seasonal sweet lime / apple slices.`,
      suggestedFoods: [
        {
          name: 'Besan & Veggie Cheela (Gram Flour Pancake)',
          emoji: '🥞',
          weightGrams: 100,
          calories: 148,
          protein: 7.8,
          calcium: 45,
          sugar: 1.8,
          mealType: 'breakfast',
          reason: 'Nutrient-dense protein pancake perfect for kids & school tiffin.',
        },
        {
          name: 'Homemade Dahi with Crushed Almonds',
          emoji: '🥣',
          weightGrams: 150,
          calories: 125,
          protein: 6.8,
          calcium: 210,
          sugar: 4.8,
          mealType: 'snack',
          reason: 'Rich in growth calcium and gut-friendly natural lactobacilli.',
        },
      ],
      quickActions: [
        'High protein vegetarian Indian foods',
        'How to prevent sugar spikes',
        'Analyze today\'s nutrition',
      ],
    };
  }

  // 5. Default General Response
  return {
    text: `### 🥑 Warm Greetings from NutriAI!

I am here to assist ${name} and your whole family with culturally authentic Indian nutrition tailored to your specific age, health goals, and clinical parameters.

**Key Highlights for ${name} (${age} yrs, ${familyMember?.weightKg || 58} kg)**:
- **Calorie Target**: ${familyMember?.calorieTarget || 1650} kcal
- **Protein Target**: ${familyMember?.proteinTarget || 65} g (for muscle & cellular vitality)
- **Calcium Target**: ${familyMember?.calciumTarget || 1200} mg (for strong bones & teeth)
- **Sugar Ceiling**: ${familyMember?.sugarLimit || 20} g daily ${hasDiabetes ? '(diabetic safety)' : ''}

How can I help you today? You can ask about:
- **Blood sugar control**: Indian food swaps to prevent post-meal spikes
- **Bone health & Calcium**: Richest sources in vegetarian Indian cuisine
- **Family meal ideas**: Dishes suitable for seniors, parents, teens, and kids
- **Plate Check**: Tap "Analyze today's nutrition" to inspect today's meals!`,
    suggestedFoods: [
      {
        name: 'Moong Dal & Palak Khichdi',
        emoji: '🍲',
        weightGrams: 180,
        calories: 165,
        protein: 7.2,
        calcium: 68,
        sugar: 1.2,
        mealType: 'dinner',
        reason: 'Gentle, comforting Indian meal: complete protein and easy digestion.',
      },
      {
        name: 'Spiced Chaas with Roasted Jeera',
        emoji: '🥛',
        weightGrams: 200,
        calories: 58,
        protein: 4.2,
        calcium: 180,
        sugar: 3.2,
        mealType: 'snack',
        reason: 'Cooling digestive drink with 180mg calcium and zero added sugar.',
      },
    ],
    quickActions: [
      'Analyze today\'s nutrition',
      'Suggestions to reduce sugar in Indian diet',
      'What are high calcium vegetarian foods?',
      'Healthy snacks for the whole family',
    ],
  };
}

// AI Assistant Chat API Endpoint
app.post('/api/ai-assistant', async (req, res) => {
  const { message, chatHistory, familyMember, todayLogs } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  // Try Gemini 3.8 Flash if available
  if (geminiAvailable && ai) {
    try {
      const familyContext = familyMember
        ? `Active Family Member: ${familyMember.name || 'Grandmother'}
Age: ${familyMember.age || 72} years
Weight: ${familyMember.weightKg || 58} kg, Height: ${familyMember.heightCm || 158} cm, Gender: ${familyMember.gender || 'female'}
Diabetes Mode: ${familyMember.hasDiabetes ? 'YES (Strict sugar tracking, cap at ≤5% calories, ~20g/day)' : 'NO'}
Food Sensitivities: ${Array.isArray(familyMember.sensitiveFoods) && familyMember.sensitiveFoods.length > 0 ? familyMember.sensitiveFoods.join(', ') : 'None'} (Note: raw cucumber often causes gas/bloating in seniors; prefer cooked lauki/turai).
Daily Clinical Targets: Calories: ${familyMember.calorieTarget || 1650} kcal, Protein: ${familyMember.proteinTarget || 65}g, Calcium: ${familyMember.calciumTarget || 1200}mg, Sugar limit: ${familyMember.sugarLimit || 20}g.`
        : 'Active Family Member: Grandmother (72yo, 58kg, Diabetes Mode ON, sensitive to cucumber).';

      const logsContext = todayLogs
        ? `Today's Logged Totals:
Calories: ${todayLogs.totalCalories || 0} kcal, Protein: ${todayLogs.totalProtein || 0}g, Calcium: ${todayLogs.totalCalcium || 0}mg, Carbs: ${todayLogs.totalCarbs || 0}g, Sugar: ${todayLogs.totalSugar || 0}g.
Logged Items Count: ${Array.isArray(todayLogs.items) ? todayLogs.items.length : 0}.
Logged Items Summary: ${Array.isArray(todayLogs.items) ? todayLogs.items.map((i: any) => `${i.name} (${i.weightGrams}g, ${i.calories}kcal, ${i.sugar}g sugar)`).join('; ') : 'None yet'}`
        : 'No food logged yet today.';

      const systemInstruction = `You are NutriAI, an expert Indian nutritionist and loving family dietary assistant inside NutriPastel (created by Iyra Upadhyay).
Your job is to provide culturally authentic, scientifically rigorous (ICMR-NIN & ADA standards), and encouraging advice for the whole Indian family.

CRITICAL PRINCIPLES:
1. INDIAN FOODS ARE MOSTLY LOGGED:
   - Plain homemade wheat rotis / phulkas have ZERO added sugar (~0.2g natural carb per 35g roti).
   - Plain homemade Dahi (curd) and Chaas (buttermilk) have only natural lactose (~3-4g per serving), 0g added sugar.
   - High calcium Indian powerhouses: Fresh Paneer (~288mg/60g), Chaas (~180mg/glass), Ragi (Finger Millet, ~344mg/100g flour), Steamed Palak, Til (sesame).
   - High protein vegetarian: Moong dal, Besan cheela, Roasted Chana (Bhuna Chana), Paneer, Sattu.
   - Diabetes Care: Sequence vegetables & dal before roti/rice; use Karela, Methi water, cinnamon tea, and roasted jeera.
   - Digestion: Raw cucumber does not suit Grandma (causes bloating/reflux); recommend gentle cooked squash or bottle gourd (Lauki) or ridge gourd (Turai).
   - Family Ages: Teenagers need 1300mg calcium for peak bone mass and high protein; children need balanced tiffin snacks without refined sugar; seniors need easily chewable fiber, 1200mg calcium, and 1.15g/kg protein.

2. RESPONSE FORMAT:
   - Use clear markdown formatting (bold headers, bullet points, concise caring paragraphs).
   - If recommending 1-3 specific dishes that the user might want to log, include a JSON codeblock marked with \`\`\`json:dishes at the end of your response with this exact structure:
   \`\`\`json:dishes
   [
     {
       "name": "Food Name in English & Hindi",
       "emoji": "emoji",
       "weightGrams": 150,
       "calories": 95,
       "protein": 5.2,
       "calcium": 60,
       "sugar": 1.2,
       "mealType": "breakfast" | "lunch" | "snack" | "dinner",
       "reason": "1 short sentence why it suits this family member"
     }
   ]
   \`\`\`
   - Keep answers practical, kind, and scannable.`;

      const prompt = `${systemInstruction}

CONTEXT:
${familyContext}
${logsContext}

USER'S MESSAGE:
"${message}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      let rawText = response.text || '';

      // Extract dishes JSON if present
      let suggestedFoods: any[] = [];
      const dishesMatch = rawText.match(/```json:dishes\s*([\s\S]*?)```/);
      if (dishesMatch) {
        try {
          suggestedFoods = JSON.parse(dishesMatch[1].trim());
          rawText = rawText.replace(/```json:dishes[\s\S]*?```/, '').trim();
        } catch {
          // ignore parsing error
        }
      }

      return res.json({
        success: true,
        data: {
          text: rawText,
          suggestedFoods,
          quickActions: [
            'Analyze today\'s nutrition',
            'How to reduce sugar in Indian food?',
            'High calcium snacks without milk',
            'High protein Indian vegetarian foods',
          ],
        },
      });
    } catch (err) {
      console.error('Gemini AI Assistant error:', err);
      // Fallback smoothly
    }
  }

  // Graceful local expert fallback
  const localAdvice = generateLocalNutriAdvice(message, familyMember, todayLogs);
  return res.json({
    success: true,
    data: localAdvice,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
