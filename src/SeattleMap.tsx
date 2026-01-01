import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react"; 
import { MAP_CONFIGS, NODES, TAGS, MapId, NodeData } from "./data/mapData";

interface CameraState {
  x: number;
  y: number;
  k: number;
}

const SeattleMap: React.FC = () => {
  const [currentMapId, setCurrentMapId] = useState<MapId>("uw");
  const [activeNode, setActiveNode] = useState<NodeData | null>(null);
  
  // Cursor & Input State
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false); 
  const [isMobile, setIsMobile] = useState(false); // 🟢 Track device type

  const [camera, setCamera] = useState<CameraState>({ x: -100, y: -100, k: 1.5 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const currentMapConfig = MAP_CONFIGS[currentMapId];
  const currentNodes = NODES.filter((n) => n.mapId === currentMapId);

  // --- 1. SETUP & LISTENERS ---
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setViewport({ w: width, h: height });
      }
    };
    
    // Check for mobile/touch
    const checkMobile = () => {
       setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    };

    updateViewport();
    checkMobile();
    
    window.addEventListener("resize", updateViewport);
    window.addEventListener("resize", checkMobile);
    return () => {
       window.removeEventListener("resize", updateViewport);
       window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // --- 2. CAMERA LOGIC ---
  const constrainCamera = useCallback((proposed: CameraState) => {
    if (viewport.w === 0) return proposed;

    const mapW = currentMapConfig.width;
    const mapH = currentMapConfig.height;

    const minScale = Math.max(viewport.w / mapW, viewport.h / mapH);
    const newK = Math.max(proposed.k, minScale);

    const minX = viewport.w - (mapW * newK);
    const minY = viewport.h - (mapH * newK);

    return {
      k: newK,
      x: Math.max(minX, Math.min(proposed.x, 0)),
      y: Math.max(minY, Math.min(proposed.y, 0)),
    };
  }, [currentMapConfig, viewport]);

  const focusOnNode = (node: NodeData) => {
    if (viewport.w === 0) return;
    const targetScale = camera.k; 
    // Center logic slightly offset for modal
    const proposedX = (viewport.w / 2) - (node.x * targetScale);
    const proposedY = (viewport.h / 2) - (node.y * targetScale);
    setCamera(constrainCamera({ x: proposedX, y: proposedY, k: targetScale }));
    setActiveNode(node);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault(); 
    if (viewport.w === 0) return;

    const scaleFactor = -e.deltaY * 0.001; 
    const proposedScale = camera.k + scaleFactor;
    
    const centerX = viewport.w / 2;
    const centerY = viewport.h / 2;
    const oldWorldX = (centerX - camera.x) / camera.k;
    const oldWorldY = (centerY - camera.y) / camera.k;
    const proposedX = centerX - (oldWorldX * proposedScale);
    const proposedY = centerY - (oldWorldY * proposedScale);

    setCamera(constrainCamera({ x: proposedX, y: proposedY, k: proposedScale }));
  };

  useEffect(() => {
    setCamera(prev => constrainCamera(prev));
  }, [currentMapConfig, viewport, constrainCamera]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [camera, constrainCamera]);

  const dragConstraints = {
    left: viewport.w - (currentMapConfig.width * camera.k),
    right: 0,
    top: viewport.h - (currentMapConfig.height * camera.k),
    bottom: 0,
  };

  // --- 3. DYNAMIC LIGHT COORDINATES ---
  // If Mobile: Lock to Center (viewport/2). If Desktop: Follow Cursor.
  const lightX = isMobile ? viewport.w / 2 : cursor.x;
  const lightY = isMobile ? viewport.h / 2 : cursor.y;

  // --- 4. MINIMAP LOGIC ---
  const getMinimapRect = () => {
    if (viewport.w === 0) return { left: 0, top: 0, width: 0, height: 0 };
    const totalW = currentMapConfig.width * camera.k;
    const totalH = currentMapConfig.height * camera.k;
    return {
      left: `${(-camera.x / totalW) * 100}%`,
      top: `${(-camera.y / totalH) * 100}%`,
      width: `${(viewport.w / totalW) * 100}%`,
      height: `${(viewport.h / totalH) * 100}%`
    };
  };
  const miniRect = getMinimapRect();

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden text-neutral-200 font-sans cursor-none select-none"
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      // For mobile: verify touches
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      
      {/* Map Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <div className="relative group">
          <select 
            value={currentMapId}
            onChange={(e) => { setCurrentMapId(e.target.value as MapId); setActiveNode(null); }}
            className="appearance-none bg-neutral-900 text-white px-5 py-3 pr-10 rounded-xl shadow-2xl border border-neutral-800 cursor-none hover:border-neutral-600 transition-colors outline-none font-medium"
          >
            {Object.values(MAP_CONFIGS).map(config => (
              <option key={config.id} value={config.id}>{config.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={18} />
        </div>
      </div>

      {/* Main Map Canvas */}
      <div ref={containerRef} className="w-full h-full">
        <motion.div
          className="relative origin-top-left"
          animate={{ x: camera.x, y: camera.y, scale: camera.k }}
          transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.5 }} 
          drag
          dragConstraints={dragConstraints} 
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={(_, info) => {
             const proposedX = camera.x + info.offset.x;
             const proposedY = camera.y + info.offset.y;
             setCamera(constrainCamera({ ...camera, x: proposedX, y: proposedY }));
          }}
          style={{ width: currentMapConfig.width, height: currentMapConfig.height }}
        >
          <div 
             className="absolute inset-0 bg-cover bg-center rounded-lg"
             style={{ backgroundImage: `url(${currentMapConfig.imageSrc})`, backgroundColor: currentMapConfig.bgColor }}
          />
          {currentNodes.map((node) => (
            <button
              key={node.id}
              // Prevent click propagation to dragging
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={(e) => { e.stopPropagation(); focusOnNode(node); }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-none"
              style={{ left: node.x, top: node.y }}
            >
              <div className={`w-6 h-6 rounded-full border-2 border-black/50 shadow-lg transition-transform duration-300 ${activeNode?.id === node.id ? "scale-125 ring-4 ring-white/20" : "group-hover:scale-110"}`}
                   style={{ backgroundColor: TAGS[node.tags[0]]?.color || "#555" }} />
              
              {/* 🟢 VISIBILITY LOGIC: Uses 'lightX/Y' instead of 'cursor' */}
              {activeNode?.id !== node.id && (Math.hypot(lightX - (node.x * camera.k + camera.x), lightY - (node.y * camera.k + camera.y)) < 150) && (
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-lg transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                   {node.title}
                 </div>
              )}
            </button>
          ))}
        </motion.div>
      </div>

      {/* --- FLASHLIGHT EFFECT --- */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          // 🟢 Uses 'lightX/Y' so it stays centered on mobile
          background: `radial-gradient(circle 250px at ${lightX}px ${lightY}px, transparent 0%, rgba(0,0,0,0.98) 100%)`
        }}
      />
      
      {/* Noise Grain */}
      <div className="absolute inset-0 pointer-events-none z-30 opacity-20 mix-blend-overlay"
           style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} 
      />

      {/* --- CUSTOM CURSOR (Hidden on Mobile) --- */}
      {!isMobile && (
        <div 
          className="fixed pointer-events-none z-[60] bg-white rounded-full mix-blend-difference shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{
            left: cursor.x,
            top: cursor.y,
            width: '12px',
            height: '12px',
            transform: `translate(-50%, -50%) scale(${isPressed ? 1.5 : 1})`,
            transition: "transform 0.15s ease-out"
          }}
        />
      )}

      {/* Minimap (Hidden on Mobile) */}
      <div 
        className="absolute bottom-6 right-6 w-48 bg-neutral-900 border-2 border-neutral-700 rounded-lg overflow-hidden shadow-2xl z-40 hidden md:block"
        style={{ aspectRatio: `${currentMapConfig.width} / ${currentMapConfig.height}` }}
      >
         <img src={currentMapConfig.imageSrc} className="w-full h-full object-cover opacity-50" alt="Minimap" />
         <div 
            className="absolute border-2 border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
            style={{
              left: miniRect.left, top: miniRect.top,
              width: miniRect.width, height: miniRect.height,
              transition: "all 0.1s linear" 
            }}
         />
      </div>

      {/* 🟢 DETAIL WINDOW: CENTERED POPUP --- */}
      <AnimatePresence>
        {activeNode && (
          // Fixed container covering entire screen
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Backdrop (Darken background) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveNode(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] cursor-auto"
            >
              <div className="h-48 bg-neutral-800 w-full relative shrink-0">
                 {activeNode.images[0] ? (
                    <img src={activeNode.images[0]} alt={activeNode.title} className="w-full h-full object-cover opacity-90" />
                 ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600"><span className="text-sm">No Image</span></div>
                 )}
                 <button onClick={() => setActiveNode(null)} className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm cursor-pointer"><X size={18} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 <div className="flex items-center gap-2 mb-3">
                   {activeNode.tags.map(tagId => (
                      <span key={tagId} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded text-black" style={{ backgroundColor: TAGS[tagId]?.color }}>{TAGS[tagId]?.label}</span>
                   ))}
                 </div>
                 <h2 className="text-2xl font-bold mb-2 text-white">{activeNode.title}</h2>
                 <p className="text-neutral-400 leading-relaxed text-sm">{activeNode.description}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeattleMap;