import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Plus, Minus } from "lucide-react";
import { MAP_CONFIGS, NODES, TAGS, MapId, NodeData } from "./data/mapData";

// --- Make sure to import your images or replace these paths with the actual location ---
// import flashOnImg from "./assets/flash-on.png";
// import flashOffImg from "./assets/flash-off.png";
import flashOnImg from "./assets/flash-on.png"; // Placeholder path
import flashOffImg from "./assets/flash-off.png"; // Placeholder path
import startButtonImg from "./assets/start-exploring-button.png"; // Placeholder path

interface CameraState {
  x: number;
  y: number;
  k: number;
}

const SeattleMap: React.FC = () => {
  const [currentMapId, setCurrentMapId] = useState<MapId>("uw");
  const [activeNode, setActiveNode] = useState<NodeData | null>(null);
  
  // --- INTRO STATE ---
  const [showIntro, setShowIntro] = useState(true);
  const [isLit, setIsLit] = useState(false); // Controls the specific image (on/off)

  // Cursor & Mobile State
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);

  // Camera State
  const [camera, setCamera] = useState<CameraState>({ x: -100, y: -100, k: 1.5 });
  const cameraRef = useRef<CameraState>({ x: -100, y: -100, k: 1.5 });

  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const hasSpawnedRef = useRef(false); // To track if initial spawn has occurred
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMapConfig = MAP_CONFIGS[currentMapId];
  const currentNodes = NODES.filter((n) => n.mapId === currentMapId);

  // Sync Ref with State whenever State updates
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // --- 1. SETUP & RESIZE LISTENER ---
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setViewport({ w: width, h: height });
        setIsMobile(width < 768); 
      }
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // --- 2. CAMERA LOGIC ---
  const constrainCamera = useCallback((proposed: CameraState) => {
    if (viewport.w === 0) return proposed;

    const mapW = currentMapConfig.width;
    const mapH = currentMapConfig.height;

    // Minimum Zoom: Map must ALWAYS cover the screen
    const minScale = Math.max(viewport.w / mapW, viewport.h / mapH);
    const newK = Math.max(proposed.k, minScale);

    // Pan Clamping
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
    const proposedX = (viewport.w / 2) - (node.x * targetScale);
    const proposedY = (viewport.h / 2) - (node.y * targetScale);
    setCamera(constrainCamera({ x: proposedX, y: proposedY, k: targetScale }));
    setActiveNode(node);
  };

  /* --- ZOOM HANDLER (Mouse Wheel) --- does not work well on some touchpads
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault(); 
    if (viewport.w === 0) return;

    // 1. Calculate the new scale (Simple addition, as you preferred)
    const scaleFactor = -e.deltaY * 0.0005; 
    const currentK = cameraRef.current.k;
    const proposedScale = currentK + scaleFactor;

    // 2. Get the anchor point (The mouse cursor)
    // We use the event's clientX/Y directly so it's always accurate
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const currentX = cameraRef.current.x;
    const currentY = cameraRef.current.y;

    // 3. The "Zoom to Point" Math
    // First, find which pixel on the map is currently under the mouse
    const mapPointUnderMouseX = (mouseX - currentX) / currentK;
    const mapPointUnderMouseY = (mouseY - currentY) / currentK;

    // Then, calculate where the map needs to move so that SAME pixel 
    // is still under the mouse at the new scale.
    const proposedX = mouseX - (mapPointUnderMouseX * proposedScale);
    const proposedY = mouseY - (mapPointUnderMouseY * proposedScale);

    setCamera(constrainCamera({ x: proposedX, y: proposedY, k: proposedScale }));
  };
  */

  // --- NEW: INITIAL SPAWN LOGIC ---
  useEffect(() => {
    // 1. Check if we have a valid viewport and haven't spawned yet
    if (viewport.w > 0 && viewport.h > 0 && !hasSpawnedRef.current) {
      
      const spawnX = 775;   // Drumheller Fountain X
      const spawnY = 1370;  // Drumheller Fountain Y
      const spawnScale = isMobile? 1.4 : 2.3; // Your default zoom level

      // Calculate camera position to center the spawn point
      const centerX = (viewport.w / 2) - (spawnX * spawnScale);
      const centerY = (viewport.h / 2) - (spawnY * spawnScale);

      // Apply the position (running it through constraint to ensure it's safe)
      setCamera(constrainCamera({ x: centerX, y: centerY, k: spawnScale }));
      
      // Mark as spawned so we don't reset it again
      hasSpawnedRef.current = true;
    }
  }, [viewport, constrainCamera]);
  
  useEffect(() => {
    setCamera(prev => constrainCamera(prev));
  }, [currentMapConfig, viewport, constrainCamera]);

  /* --- WHEEL EVENT LISTENER ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [camera, constrainCamera]);
  */

  // --- MANUAL ZOOM BUTTON HANDLER ---
  const handleManualZoom = (direction: "in" | "out") => {
    if (viewport.w === 0) return;

    // --- FIX: Use cameraRef to get the REAL-TIME position ---
    // The 'camera' state variable might be stale if you just finished dragging
    const currentX = cameraRef.current.x;
    const currentY = cameraRef.current.y;
    const currentK = cameraRef.current.k;

    // 1. Determine new scale
    const ZOOM_STEP = 0.5; // Adjust as you like (0.1 is fine too)
    const newK = direction === "in" 
      ? currentK + ZOOM_STEP 
      : currentK - ZOOM_STEP;

    // 2. We want to zoom towards the CENTER of the viewport
    const centerX = viewport.w / 2;
    const centerY = viewport.h / 2;

    // 3. Calculate the point on the map currently under the center
    // We use currentX/Y (from the Ref) here so it doesn't snap back
    const mapPointUnderCenterX = (centerX - currentX) / currentK;
    const mapPointUnderCenterY = (centerY - currentY) / currentK;

    // 4. Calculate new camera position to keep that point centered
    const proposedX = centerX - (mapPointUnderCenterX * newK);
    const proposedY = centerY - (mapPointUnderCenterY * newK);

    setCamera(constrainCamera({ x: proposedX, y: proposedY, k: newK }));
  };

  // --- 3. INTRO ANIMATION SEQUENCE ---
  const triggerIntroSequence = async () => {
    // Helper to wait ms
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Flicker Sequence
    setIsLit(true);
    await wait(200);
    setIsLit(false);
    await wait(300);

    // Stable On
    setIsLit(true);
    
    // Hold the "On" state for a moment so user sees the face clearly
    await wait(1000);
    
    // Fade out the whole intro window
    setShowIntro(false);
  };

  const dragConstraints = {
    left: viewport.w - (currentMapConfig.width * camera.k),
    right: 0,
    top: viewport.h - (currentMapConfig.height * camera.k),
    bottom: 0,
  };

  // Helper for flashlight visibility
  const isNodeVisible = (node: NodeData) => {
    if (activeNode?.id === node.id) return false; 
    const nodeScreenX = node.x * camera.k + camera.x;
    const nodeScreenY = node.y * camera.k + camera.y;

    if (isMobile) {
      const dist = Math.hypot((viewport.w / 2) - nodeScreenX, (viewport.h / 2) - nodeScreenY);
      return dist < 150; 
    } else {
      const dist = Math.hypot(cursor.x - nodeScreenX, cursor.y - nodeScreenY);
      return dist < 300;
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden text-neutral-200 font-sans cursor-none select-none touch-none"
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
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

      {/* --- ZOOM CONTROLS --- */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
        <button
          onClick={() => handleManualZoom("in")}
          className="bg-neutral-900 text-white p-3 rounded-xl shadow-2xl border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-600 active:scale-95 transition-all cursor-pointer"
          aria-label="Zoom In"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={() => handleManualZoom("out")}
          className="bg-neutral-900 text-white p-3 rounded-xl shadow-2xl border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-600 active:scale-95 transition-all cursor-pointer"
          aria-label="Zoom Out"
        >
          <Minus size={20} />
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full">
        <motion.div
          className="relative origin-top-left"
          animate={{ x: camera.x, y: camera.y, scale: camera.k }}
          transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.5 }} 
          
          drag
          dragConstraints={dragConstraints}
          dragElastic={0.1} 
          dragMomentum={true}
          dragTransition={{ power: 0.15, timeConstant: 250 }} 

          onUpdate={(latest) => {
            if (typeof latest.x === 'number' && typeof latest.y === 'number') {
              cameraRef.current = { ...cameraRef.current, x: latest.x, y: latest.y };
            }
          }}

          onAnimationComplete={() => {
             setCamera({ ...camera, x: cameraRef.current.x, y: cameraRef.current.y });
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
              onClick={(e) => { e.stopPropagation(); focusOnNode(node); }}
              onTouchEnd={(e) => { e.stopPropagation(); focusOnNode(node); }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-none outline-none"
              style={{ left: node.x, top: node.y }}
            >
              <div className={`w-6 h-6 rounded-full border-2 border-black/50 shadow-lg transition-transform duration-300 ${activeNode?.id === node.id ? "scale-125 ring-4 ring-white/20" : "group-hover:scale-110"}`}
                   style={{ backgroundColor: TAGS[node.tags[0]]?.color || "#555" }} />
              
              {isNodeVisible(node) && (
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
          background: `radial-gradient(circle ${isMobile ? "200px" : "250px"} at ${isMobile ? "50% 50%" : `${cursor.x}px ${cursor.y}px`}, transparent 0%, rgba(0,0,0,0.98) 100%)`
        }}
      />
      
      {/* Noise Grain */}
      <div className="absolute inset-0 pointer-events-none z-30 opacity-20 mix-blend-overlay"
           style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} 
      />

      {/* --- CUSTOM CURSOR (Hidden on Mobile) --- */}
      <div 
        className="fixed pointer-events-none z-[60] bg-white rounded-full mix-blend-difference shadow-[0_0_10px_rgba(255,255,255,0.5)] hidden sm:block"
        style={{
          left: cursor.x,
          top: cursor.y,
          width: '12px',
          height: '12px',
          transform: `translate(-50%, -50%) scale(${isPressed ? 1.5 : 1})`,
          transition: "transform 0.15s ease-out"
        }}
      />

      {/* --- INTRO MODAL --- */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black cursor-auto"
          >
            {/* Image Container */}
            <div className="relative w-full max-w-md p-6 flex flex-col items-center">
              
              <div className="relative">
                {/* The Character Image */}
                <img 
                  src={isLit ? flashOnImg : flashOffImg} 
                  alt="Intro Character" 
                  className="w-full max-h-[60vh] object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-opacity duration-100"
                />
                
                {/* The 'Start' Button positioned 'on' the flashlight (bottom center of image) */}
                <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-full flex justify-center">
                   <button
                    onClick={triggerIntroSequence}
                    className="group transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                   >
                    <img 
                      src={startButtonImg} 
                      alt="Start Exploring" 
                      // Invert color on hover for a cool effect, or just rely on the scale animation
                      className="h-10 sm:h-11 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                   </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Window */}
      <AnimatePresence>
        {activeNode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-auto"
            onClick={() => setActiveNode(null)}
          >
            <motion.div 
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} 
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="h-40 sm:h-48 bg-neutral-800 w-full relative shrink-0">
                 {activeNode.images[0] ? (
                    <img src={activeNode.images[0]} alt={activeNode.title} className="w-full h-full object-cover opacity-90" />
                 ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600"><span className="text-sm">No Image</span></div>
                 )}
                 <button 
                  onClick={() => setActiveNode(null)} 
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                 >
                   <X size={18} />
                 </button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeattleMap;