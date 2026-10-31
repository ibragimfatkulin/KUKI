export type ProductInfo = {
  name: string;
  keys: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  gramsPerPiece?: number;
};

export const PRODUCTS: ProductInfo[] = [
  { name: "Куриное филе", keys: ["куриное филе", "курин"], calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  { name: "Курица", keys: ["курица", "куриц"], calories: 190, protein: 27, fat: 8, carbs: 0 },
  { name: "Индейка", keys: ["индей"], calories: 135, protein: 29, fat: 2, carbs: 0 },
  { name: "Говядина", keys: ["говяд"], calories: 187, protein: 19, fat: 12, carbs: 0 },
  { name: "Свинина", keys: ["свин"], calories: 242, protein: 16, fat: 20, carbs: 0 },
  { name: "Фарш", keys: ["фарш"], calories: 250, protein: 17, fat: 20, carbs: 0 },
  { name: "Лосось", keys: ["лосос"], calories: 208, protein: 20, fat: 13, carbs: 0 },
  { name: "Тунец", keys: ["тунец"], calories: 130, protein: 29, fat: 1, carbs: 0 },
  { name: "Креветки", keys: ["кревет"], calories: 99, protein: 24, fat: 0.3, carbs: 0.2 },
  { name: "Яйцо", keys: ["яйц"], calories: 155, protein: 13, fat: 11, carbs: 1.1, gramsPerPiece: 55 },
  { name: "Тофу", keys: ["тофу"], calories: 76, protein: 8, fat: 4.8, carbs: 1.9 },
  { name: "Нут", keys: ["нут"], calories: 164, protein: 8.9, fat: 2.6, carbs: 27 },
  { name: "Фасоль", keys: ["фасол"], calories: 127, protein: 8.7, fat: 0.5, carbs: 22 },
  { name: "Сыр", keys: ["сыр"], calories: 356, protein: 25, fat: 27, carbs: 2 },
  { name: "Творог", keys: ["творог"], calories: 121, protein: 17, fat: 5, carbs: 2 },
  { name: "Сметана", keys: ["сметан"], calories: 206, protein: 2.8, fat: 20, carbs: 3.2 },
  { name: "Йогурт", keys: ["йогурт"], calories: 66, protein: 5, fat: 3.2, carbs: 4.7 },
  { name: "Молоко", keys: ["молок"], calories: 60, protein: 3.2, fat: 3.2, carbs: 4.8 },
  { name: "Сливки", keys: ["сливк"], calories: 340, protein: 2, fat: 35, carbs: 3 },
  { name: "Помидор", keys: ["помидор", "томат"], calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, gramsPerPiece: 120 },
  { name: "Огурец", keys: ["огурец"], calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, gramsPerPiece: 150 },
  { name: "Перец", keys: ["перец"], calories: 27, protein: 1, fat: 0.3, carbs: 6, gramsPerPiece: 150 },
  { name: "Лук", keys: ["лук"], calories: 40, protein: 1.1, fat: 0.1, carbs: 9, gramsPerPiece: 80 },
  { name: "Чеснок", keys: ["чеснок"], calories: 149, protein: 6.4, fat: 0.5, carbs: 33, gramsPerPiece: 5 },
  { name: "Морковь", keys: ["морков"], calories: 41, protein: 0.9, fat: 0.2, carbs: 10, gramsPerPiece: 80 },
  { name: "Картофель", keys: ["картоф"], calories: 77, protein: 2, fat: 0.1, carbs: 17, gramsPerPiece: 100 },
  { name: "Капуста", keys: ["капуст"], calories: 25, protein: 1.3, fat: 0.1, carbs: 6 },
  { name: "Брокколи", keys: ["броккол"], calories: 34, protein: 2.8, fat: 0.4, carbs: 7 },
  { name: "Грибы", keys: ["гриб"], calories: 22, protein: 3.1, fat: 0.3, carbs: 3.3 },
  { name: "Рис", keys: ["рис"], calories: 340, protein: 7, fat: 1, carbs: 75 },
  { name: "Гречка", keys: ["греч"], calories: 343, protein: 13, fat: 3.4, carbs: 72 },
  { name: "Макароны", keys: ["макарон", "паста", "спагет", "лапша"], calories: 350, protein: 12, fat: 1.5, carbs: 72 },
  { name: "Овсянка", keys: ["овсян"], calories: 379, protein: 13, fat: 6.5, carbs: 68 },
  { name: "Хлеб", keys: ["хлеб", "лаваш", "булк"], calories: 265, protein: 9, fat: 3.2, carbs: 49, gramsPerPiece: 30 },
  { name: "Масло сливочное", keys: ["сливочное масло", "масло сливочное"], calories: 717, protein: 0.9, fat: 81, carbs: 0.1 },
  { name: "Масло", keys: ["масло"], calories: 884, protein: 0, fat: 100, carbs: 0 },
  { name: "Майонез", keys: ["майонез"], calories: 680, protein: 1, fat: 75, carbs: 2.6 },
  { name: "Банан", keys: ["банан"], calories: 89, protein: 1.1, fat: 0.3, carbs: 23, gramsPerPiece: 120 },
  { name: "Яблоко", keys: ["яблок"], calories: 52, protein: 0.3, fat: 0.2, carbs: 14, gramsPerPiece: 150 },
  { name: "Авокадо", keys: ["авокадо"], calories: 160, protein: 2, fat: 15, carbs: 9, gramsPerPiece: 170 },
];

const DEFAULT_PRODUCT: ProductInfo = {
  name: "Продукт",
  keys: [],
  calories: 110,
  protein: 5,
  fat: 4,
  carbs: 10,
};

export function findProduct(name: string) {
  const normalized = name.toLowerCase();
  let best: ProductInfo | undefined;
  let bestLength = 0;
  for (const product of PRODUCTS) {
    for (const key of product.keys) {
      if (normalized.includes(key) && key.length > bestLength) {
        best = product;
        bestLength = key.length;
      }
    }
  }
  return best ?? DEFAULT_PRODUCT;
}

export const SUGGESTIONS = [
  "Курица",
  "Куриное филе",
  "Индейка",
  "Говядина",
  "Свинина",
  "Фарш",
  "Лосось",
  "Тунец",
  "Креветки",
  "Яйцо",
  "Тофу",
  "Нут",
  "Фасоль",
  "Сыр",
  "Творог",
  "Сметана",
  "Йогурт",
  "Молоко",
  "Сливки",
  "Помидор",
  "Огурец",
  "Перец болгарский",
  "Лук",
  "Чеснок",
  "Морковь",
  "Картофель",
  "Капуста",
  "Брокколи",
  "Шпинат",
  "Грибы",
  "Кукуруза",
  "Рис",
  "Гречка",
  "Макароны",
  "Овсянка",
  "Хлеб",
  "Лаваш",
  "Масло растительное",
  "Масло сливочное",
  "Майонез",
  "Зелень",
  "Укроп",
  "Банан",
  "Яблоко",
  "Авокадо",
  "Лимон",
];

export const QUICK_ADD = ["Курица", "Яйцо", "Сыр", "Помидор", "Огурец", "Рис", "Картофель", "Макароны"];

export function suggestProducts(query: string, limit = 6) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 1 || normalized.includes(",")) return [];
  return SUGGESTIONS.filter((name) => name.toLowerCase().includes(normalized))
    .sort((a, b) => {
      const aScore = a.toLowerCase().startsWith(normalized) ? 0 : 1;
      const bScore = b.toLowerCase().startsWith(normalized) ? 0 : 1;
      return aScore - bScore || a.localeCompare(b, "ru");
    })
    .slice(0, limit);
}
