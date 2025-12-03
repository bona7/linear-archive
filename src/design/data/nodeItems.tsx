const nodeItems = {
  1: {
    id: 1,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "Kep1er Concert",
    date: new Date(2024, 10, 19, 14, 0),
  },
  2: {
    id: 2,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "IVE Fansign",
    date: new Date(2024, 10, 19, 18, 30),
  },
  3: {
    id: 3,
    tag: { name: "음악", color: "#F59E0B" },
    title: "Album Release",
    date: new Date(2024, 10, 19, 20, 0),
  },
  4: {
    id: 4,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "NewJeans Showcase",
    date: new Date(2024, 10, 20, 10, 0),
  },
  5: {
    id: 5,
    tag: { name: "콘서트", color: "#9370DB" },
    title: "Music Bank",
    date: new Date(2024, 10, 20, 15, 0),
  },

  // Cluster 2: Dec 5-7, 2024 (position ~38-40%) - 6 nodes
  6: {
    id: 6,
    tag: { name: "라멘", color: "#FF6B8A" },
    title: "Ichiran Ramen",
    date: new Date(2024, 11, 5, 12, 0),
  },
  7: {
    id: 7,
    tag: { name: "라멘", color: "#FF6B8A" },
    title: "Tsukemen Master",
    date: new Date(2024, 11, 5, 19, 0),
  },
  8: {
    id: 8,
    tag: { name: "자동차", color: "#3B82F6" },
    title: "Car Show Tokyo",
    date: new Date(2024, 11, 6, 10, 0),
  },
  9: {
    id: 9,
    tag: { name: "라멘", color: "#FF6B8A" },
    title: "Tonkotsu Heaven",
    date: new Date(2024, 11, 6, 13, 0),
  },
  10: {
    id: 10,
    tag: { name: "음악", color: "#F59E0B" },
    title: "Vinyl Shopping",
    date: new Date(2024, 11, 6, 16, 0),
  },
  11: {
    id: 11,
    tag: { name: "라멘", color: "#FF6B8A" },
    title: "Miso Specialty",
    date: new Date(2024, 11, 7, 12, 30),
  },

  // Cluster 3: Dec 24-25, 2024 (position ~52-53%) - 4 nodes
  12: {
    id: 12,
    tag: { name: "콘서트", color: "#9370DB" },
    title: "Christmas Concert",
    date: new Date(2024, 11, 24, 19, 0),
  },
  13: {
    id: 13,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "aespa Xmas Live",
    date: new Date(2024, 11, 24, 20, 0),
  },
  14: {
    id: 14,
    tag: { name: "음악", color: "#F59E0B" },
    title: "Carol Night",
    date: new Date(2024, 11, 25, 9, 0),
  },
  15: {
    id: 15,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "TWICE Special",
    date: new Date(2024, 11, 25, 14, 0),
  },

  // Scattered single nodes
  16: {
    id: 16,
    tag: { name: "보드", color: "#10B981" },
    title: "Chess Tournament",
    date: new Date(2024, 9, 15),
  },
  17: {
    id: 17,
    tag: { name: "자동차", color: "#3B82F6" },
    title: "F1 Grand Prix",
    date: new Date(2024, 10, 5),
  },
  18: {
    id: 18,
    tag: { name: "보드", color: "#10B981" },
    title: "Board Game Cafe",
    date: new Date(2024, 11, 15),
  },

  // Cluster 4: Jan 10-12, 2025 (position ~68-70%) - 7 nodes
  19: {
    id: 19,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "LE SSERAFIM Tour",
    date: new Date(2025, 0, 10, 18, 0),
  },
  20: {
    id: 20,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "ITZY Meet&Greet",
    date: new Date(2025, 0, 10, 20, 0),
  },
  21: {
    id: 21,
    tag: { name: "콘서트", color: "#9370DB" },
    title: "K-pop Festival",
    date: new Date(2025, 0, 11, 12, 0),
  },
  22: {
    id: 22,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "Red Velvet Concert",
    date: new Date(2025, 0, 11, 16, 0),
  },
  23: {
    id: 23,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "NMIXX Showcase",
    date: new Date(2025, 0, 11, 19, 0),
  },
  24: {
    id: 24,
    tag: { name: "음악", color: "#F59E0B" },
    title: "Album Signing",
    date: new Date(2025, 0, 12, 10, 0),
  },
  25: {
    id: 25,
    tag: { name: "가나디", color: "#FF69B4" },
    title: "IU Special Live",
    date: new Date(2025, 0, 12, 14, 0),
  },

  // Cluster 5: Feb 14, 2025 (position ~86%) - 3 nodes
  26: {
    id: 26,
    tag: { name: "라멘", color: "#FF6B8A" },
    title: "Valentine Ramen",
    date: new Date(2025, 1, 14, 12, 0),
  },
  27: {
    id: 27,
    tag: { name: "콘서트", color: "#9370DB" },
    title: "Love Concert",
    date: new Date(2025, 1, 14, 18, 0),
  },
  28: {
    id: 28,
    tag: { name: "음악", color: "#F59E0B" },
    title: "Jazz Night",
    date: new Date(2025, 1, 14, 20, 0),
  },

  // More scattered nodes
  29: {
    id: 29,
    tag: { name: "자동차", color: "#3B82F6" },
    title: "Auto Expo",
    date: new Date(2025, 2, 5),
  },
  30: {
    id: 30,
    tag: { name: "보드", color: "#10B981" },
    title: "Strategy Game Night",
    date: new Date(2025, 3, 20),
  },
};

export default nodeItems;
