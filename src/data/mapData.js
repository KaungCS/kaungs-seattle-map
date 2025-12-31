// src/data/mapData.js

// 1. Tag Definitions
export const TAGS = {
  food: { label: "Food", color: "#F59E0B" }, // Amber
  study: { label: "Study", color: "#3B82F6" }, // Blue
  memory: { label: "Memory", color: "#10B981" }, // Emerald
  vibes: { label: "Vibes", color: "#A855F7" }, // Purple
};

// 2. Map Configurations (Base Resolutions)
export const MAP_CONFIGS = {
  uw: {
    id: "uw",
    label: "UW Campus",
    width: 2000,
    height: 2000,
    // Replace with your actual image path later
    imageSrc: "/maps/uw-hand-drawn.jpg", 
    bgColor: "#e5e7eb", // Fallback color
  },
  udistrict: {
    id: "udistrict",
    label: "U-District",
    width: 3000,
    height: 2000,
    imageSrc: "/maps/udistrict-hand-drawn.jpg",
    bgColor: "#d1d5db",
  },
  seattle: {
    id: "seattle",
    label: "Greater Seattle",
    width: 4000,
    height: 3000,
    imageSrc: "/maps/seattle-hand-drawn.jpg",
    bgColor: "#9ca3af",
  },
};

// 3. The Nodes (The actual pins)
export const NODES = [
  {
    id: "suzzallo",
    mapId: "uw",
    x: 842, // Relative to the 2000x2000 base
    y: 615,
    title: "Suzzallo Library",
    images: ["/placeholder/suz1.jpg"],
    description: "Late night study sessions. The Harry Potter room always smells like old paper.",
    tags: ["study", "memory"],
  },
  {
    id: "drumheller",
    mapId: "uw",
    x: 1200,
    y: 900,
    title: "Drumheller Fountain",
    images: ["/placeholder/drum1.jpg"],
    description: "Watching the ducks while eating a sandwich.",
    tags: ["vibes"],
  },
  // Add more nodes here...
];