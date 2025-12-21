import React, { useState } from 'react';
import type { GameState, AttackType } from '../engine/types';
import { CardComponent } from './Card';

interface GameBoardProps {
    gameState: GameState;
    onDraw: () => void;
    onCapture: (cardId: string, attackType: AttackType, cardIdsToPlay: string[]) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDraw, onCapture }) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = !player.isBot; // Assuming index 0 is human usually, or check ID

    const [selectedHandCards, setSelectedHandCards] = useState<string[]>([]);
    const [selectedLandscapeCard, setSelectedLandscapeCard] = useState<string | null>(null);

    const toggleHandCard = (id: string) => {
        if (selectedHandCards.includes(id)) {
            setSelectedHandCards(selectedHandCards.filter(c => c !== id));
        } else {
            setSelectedHandCards([...selectedHandCards, id]);
        }
    };

    const handleAction = (type: AttackType) => {
        if (selectedLandscapeCard && selectedHandCards.length > 0) {
            onCapture(selectedLandscapeCard, type, selectedHandCards);
            // Reset selection after attempt
            setSelectedHandCards([]);
            setSelectedLandscapeCard(null);
        }
    };

    return (
        <div style={{ padding: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

            {/* Header / Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Dragonwood Digital</h1>
                <div style={{ background: '#34495e', padding: '10px', borderRadius: '8px' }}>
                    Phase: {gameState.phase.toUpperCase()} | Turn: {player.name}
                </div>
            </div>

            {/* Landscape */}
            <section style={{ background: 'rgba(0,0,0,0.1)', padding: '20px', borderRadius: '12px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Dragonwood Landscape</h3>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {gameState.landscape.map(card => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            isSelected={selectedLandscapeCard === card.id}
                            onClick={() => setSelectedLandscapeCard(card.id)}
                        />
                    ))}
                    {gameState.dragonwoodDeck.length > 0 && (
                        <div className="card" style={{ background: '#2c3e50', border: '2px dashed #7f8c8d' }}>
                            <div>Dragonwood</div>
                            <div>Deck</div>
                            <div>({gameState.dragonwoodDeck.length})</div>
                        </div>
                    )}
                </div>
            </section>

            {/* Middle Area: Dice & Logs */}
            <section style={{ display: 'flex', gap: '20px', minHeight: '100px' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', overflowY: 'auto', maxHeight: '150px' }}>
                    <strong>Game Log:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                        {gameState.turnLog.slice(-5).reverse().map((log, i) => (
                            <div key={i} style={{ fontSize: '0.9em', opacity: 0.8 }}>{log}</div>
                        ))}
                    </div>
                </div>

                {gameState.diceRollConfig.pending === false && gameState.diceRollConfig.results.length > 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#e74c3c', borderRadius: '8px' }}>
                        <h3>Roll Result</h3>
                        <div style={{ fontSize: '2em' }}>
                            {gameState.diceRollConfig.results.join(' + ')} = {gameState.diceRollConfig.results.reduce((a, b) => a + b, 0)}
                        </div>
                    </div>
                )}
            </section>

            {/* Player Area */}
            <section style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3>Your Hand ({gameState.players[0].hand.length})</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onDraw} disabled={!isMyTurn || gameState.phase !== 'action'}>Draw Card</button>
                        <button onClick={() => handleAction('strike')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0}>Strike (Straight)</button>
                        <button onClick={() => handleAction('stomp')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0}>Stomp (Flush)</button>
                        <button onClick={() => handleAction('scream')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0}>Scream (Kind)</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px' }}>
                    {gameState.players[0].hand.map(card => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            isSelected={selectedHandCards.includes(card.id)}
                            onClick={() => toggleHandCard(card.id)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};
