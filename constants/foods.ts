export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  category: string;
}

export const FOODS: Food[] = [
  { id: "1", name: "Chicken Breast (grilled)", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100g", category: "Protein" },
  { id: "2", name: "Brown Rice (cooked)", calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: "1 cup", category: "Carbs" },
  { id: "3", name: "Whole Egg", calories: 78, protein: 6, carbs: 0.6, fat: 5, servingSize: "1 large", category: "Protein" },
  { id: "4", name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: "1 medium", category: "Fruit" },
  { id: "5", name: "Greek Yogurt (plain)", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingSize: "170g", category: "Dairy" },
  { id: "6", name: "Oatmeal (cooked)", calories: 166, protein: 6, carbs: 28, fat: 3.6, servingSize: "1 cup", category: "Carbs" },
  { id: "7", name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, servingSize: "28g (1oz)", category: "Nuts" },
  { id: "8", name: "Salmon (baked)", calories: 208, protein: 28, carbs: 0, fat: 10, servingSize: "100g", category: "Protein" },
  { id: "9", name: "Broccoli (steamed)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingSize: "1 cup", category: "Vegetable" },
  { id: "10", name: "Sweet Potato (baked)", calories: 103, protein: 2.3, carbs: 24, fat: 0.1, servingSize: "1 medium", category: "Carbs" },
  { id: "11", name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: "100g", category: "Fat" },
  { id: "12", name: "Whole Milk", calories: 149, protein: 8, carbs: 12, fat: 8, servingSize: "1 cup", category: "Dairy" },
  { id: "13", name: "Cottage Cheese", calories: 206, protein: 28, carbs: 6, fat: 4.5, servingSize: "1 cup", category: "Dairy" },
  { id: "14", name: "White Rice (cooked)", calories: 242, protein: 4.4, carbs: 53, fat: 0.4, servingSize: "1 cup", category: "Carbs" },
  { id: "15", name: "Tuna (canned in water)", calories: 109, protein: 25, carbs: 0, fat: 1, servingSize: "100g", category: "Protein" },
  { id: "16", name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: "1 medium", category: "Fruit" },
  { id: "17", name: "Peanut Butter", calories: 190, protein: 8, carbs: 7, fat: 16, servingSize: "2 tbsp", category: "Fat" },
  { id: "18", name: "Protein Shake (whey)", calories: 120, protein: 25, carbs: 3, fat: 1.5, servingSize: "1 scoop", category: "Supplement" },
  { id: "19", name: "Spinach (raw)", calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, servingSize: "1 cup", category: "Vegetable" },
  { id: "20", name: "Pasta (cooked)", calories: 220, protein: 8, carbs: 43, fat: 1.3, servingSize: "1 cup", category: "Carbs" },
  { id: "21", name: "Orange", calories: 62, protein: 1.2, carbs: 15, fat: 0.2, servingSize: "1 medium", category: "Fruit" },
  { id: "22", name: "Beef (lean ground)", calories: 218, protein: 26, carbs: 0, fat: 13, servingSize: "100g", category: "Protein" },
  { id: "23", name: "Bread (whole wheat)", calories: 69, protein: 3.6, carbs: 12, fat: 0.9, servingSize: "1 slice", category: "Carbs" },
  { id: "24", name: "Cheddar Cheese", calories: 113, protein: 7, carbs: 0.4, fat: 9, servingSize: "28g (1oz)", category: "Dairy" },
  { id: "25", name: "Blueberries", calories: 84, protein: 1.1, carbs: 21, fat: 0.5, servingSize: "1 cup", category: "Fruit" },
  { id: "26", name: "Quinoa (cooked)", calories: 222, protein: 8, carbs: 39, fat: 3.6, servingSize: "1 cup", category: "Carbs" },
  { id: "27", name: "Olive Oil", calories: 119, protein: 0, carbs: 0, fat: 13.5, servingSize: "1 tbsp", category: "Fat" },
  { id: "28", name: "Turkey Breast (deli)", calories: 44, protein: 9, carbs: 1, fat: 0.5, servingSize: "56g (2oz)", category: "Protein" },
  { id: "29", name: "Strawberries", calories: 49, protein: 1, carbs: 12, fat: 0.5, servingSize: "1 cup", category: "Fruit" },
  { id: "30", name: "Black Beans (cooked)", calories: 227, protein: 15, carbs: 41, fat: 0.9, servingSize: "1 cup", category: "Protein" },
  { id: "31", name: "Skim Milk", calories: 83, protein: 8, carbs: 12, fat: 0.2, servingSize: "1 cup", category: "Dairy" },
  { id: "32", name: "Walnuts", calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, servingSize: "28g (1oz)", category: "Nuts" },
  { id: "33", name: "Egg White", calories: 17, protein: 3.6, carbs: 0.2, fat: 0, servingSize: "1 large", category: "Protein" },
  { id: "34", name: "Pizza (cheese slice)", calories: 285, protein: 12, carbs: 36, fat: 10, servingSize: "1 slice", category: "Junk" },
  { id: "35", name: "Burger (beef patty)", calories: 340, protein: 17, carbs: 27, fat: 17, servingSize: "1 burger", category: "Junk" },
  { id: "36", name: "Soda (cola)", calories: 140, protein: 0, carbs: 39, fat: 0, servingSize: "12oz can", category: "Beverage" },
  { id: "37", name: "Orange Juice", calories: 112, protein: 1.7, carbs: 26, fat: 0.5, servingSize: "1 cup", category: "Beverage" },
  { id: "38", name: "Protein Bar", calories: 210, protein: 20, carbs: 22, fat: 7, servingSize: "1 bar", category: "Supplement" },
  { id: "39", name: "Corn (cooked)", calories: 132, protein: 4.9, carbs: 29, fat: 1.8, servingSize: "1 cup", category: "Vegetable" },
  { id: "40", name: "Cereal (granola)", calories: 300, protein: 9, carbs: 54, fat: 6, servingSize: "1 cup", category: "Carbs" },
];

export const FOOD_CATEGORIES = [
  "All", "Protein", "Carbs", "Fat", "Dairy", "Fruit", "Vegetable", "Nuts", "Supplement", "Beverage", "Junk"
];
