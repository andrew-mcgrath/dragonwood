import { useState, useEffect } from 'react';
import { GameEngine } from './engine/GameEngine';
import { GameBoard } from './components/GameBoard';
import { SplashScreen } from './components/SplashScreen';
import './index.css';

// Singleton instance for simplicity in this MVP
let gameEngine: GameEngine;
try {
  console.log("Initializing GameEngine...");
  gameEngine = new GameEngine();
  console.log("GameEngine Initialized", gameEngine);
} catch (e) {
  console.error("Failed to initialize GameEngine", e);
  // @ts-ignore
  gameEngine = { getState: () => ({ players: [], phase: 'error', turnLog: [String(e)] }) } as any;
}

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  // Force update trigger
  const [_, setTick] = useState(0);

  // Create a refresh function to sync state
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    // Subscribe to engine updates
    const unsubscribe = gameEngine.subscribe(refresh);
    return () => unsubscribe();
  }, []);

  const handleStartGame = (playerName: string, botName: string) => {
    gameEngine.setPlayerName('p1', playerName);
    gameEngine.setPlayerName('p2', botName);
    setGameStarted(true);
    refresh();
  };

  const handleDraw = () => {
    gameEngine.drawCard();
    refresh();
  };

  const handleCapture = (cardId: string, attackType: any, cardIdsToPlay: string[]) => {
    try {
      gameEngine.declareCapture(cardId, attackType, cardIdsToPlay);
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePenaltyDiscard = (cardId: string) => {
    try {
      gameEngine.resolvePenaltyDiscard(cardId);
      refresh(); // Refresh after state change
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRenamePlayer = (playerId: string, newName: string) => {
    gameEngine.setPlayerName(playerId, newName);
    refresh();
  };

  if (gameEngine instanceof Error || (gameEngine as any).phase === 'error') {
    return <div style={{ color: 'red', padding: 20 }}>
      <h1>Fatal Error</h1>
      <pre>{JSON.stringify((gameEngine as any).turnLog || gameEngine, null, 2)}</pre>
    </div>;
  }

  if (!gameStarted) {
    return <SplashScreen onStartGame={handleStartGame} />;
  }

  return (
    <div className="App">
      <GameBoard
        gameState={gameEngine.getState()}
        onDraw={handleDraw}
        onCapture={handleCapture}
        onPenaltyDiscard={handlePenaltyDiscard}
        onRenamePlayer={handleRenamePlayer}
      />
    </div>
  );
}

export default App;
