import React from 'react';
import SeattleMap from './SeattleMap';
// import { GameProvider } from './context/GameContext';
// import { DialogueOverlay } from './components/DialogueOverlay';

function App() {
  return (
  //  <GameProvider>
      <div className="relative w-full h-screen bg-black">
        {/* The Map is the "Background" */}
        <SeattleMap />
        
        {/* The Dialogue is the "Foreground" */}
        {/* <DialogueOverlay /> */}
        
        {/* Optional: Add a simple Inventory Icon/Menu here later */}
      </div>
  //  </GameProvider>
  );
}

export default App;