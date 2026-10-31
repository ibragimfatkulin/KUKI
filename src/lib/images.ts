import type { CookMethod } from "./equipment";
import type { MealType } from "./types";

export function pickImage(names: string[], meal: MealType, method: CookMethod) {
  const blob = names.join(" ").toLowerCase();
  if (meal === "breakfast" || /яйц|овсян/.test(blob)) return "/images/breakfast.jpg";
  if (method === "nocook" || /салат|огурец/.test(blob)) return "/images/salad.jpg";
  if (/рыб|лосос|тунец|кревет/.test(blob)) return "/images/fish.jpg";
  if (/макарон|паста|спагет|лапша/.test(blob)) return "/images/pasta.jpg";
  if (/суп|бульон/.test(blob)) return "/images/soup.jpg";
  if (/курин|куриц|индей|говяд|свин|мяс|фарш/.test(blob)) return "/images/chicken.jpg";
  return "/images/bowl.jpg";
}
