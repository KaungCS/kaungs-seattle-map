import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react"; 
import { MAP_CONFIGS, NODES, TAGS } from "./data/mapData";

const SeattleMap = () => {
  // --- State ---
  const [currentMapId, setCurrentMapId] = useState("uw");
  const [activeNode, setActiveNode] = useState(null);
  
  // Camera State: { x, y, k } where k is scale/zoom
  const [camera, setCamera] = useState({ x: -500, y: -500, k: 1 });
  const containerRef = useRef(null);

  const currentMapConfig = MAP_CONFIGS[currentMapId];
  const currentNodes = NODES.filter((n) => n.mapId === currentMapId);

  // --- Core Math: Auto-Focus Logic ---
  const focusOnNode = (node) => {
    if (!containerRef.current) return;

    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
    
    // Target position: Center horizontally, 65% down vertically
    const targetScreenX = containerW / 2;
    const targetScreenY = containerH * 0.65;
    
    // UPDATE: Use the current zoom level (camera.k) instead of forcing a zoom in
    const targetScale = camera.k; 

    // Calculate the new X/Y to place the node at the target screen position
    const newX = targetScreenX - (node.x * targetScale);
    const newY = targetScreenY - (node.y * targetScale);

    setCamera({ x: newX, y: newY, k: targetScale });
    setActiveNode(node);
  };

  // --- Interaction: Wheel Zoom (Zoom to Center) ---
  const handleWheel = (e) => {
    e.preventDefault(); 

    if (!containerRef.current) return;

    // 1. Determine direction and speed
    const scaleAdjustment = -e.deltaY * 0.001; 
    const newScale = Math.max(0.2, Math.min(camera.k + scaleAdjustment, 4));

    // 2. Calculate Zoom to Center
    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
    const centerX = containerW / 2;
    const centerY = containerH / 2;

    const oldX = (centerX - camera.x) / camera.k;
    const oldY = (centerY - camera.y) / camera.k;

    const newX = centerX - (oldX * newScale);
    const newY = centerY - (oldY * newScale);

    setCamera({ x: newX, y: newY, k: newScale });
  };

  // --- Setup Wheel Listener ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [camera]); 

  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden text-neutral-800 font-sans">
      
      {/* 1. Top Controls: Map Switcher */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <select 
          value={currentMapId}
          onChange={(e) => {
             setCurrentMapId(e.target.value);
             setCamera({ x: -500, y: -500, k: 1 }); // Reset camera on map switch
             setActiveNode(null);
          }}
          className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-neutral-200 cursor-pointer hover:bg-white transition-colors outline-none"
        >
          {Object.values(MAP_CONFIGS).map(config => (
            <option key={config.id} value={config.id}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* 2. The Map Canvas */}
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      >
        <motion.div
          className="relative origin-top-left"
          animate={{ x: camera.x, y: camera.y, scale: camera.k }}
          transition={{ type: "spring", stiffness: 150, damping: 25, mass: 0.5 }} 
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => {
             setCamera(prev => ({
               ...prev,
               x: prev.x + info.offset.x,
               y: prev.y + info.offset.y
             }));
          }}
          style={{
             width: currentMapConfig.width,
             height: currentMapConfig.height,
          }}
        >
          {/* Background Map Image */}
          <div 
             className="absolute inset-0 bg-cover bg-center rounded-lg shadow-2xl"
             style={{ 
               backgroundImage: `url(${currentMapConfig.imageSrc})`,
               backgroundColor: currentMapConfig.bgColor,
             }}
          />

          {/* Nodes */}
          {currentNodes.map((node) => (
            <button
              key={node.id}
              onClick={(e) => {
                e.stopPropagation(); 
                focusOnNode(node);
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: node.x, top: node.y }}
            >
              {/* Pin Visual */}
              <div className={`
                 w-6 h-6 rounded-full border-2 border-white shadow-md transition-transform duration-300
                 ${activeNode?.id === node.id ? "scale-125 ring-4 ring-white/50" : "group-hover:scale-110"}
              `}
              style={{ backgroundColor: TAGS[node.tags[0]]?.color || "#333" }}
              />
              
              {/* Tooltip */}
              {activeNode?.id !== node.id && (
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                   {node.title}
                 </div>
              )}
            </button>
          ))}

        </motion.div>
      </div>

      {/* 3. Detail Window */}
      <AnimatePresence>
        {activeNode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col max-h-[60vh]"
          >
            <div className="h-40 bg-neutral-200 w-full relative">
               {activeNode.images[0] && (
                  <img src={activeNode.images[0]} alt={activeNode.title} className="w-full h-full object-cover" />
               )}
               <button 
                 onClick={() => setActiveNode(null)}
                 className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
            </div>
            <div className="p-6 overflow-y-auto">
               <div className="flex items-center gap-2 mb-2">
                 {activeNode.tags.map(tagId => (
                    <span 
                      key={tagId} 
                      className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: TAGS[tagId]?.color }}
                    >
                      {TAGS[tagId]?.label}
                    </span>
                 ))}
               </div>
               <h2 className="text-2xl font-bold mb-2">{activeNode.title}</h2>
               <p className="text-neutral-600 leading-relaxed text-sm">
                 {activeNode.description}
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SeattleMap;