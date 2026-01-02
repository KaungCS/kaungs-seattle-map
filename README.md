# Kaung's UW | An Interactive Map (Barely)

A spatial, interactive exploration of personal landmarks in Seattle, featuring a custom "flashlight" lighting engine and physics-based navigation.

[ **🔴 Live Demo** ](https://kaungs-seattle-map.vercel.app/) | [ **📂 Portfolio** ](https://portfolio-woad-eta-83.vercel.app/)

[Project Screenshot](image.png)

## 💡 About The Project

What to know what it feels like to a college student who can't navigate without Google Maps while simultaneously also bad at navigation itself?
You're at the right place!

This project is an experiment in **Human-Computer Interaction (HCI)** and immersive web design. 

Instead of a traditional list or grid view, I wanted to create an interface that mimics the feeling of exploring a dark physical space. Users must actively "search" with their cursor (or touch input) to reveal content, turning a passive browsing experience into an active discovery loop.

Originally prototyped as a visual novel engine, I pivoted the scope to focus purely on the map's interaction fidelity, ensuring a polished 60fps experience across both mobile and desktop devices.

## 🛠 Tech Stack

* **Core:** React (TypeScript)
* **Animation & Physics:** Framer Motion
* **Styling:** Tailwind CSS
* **Icons:** Lucide React

## ✨ Key Features

* **🔦 "Flashlight" Rendering Engine:** Uses CSS radial gradients and masking to create dynamic lighting that follows the user's input in real-time.
* **📱 Adaptive Input System:** * *Desktop:* Light follows the cursor.
    * *Mobile:* Light is fixed to the viewport center; users pan the map "under" the light.
* **⚡ Physics-Based Dragging:** Custom inertia and friction configuration to give the map a tactile, "heavy" feeling rather than the standard frictionless scroll.
* **🗺 Custom Coordinate Mapping:** Translates 2D image coordinates into a responsive viewport that clamps correctly at different aspect ratios.

## 🧠 Technical Highlights

### 1. The Physics Engine
To prevent the map from feeling "slippery," I overrode the default Framer Motion drag physics with high-friction values. This mimics the physical resistance of moving a heavy object.

```typescript
// Actual code snippet from the project
dragTransition={{ 
  power: 0.15,      // Low throw power (requires intent)
  timeConstant: 250 // High friction (stops quickly)
}}
```

### 2. Viewport Coordinate Constraints
A major challenge was ensuring the map never "overscrolled" past its edges, regardless of the zoom level or screen size. I implemented a clamping function that recalculates boundaries on every frame.

```typeScript

const constrainCamera = (proposed) => {
  // Calculate dynamic boundaries based on current zoom (k)
  const minX = viewport.w - (mapW * proposed.k);
  const minY = viewport.h - (mapH * proposed.k);
  
  return {
    k: proposed.k,
    // Clamp x/y between 0 and the calculated minimum
    x: Math.max(minX, Math.min(proposed.x, 0)),
    y: Math.max(minY, Math.min(proposed.y, 0)),
  };
};
```

## 🚀 Getting Started
### 1. Clone the repo

git clone https://github.com/KaungCS/kaungs-seattle-map.git

### 2. Install dependencies

npm install

### 3. Run the development server

npm start
