import React, { useState } from 'react';
import type { GameState, AttackType } from '../engine/types';
import { CardComponent } from './Card';

interface GameBoardProps {
    gameState: GameState;
    onDraw: () => void;
    onCapture: (cardId: string, attackType: AttackType, cardIdsToPlay: string[]) => void;
    onPenaltyDiscard: (cardId: string) => void;
    onRenamePlayer: (playerId: string, newName: string) => void;
}

const DiceFace: React.FC<{ value: number }> = ({ value }) => {
    // Basic CSS dice face
    // Dragonwood Dice: 1, 2, 2, 3, 3, 4. Result is pre-calculated engine-side as 1-4.
    // We just render pips for the value.
    const dotMap: Record<number, number[]> = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8] // Standard 6 just in case
    };

    return (
        <div style={{
            width: '40px', height: '40px', background: 'white', borderRadius: '8px',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.3)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)', padding: '4px', boxSizing: 'border-box', border: '1px solid #bdc3c7'
        }}>
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                    background: dotMap[value]?.includes(i) ? '#e74c3c' : 'transparent',
                    borderRadius: '50%',
                    margin: '1px'
                }} />
            ))}
        </div>
    );
};

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDraw, onCapture, onPenaltyDiscard, onRenamePlayer }) => {
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

    const handleDiscard = () => {
        if (selectedHandCards.length === 1) {
            onPenaltyDiscard(selectedHandCards[0]);
            setSelectedHandCards([]);
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

    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [tempName, setTempName] = useState("");

    const startEditing = (p: typeof gameState.players[0]) => {
        if (!p.isBot) {
            setEditingPlayerId(p.id);
            setTempName(p.name);
        }
    };

    const saveName = () => {
        if (editingPlayerId && tempName.trim()) {
            onRenamePlayer(editingPlayerId, tempName.trim());
        }
        setEditingPlayerId(null);
    };

    return (
        <div style={{ padding: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

            {/* Scoreboard / Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#2c3e50', color: 'white', padding: '15px', borderRadius: '12px' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '1.5em' }}>🐉🌲 Dragonwood</h1>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#f39c12' }}>
                        Current Turn: {player.name}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '40px' }}>
                    {gameState.players.map(p => {
                        const score = p.capturedCards.reduce((acc, c) => acc + ('victoryPoints' in c ? (c as any).victoryPoints : 0), 0);

                        // Calculate bonuses for display (duplicated logic for UI safely)
                        const bonuses = { strike: 0, stomp: 0, scream: 0 };
                        let hasHoneyPot = false;
                        p.capturedCards.forEach(c => {
                            if (c.type === 'enhancement') {
                                if (c.name === 'Silver Sword') bonuses.strike += 2;
                                if (c.name === 'Magical Boots') bonuses.stomp += 2;
                                if (c.name === 'Cloak of Darkness') bonuses.scream += 2;
                                if (c.name === 'Honey Pot') hasHoneyPot = true;
                            }
                        });

                        return (
                            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                {editingPlayerId === p.id ? (
                                    <input
                                        autoFocus
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        onBlur={saveName}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveName();
                                            if (e.key === 'Escape') setEditingPlayerId(null);
                                        }}
                                        style={{ fontSize: '1em', padding: '2px', fontWeight: 'bold', width: '120px', textAlign: 'right' }}
                                    />
                                ) : (
                                    <div
                                        style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '5px', cursor: !p.isBot ? 'pointer' : 'default', textDecoration: !p.isBot ? 'underline' : 'none', color: '#ecf0f1' }}
                                        onClick={() => startEditing(p)}
                                        title={!p.isBot ? "Click to rename" : ""}
                                    >
                                        {p.name} {p.isBot ? '🤖' : '👤'}
                                    </div>
                                )}
                                <div style={{ fontSize: '1.2em', color: '#f1c40f' }}>🏆 {score} VP</div>
                                <div style={{ fontSize: '0.8em', display: 'flex', gap: '5px' }}>
                                    {bonuses.strike > 0 && <span title="Strike Bonus">⚔️+{bonuses.strike}</span>}
                                    {bonuses.stomp > 0 && <span title="Stomp Bonus">🦶+{bonuses.stomp}</span>}
                                    {bonuses.scream > 0 && <span title="Scream Bonus">😱+{bonuses.scream}</span>}
                                    {hasHoneyPot && <span title="Re-roll 1s">🍯</span>}
                                </div>
                                <div style={{ fontSize: '0.8em', maxWidth: '200px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.7 }}>
                                    Captured: {p.capturedCards.map(c => c.name).join(', ') || 'None'}
                                </div>
                            </div>
                        );
                    })}
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
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', overflowY: 'auto', height: '200px' }}>
                    <strong>Game Log:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                        {[...gameState.turnLog].reverse().map((log, i) => (
                            <div key={i} style={{ fontSize: '0.9em', opacity: 0.8 }}>{log}</div>
                        ))}
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: gameState.diceRollConfig.success === true ? '#27ae60' : (gameState.diceRollConfig.success === false ? '#c0392b' : (gameState.diceRollConfig.pending ? '#f1c40f' : '#95a5a6')),
                    borderRadius: '8px',
                    color: 'white',
                    transition: 'background 0.3s ease'
                }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>
                        {gameState.diceRollConfig.player ?
                            `${gameState.diceRollConfig.player.name} ${gameState.diceRollConfig.player.isBot ? '🤖' : '👤'} `
                            : ''}
                        {gameState.diceRollConfig.targetCardName ? `vs ${gameState.diceRollConfig.targetCardName}: ` : ''}
                        {gameState.diceRollConfig.pending ? 'Rolling...' : (gameState.diceRollConfig.success === true ? 'Success!' : (gameState.diceRollConfig.success === false ? 'Failed!' : (gameState.diceRollConfig.results.length > 0 ? 'Roll Result' : 'Ready to Roll')))}
                    </h3>
                    {gameState.diceRollConfig.results.length > 0 ? (
                        <>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                {gameState.diceRollConfig.results.map((val, i) => (
                                    <DiceFace key={i} value={val} />
                                ))}
                            </div>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                                Total: {gameState.diceRollConfig.total ?? gameState.diceRollConfig.results.reduce((a, b) => a + b, 0)}
                                {gameState.diceRollConfig.bonus ? <span style={{ fontSize: '0.6em', color: '#f1c40f', marginLeft: '5px' }}>(+{gameState.diceRollConfig.bonus})</span> : ''}
                            </div>
                        </>
                    ) : (
                        <div style={{ opacity: 0.7, fontStyle: 'italic' }}>Select cards and action to roll</div>
                    )}
                    {gameState.diceRollConfig.required !== undefined && (
                        <div style={{ fontSize: '1em', marginTop: '5px', opacity: 0.9 }}>
                            Needed: {gameState.diceRollConfig.required}
                        </div>
                    )}
                </div>
            </section>

            {/* Player Area */}
            <section style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3>Your Hand ({gameState.players[0].hand.length})</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {gameState.phase === 'penalty_discard' && isMyTurn ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#c0392b', fontWeight: 'bold' }}>Capture Failed! Select 1 card to discard:</span>
                                <button
                                    onClick={handleDiscard}
                                    disabled={selectedHandCards.length !== 1}
                                    style={{ background: '#c0392b', color: 'white' }}
                                >
                                    🗑️ Discard Selected
                                </button>
                            </div>
                        ) : gameState.phase === 'game_over' ? (
                            <div style={{ fontWeight: 'bold', color: '#f1c40f' }}>GAME OVER</div>
                        ) : (
                            <>
                                <button onClick={onDraw} disabled={!isMyTurn || gameState.phase !== 'action'}>🃏 Draw Card</button>
                                <button onClick={() => handleAction('strike')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0}>⚔️ Strike (Straight)</button>
                                <button onClick={() => handleAction('stomp')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0}>🦶 Stomp (Flush)</button>
                                <button onClick={() => handleAction('scream')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0}>😱 Scream (Kind)</button>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px' }}>
                    {[...gameState.players[0].hand].sort((a, b) => {
                        if (a.type !== 'adventurer' || b.type !== 'adventurer') return 0; // Keep special cards as is or move to end
                        const suits = ['red', 'orange', 'purple', 'green', 'blue'];
                        const suitDiff = suits.indexOf(a.suit) - suits.indexOf(b.suit);
                        if (suitDiff !== 0) return suitDiff;
                        return a.value - b.value;
                    }).map(card => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            isSelected={selectedHandCards.includes(card.id)}
                            onClick={() => toggleHandCard(card.id)}
                        />
                    ))}
                </div>
            </section>

            {/* Game Over Overlay */}
            {
                gameState.phase === 'game_over' && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: '#ecf0f1', padding: '40px', borderRadius: '20px',
                            textAlign: 'center', boxShadow: '0 0 30px rgba(230, 126, 34, 0.6)',
                            maxWidth: '500px', width: '90%'
                        }}>
                            <h1 style={{ fontSize: '3em', color: '#e67e22', marginBottom: '20px' }}>🏆 Game Over! 🏆</h1>

                            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
                                {gameState.players
                                    .map(p => ({
                                        ...p,
                                        score: p.capturedCards.reduce((acc, c) => acc + ('victoryPoints' in c ? (c as any).victoryPoints : 0), 0)
                                    }))
                                    .sort((a, b) => b.score - a.score)
                                    .map((p, i) => (
                                        <div key={p.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px', background: i === 0 ? '#f1c40f' : 'white',
                                            borderRadius: '8px', marginBottom: '10px',
                                            border: i === 0 ? '3px solid #f39c12' : '1px solid #bdc3c7',
                                            fontWeight: i === 0 ? 'bold' : 'normal'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.5em' }}>{i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉')}</span>
                                                <span>{p.name}</span>
                                            </div>
                                            <span style={{ fontSize: '1.5em' }}>{p.score} VP</span>
                                        </div>
                                    ))
                                }
                            </div>

                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    fontSize: '1.2em', padding: '15px 30px',
                                    background: '#27ae60', color: 'white', border: 'none',
                                    borderRadius: '50px', cursor: 'pointer',
                                    boxShadow: '0 5px 15px rgba(39, 174, 96, 0.4)'
                                }}
                            >
                                Play Again 🔄
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
