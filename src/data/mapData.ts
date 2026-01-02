// src/data/mapData.ts
import uwMapImage from '../assets/uw-campus-map.png';

export type TagCategory = 'food' | 'study' | 'memory' | 'vibes';
export type MapId = 'uw' | 'udistrict' | 'seattle';

export interface TagDef {
  label: string;
  color: string;
}

export interface MapConfig {
  id: MapId;
  label: string;
  width: number;
  height: number;
  imageSrc: string;
  bgColor: string;
}

export interface NodeData {
  id: string;
  mapId: MapId;
  x: number;
  y: number;
  title: string;
  images: string[];
  description: string;
  tags: TagCategory[];
}

// --- Colors kept bright to pop against the dark theme ---
export const TAGS: Record<TagCategory, TagDef> = {
  food: { label: "Food", color: "#F59E0B" },
  study: { label: "Study", color: "#3B82F6" },
  memory: { label: "Memory", color: "#10B981" },
  vibes: { label: "Vibes", color: "#A855F7" },
};

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  uw: {
    id: "uw",
    label: "UW Campus",
    width: 2000,
    height: 2000,
    imageSrc: uwMapImage,
    bgColor: "#000000ff", // Dark Neutral 900
  },
  udistrict: {
    id: "udistrict",
    label: "U-District",
    width: 3000,
    height: 2000,
    imageSrc: "/maps/udistrict-hand-drawn.jpg",
    bgColor: "#1a1a1a", // Dark Neutral 900 variation
  },
  seattle: {
    id: "seattle",
    label: "Greater Seattle",
    width: 4000,
    height: 3000,
    imageSrc: "/maps/seattle-hand-drawn.jpg",
    bgColor: "#0a0a0a", // Nearly Black
  },
};

export const NODES: NodeData[] = [
  {
    id: "suzzallo",
    mapId: "uw",
    x: 710,
    y: 1015,
    title: "Suzzallo Library",
    images: ["/placeholder/suz1.jpg"],
    description: "Late night study sessions. The Harry Potter room always smells like old paper.",
    tags: ["study", "memory"],
  },
  {
    id: "oliver",
    mapId: "uw",
    x: 1150,
    y: 340,
    title: "Oliver Hall",
    images: ["/placeholder/oliver1.jpg"],
    description: "Stayed there my first year. Very close to the center table and district market.",
    tags: ["memory"],
  },
  {
    id: "drumheller",
    mapId: "uw",
    x: 775,
    y: 1370,
    title: "Drumheller Fountain",
    images: ["/placeholder/drum1.jpg"],
    description: "Watching the ducks while eating a sandwich.",
    tags: ["vibes"],
  },
  {
    id: "communications",
    mapId: "uw",
    x: 1080,
    y: 800,
    title: "Communications Building",
    images: ["/placeholder/communications1.jpg"],
    description: "Where the hardest CSE quiz sections are at.",
    tags: ["memory"],
  },
  {
    id: "bagley",
    mapId: "uw",
    x: 670,
    y: 1400,
    title: "Bagley Hall",
    images: ["/placeholder/bagley1.jpg"],
    description: "Had two difficult finals here, and I don't even study science!",
    tags: ["memory"],
  },
  {
    id: "allen",
    mapId: "uw",
    x: 1000,
    y: 1450,
    title: "Allen School",
    images: ["/placeholder/allen1.jpg"],
    description: "Never had a single CS class here, but too many office hours to count.",
    tags: ["memory"],
  },
  {
    id: "hseb",
    mapId: "uw",
    x: 470,
    y: 1725,
    title: "Health Sciences Education Building",
    images: ["/placeholder/hseb1.jpg"],
    description: "A very quiet place to study, usually empty, very clean and spacious.",
    tags: ["study"],
  },
  {
    id: "hub",
    mapId: "uw",
    x: 1080,
    y: 1100,
    title: "Husky Union Building",
    images: ["/placeholder/hub1.jpg"],
    description: "Quite a lot of events happen here. The food court is decent too.",
    tags: ["food"],
  },
];