export const EXAMPLES = [
  {
    key: "microwave-chicken",
    title: "Курица, сыр и помидор",
    text: "Филе, сыр, два помидора, сметана и чеснок. В рецепте только микроволновка.",
    image: "/images/chicken.jpg",
    tags: ["Микроволновка", "20 мин"],
  },
  {
    key: "fresh-salad",
    title: "Огурец, помидор и сыр",
    text: "Холодная тарелка, если на кухне нет техники для нагрева.",
    image: "/images/salad.jpg",
    tags: ["Без техники", "10 мин"],
  },
  {
    key: "quick-breakfast",
    title: "Яйца и помидор",
    text: "Короткий завтрак на электрической плите.",
    image: "/images/breakfast.jpg",
    tags: ["Плита", "10 мин"],
  },
] as const;

export type ExampleKey = (typeof EXAMPLES)[number]["key"];
