import React, { useState, useEffect, useRef } from 'react';
import type { GameState, AttackType } from '../engine/types';
import { CardComponent } from './Card';
import { Probability } from '../engine/Probability';
import { audioManager } from '../engine/AudioManager';
import '../index.css';



interface GameBoardProps {
    gameState: GameState;
    onDraw: () => void;
    onCapture: (cardId: string, attackType: AttackType, cardIdsToPlay: string[], consumablesToUse?: string[]) => void;
    onPenaltyDiscard: (cardId: string) => void;
    onEventDiscard: (playerId: string, cardId: string) => void;
    onEventPass: (playerId: string, cardId: string) => void;
    onRenamePlayer: (playerId: string, newName: string) => void;
}

const DiceFace: React.FC<{ value: number }> = ({ value }) => {
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
        <div className="themed-die">
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={dotMap[value]?.includes(i) ? 'themed-die-pip' : ''} />
            ))}
        </div>
    );
};

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDraw, onCapture, onPenaltyDiscard, onEventDiscard, onEventPass, onRenamePlayer: _onRenamePlayer }) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = !player.isBot; // Assuming index 0 is human usually, or check ID

    const [selectedHandCards, setSelectedHandCards] = useState<string[]>([]);
    const [selectedConsumables, setSelectedConsumables] = useState<string[]>([]);
    const [selectedLandscapeCardId, setSelectedLandscapeCardId] = useState<string | null>(null);
    const [isLogCollapsed, setIsLogCollapsed] = useState(true);
    const [isGameOverLogExpanded, setIsGameOverLogExpanded] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [genericToast, setGenericToast] = useState<{ message: string, visible: boolean, type: 'info' | 'error' | 'success' | 'event' }>({ message: '', visible: false, type: 'info' });
    const selectedLandscapeCard = gameState.landscape.find(c => c.id === selectedLandscapeCardId);

    // Ref for the log container
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Show dice toast when rolling or when results come in
    useEffect(() => {
        if (gameState.diceRollConfig.pending) {
            setShowToast(true);
            setGenericToast(prev => ({ ...prev, visible: false }));
            audioManager.playRollStart();
        } else if (gameState.diceRollConfig.results.length > 0) {
            // Results arrived
            setShowToast(true);
            setGenericToast(prev => ({ ...prev, visible: false }));

            if (gameState.diceRollConfig.success === true) {
                audioManager.playSuccess();
            } else if (gameState.diceRollConfig.success === false) {
                audioManager.playFailure();
            }
        }
    }, [gameState.diceRollConfig.pending, gameState.diceRollConfig.results, gameState.diceRollConfig.success]);

    // Handle Engine Notifications (Bot & Player Actions)
    useEffect(() => {
        if (gameState.latestNotification) {
            setGenericToast({
                message: gameState.latestNotification.message,
                visible: true,
                type: gameState.latestNotification.type
            });
            // Play a small notification sound or reuse draw sound for general updates if desired
            // audioManager.playDraw(); 
        }
    }, [gameState.latestNotification?.id]); // Only trigger on ID change

    // Handle Game Over Sound
    useEffect(() => {
        if (gameState.phase === 'game_over') {
            // Determine win/loss
            const player = gameState.players.find(p => !p.isBot);
            if (player) {
                // Simplified check: Are we the winner? 
                // We'll let the existing logic inside the render block calculate scores perfectly, 
                // but here we just need a quick check or we can delay sound until render?
                // Better: Check turn log or just simple score compare here for audio trigger
                // Or just play a general "Game Over" fanfare.
                // Let's reuse the score calculation logic or just play "Win" if not bot.
                // For MVP audio, let's just assume if it's game over, play a fanfare.
                // Refinment: calculate scores here briefly.
                const scores = gameState.players.map(p => ({ id: p.id, score: p.capturedCards.reduce((acc, c) => acc + ('victoryPoints' in c ? (c as any).victoryPoints : 0), 0) }));
                const myScore = scores.find(s => s.id === player.id)?.score || 0;
                const botScore = scores.find(s => s.id !== player.id)?.score || 0;
                audioManager.playGameOver(myScore >= botScore);
            }
        }
    }, [gameState.phase]);

    // Scroll to bottom when log is expanded OR when new logs arrive while expanded
    useEffect(() => {
        if (!isLogCollapsed && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [isLogCollapsed, gameState.turnLog.length]);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if ((showToast && !gameState.diceRollConfig.pending && gameState.diceRollConfig.results.length > 0) || genericToast.visible) {
            timer = setTimeout(() => {
                setShowToast(false);
                setGenericToast(prev => ({ ...prev, visible: false }));
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [showToast, gameState.diceRollConfig.pending, gameState.diceRollConfig.results, genericToast.visible]);

    const toggleHandCard = (id: string) => {
        if (selectedHandCards.includes(id)) {
            setSelectedHandCards(selectedHandCards.filter(c => c !== id));
        } else {
            setSelectedHandCards([...selectedHandCards, id]);
        }
    };

    const toggleConsumable = (id: string) => {
        if (selectedConsumables.includes(id)) {
            setSelectedConsumables(selectedConsumables.filter(c => c !== id));
        } else {
            setSelectedConsumables([...selectedConsumables, id]);
        }
    };

    // Helper for transparent gradients
    const getToastBackground = () => {
        if (genericToast.visible) {
            if (genericToast.type === 'error') return 'linear-gradient(135deg, rgba(192, 57, 43, 0.95), rgba(231, 76, 60, 0.95))';
            if (genericToast.type === 'event') return 'linear-gradient(135deg, rgba(230, 126, 34, 0.9), rgba(243, 156, 18, 0.9))'; // Orange for Events
            return 'linear-gradient(135deg, rgba(52, 73, 94, 0.9), rgba(44, 62, 80, 0.9))';
        }
        if (gameState.diceRollConfig.success === true) return 'linear-gradient(135deg, rgba(46, 204, 113, 0.6), rgba(39, 174, 96, 0.6))';
        if (gameState.diceRollConfig.success === false) return 'linear-gradient(135deg, rgba(231, 76, 60, 0.6), rgba(192, 57, 43, 0.6))';
        if (gameState.diceRollConfig.pending) return 'linear-gradient(135deg, rgba(241, 196, 15, 0.6), rgba(243, 156, 18, 0.6))';
        return 'linear-gradient(135deg, rgba(149, 165, 166, 0.6), rgba(127, 140, 141, 0.6))';
    };








    const handleAction = (type: AttackType) => {
        if (selectedLandscapeCardId) {
            // Basic validation for selection presence (though engine does more)
            // Need at least 1 card OR dragon spell which might be special but usually needs 3 cards.
            if (selectedHandCards.length === 0 && selectedConsumables.length === 0) {
                // Engine validation usually checks for cards, but Dragon Spell uses cards from hand.
                // Just pass through if we have a target, let engine validate.
            }

            try {
                onCapture(selectedLandscapeCardId, type, selectedHandCards, selectedConsumables);
                // Reset selection after attempt
                setSelectedHandCards([]);
                setSelectedConsumables([]);
                setSelectedLandscapeCardId(null);
            } catch (err: any) {
                setGenericToast({ message: `⚠️ ${err.message}`, visible: true, type: 'error' });
            }
        }
    };

    const handleDraw = () => {
        audioManager.playDraw();
        onDraw();
    };

    return (
        <div style={{ padding: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

            {/* Header: Scores / Turn Info */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px 20px', borderRadius: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontSize: '3em' }}>🐉 Dragonwood 🌲</h2>
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(() => {
                        const maxNameLength = Math.max(...gameState.players.map(p => p.name.length));
                        // Base width + char width approximation. 
                        // 120px base + (maxLen * 10px) roughly covers it.
                        const boxWidth = Math.max(140, 100 + (maxNameLength * 12)) + 'px';

                        return gameState.players.map(p => {
                            const score = p.capturedCards.reduce((acc, c) => acc + ('victoryPoints' in c ? (c as any).victoryPoints : 0), 0);
                            const isActive = p.id === player.id;

                            // Create detailed tooltip
                            const capturedTooltip = p.capturedCards.length > 0
                                ? `Captured Cards (${p.capturedCards.length}):\n${p.capturedCards.map(c => `• ${c.name}`).join('\n')}`
                                : "No cards captured";

                            // Calculate bonuses for display
                            const hasCloakOfDarkness = p.capturedCards.some(c => c.name === 'Cloak of Darkness');
                            const hasMagicalUnicorn = p.capturedCards.some(c => c.name === 'Magical Unicorn');
                            const bonuses = {
                                strike: p.capturedCards.reduce((acc, c) => acc + (c.name === 'Silver Sword' ? 2 : 0), 0) + (hasCloakOfDarkness ? 2 : 0) + (hasMagicalUnicorn ? 1 : 0),
                                stomp: p.capturedCards.reduce((acc, c) => acc + (c.name === 'Magical Boots' ? 2 : 0), 0) + (hasCloakOfDarkness ? 2 : 0) + (hasMagicalUnicorn ? 1 : 0),
                                scream: p.capturedCards.reduce((acc, c) => acc + (c.name === 'Ghost Disguise' ? 2 : 0), 0) + (hasCloakOfDarkness ? 2 : 0) + (hasMagicalUnicorn ? 1 : 0),
                            };
                            const hasHoneyPot = p.capturedCards.some(c => c.name === 'Honey Pot');

                            return (
                                <div key={p.id}
                                    title={capturedTooltip}
                                    style={{
                                        padding: '10px 15px',
                                        background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                        borderRadius: '10px',
                                        border: isActive ? '2px solid #f1c40f' : '1px solid transparent',
                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px',
                                        minWidth: boxWidth,
                                        width: boxWidth, // Enforce equality
                                        cursor: 'help'
                                    }}>
                                    <div
                                        style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '5px', color: '#ecf0f1' }}
                                    >
                                        {p.name} {p.isBot ? '🤖' : '👤'}
                                    </div>
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
                        });
                    })()}
                </div>
            </header>

            {/* Landscape Area */}
            <section>
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    overflowX: 'auto',
                    padding: '30px 10px 10px 10px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.1))',
                    borderRadius: '8px'
                }}>
                    {gameState.dragonwoodDeck.length > 0 && (
                        <div style={{
                            width: 'var(--card-width)',
                            height: 'var(--card-height)',
                            backgroundImage: 'url(/dragonwood_card_back.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 'var(--card-radius)',
                            border: '2px solid #2e7d32',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            textShadow: '2px 2px 4px black',
                            color: '#ecf0f1',
                            fontWeight: 'bold',
                            position: 'relative',
                            userSelect: 'none',
                            marginRight: '30px'
                        }}>
                            <div style={{ zIndex: 2, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2em', marginBottom: '5px' }}>Cards Left</div>
                                <div style={{ fontSize: '2em', color: '#f1c40f' }}>{gameState.dragonwoodDeck.length}</div>
                            </div>
                            <div style={{
                                marginTop: '10px',
                                padding: '5px 10px',
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '10px',
                                fontSize: '0.8em',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}>
                                <span>🔄</span>
                                <span style={{ color: '#e67e22', fontSize: '1.2em' }}>{3 - gameState.deckCycles}</span>
                            </div>
                        </div>
                    )}
                    {gameState.landscape.map(card => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            isSelected={selectedLandscapeCardId === card.id}
                            onClick={() => {
                                if (card.type !== 'event') {
                                    setSelectedLandscapeCardId(selectedLandscapeCardId === card.id ? null : card.id);
                                }
                            }}
                        />
                    ))}
                </div>
            </section >





            {/* Player Area */}
            {/* Player Area */}
            <section>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '40px 10px 10px 10px' }}>
                    {/* Consumables (Left) + Hand (Sorted) */}
                    {[
                        ...gameState.players[0].capturedCards.filter(c => c.name === 'Lightning Bolt' || c.name === 'Friendly Bunny'),
                        ...[...gameState.players[0].hand].sort((a, b) => {
                            if (a.type !== 'adventurer' || b.type !== 'adventurer') return 0;
                            const suits = ['red', 'orange', 'purple', 'green', 'blue'];
                            const suitDiff = suits.indexOf(a.suit) - suits.indexOf(b.suit);
                            if (suitDiff !== 0) return suitDiff;
                            return a.value - b.value;
                        })
                    ].map(card => {
                        const isConsumable = card.type === 'enhancement' && (card.name === 'Lightning Bolt' || card.name === 'Friendly Bunny');
                        return (
                            <CardComponent
                                key={card.id}
                                card={card}
                                isSelected={isConsumable ? selectedConsumables.includes(card.id) : selectedHandCards.includes(card.id)}
                                onClick={() => {
                                    if (gameState.phase === 'resolve_event_discard' && gameState.pendingEventDiscards?.includes(player.id)) {
                                        onEventDiscard(player.id, card.id);
                                    } else if (gameState.phase === 'resolve_event_pass' && gameState.pendingEventPasses?.includes(player.id)) {
                                        onEventPass(player.id, card.id);
                                    } else {
                                        isConsumable ? toggleConsumable(card.id) : toggleHandCard(card.id);
                                    }
                                }}
                            />
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: '0 20px 0 0' }}>Your Hand ({gameState.players[0].hand.length})</h3>
                    {gameState.phase === 'penalty_discard' && isMyTurn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#c0392b', fontWeight: 'bold' }}>
                                Capture Failed! Select {gameState.penaltyCardsNeeded || 1} card{(gameState.penaltyCardsNeeded || 1) > 1 ? 's' : ''} to discard:
                            </span>
                            <button
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    background: '#c0392b', // Red
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    if (selectedHandCards.length > 0) {
                                        // Handle single or multiple?
                                        // onPenaltyDiscard currently defined as (cardId: string) => void in GameBoardProps
                                        // But we might want to discard all selected.
                                        selectedHandCards.forEach(id => onPenaltyDiscard(id));
                                        setSelectedHandCards([]);
                                    }
                                }}
                            >
                                Discard Selected
                            </button>
                        </div>
                    ) : gameState.phase === 'resolve_event_discard' && gameState.pendingEventDiscards?.includes(player.id) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                                Thunder Storm! Click a card to discard it immediately.
                            </span>
                        </div>
                    ) : gameState.phase === 'resolve_event_pass' && gameState.pendingEventPasses?.includes(player.id) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#3498db', fontWeight: 'bold' }}>
                                Wind Storm! Select a card to pass to your neighbor.
                            </span>
                        </div>
                    ) : gameState.phase === 'game_over' ? (
                        <div style={{ fontWeight: 'bold', color: '#f1c40f' }}>GAME OVER</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <button onClick={handleDraw} disabled={!isMyTurn || gameState.phase !== 'action'} title="Draw 1 card from the deck" style={{
                                    fontSize: '2em', padding: '0', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(135deg, rgba(189, 195, 199, 0.6), rgba(149, 165, 166, 0.6))', color: 'white', border: '2px solid #ecf0f1', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    🃏
                                </button>
                                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#ecf0f1' }}>Draw</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => handleAction('strike')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0} title="Play cards in numerical order (Straight)" style={{
                                        fontSize: '2em', padding: '0', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.6), rgba(192, 57, 43, 0.6))', color: 'white', border: '2px solid #c0392b', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        ⚔️
                                    </button>

                                    {isMyTurn && selectedLandscapeCard && selectedHandCards.length > 0 && (selectedLandscapeCard.type === 'creature' || selectedLandscapeCard.type === 'enhancement') && (
                                        <div style={{
                                            position: 'absolute', top: -10, right: -10,
                                            background: '#34495e', color: 'white', fontSize: '0.7em', padding: '2px 6px', borderRadius: '10px',
                                            border: '1px solid white', whiteSpace: 'nowrap'
                                        }}>
                                            {(() => {
                                                const target = (selectedLandscapeCard as any).captureCost.strike;
                                                const hasCloakOfDarkness = gameState.players[0].capturedCards.some(c => c.name === 'Cloak of Darkness');
                                                const hasMagicalUnicorn = gameState.players[0].capturedCards.some(c => c.name === 'Magical Unicorn');

                                                let bonus = gameState.players[0].capturedCards.reduce((acc, c) => acc + (c.name === 'Silver Sword' ? 2 : 0), 0) + (hasCloakOfDarkness ? 2 : 0) + (hasMagicalUnicorn ? 1 : 0);
                                                let extraDice = 0;
                                                selectedConsumables.forEach(cId => {
                                                    const card = gameState.players[0].capturedCards.find(c => c.id === cId);
                                                    if (card?.name === 'Lightning Bolt') bonus += 4;
                                                    if (card?.name === 'Friendly Bunny') extraDice += 1;
                                                });

                                                // Validate Strike (Straight)
                                                const cards = gameState.players[0].hand.filter(c => selectedHandCards.includes(c.id)) as unknown as import('../engine/types').AdventurerCard[];
                                                const sorted = [...cards].sort((a, b) => a.value - b.value);
                                                let isValid = true;
                                                for (let i = 0; i < sorted.length - 1; i++) {
                                                    if (sorted[i + 1].value !== sorted[i].value + 1) isValid = false;
                                                }
                                                if (!isValid) return "0% ";

                                                const prob = Probability.calculateSuccessChance(selectedHandCards.length + extraDice, Math.max(1, target - bonus));
                                                return `${Math.round(prob)}% `;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#ecf0f1' }}>Strike (Straight)</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => handleAction('stomp')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0} title="Play cards of the same suit (Flush)" style={{
                                        fontSize: '2em', padding: '0', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.6), rgba(211, 84, 0, 0.6))', color: 'white', border: '2px solid #e67e22', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        🦶
                                    </button>
                                    {isMyTurn && selectedLandscapeCard && selectedHandCards.length > 0 && (selectedLandscapeCard.type === 'creature' || selectedLandscapeCard.type === 'enhancement') && (
                                        <div style={{
                                            position: 'absolute', top: -10, right: -10,
                                            background: '#34495e', color: 'white', fontSize: '0.7em', padding: '2px 6px', borderRadius: '10px',
                                            border: '1px solid white', whiteSpace: 'nowrap'
                                        }}>
                                            {(() => {
                                                const target = (selectedLandscapeCard as any).captureCost.stomp;
                                                const hasCloakOfDarkness = gameState.players[0].capturedCards.some(c => c.name === 'Cloak of Darkness');
                                                const hasMagicalUnicorn = gameState.players[0].capturedCards.some(c => c.name === 'Magical Unicorn');

                                                let bonus = gameState.players[0].capturedCards.reduce((acc, c) => acc + (c.name === 'Magical Boots' ? 2 : 0), 0) + (hasCloakOfDarkness ? 2 : 0) + (hasMagicalUnicorn ? 1 : 0);
                                                let extraDice = 0;
                                                selectedConsumables.forEach(cId => {
                                                    const card = gameState.players[0].capturedCards.find(c => c.id === cId);
                                                    if (card?.name === 'Lightning Bolt') bonus += 4;
                                                    if (card?.name === 'Friendly Bunny') extraDice += 1;
                                                });

                                                // Validate Stomp (Flush)
                                                const cards = gameState.players[0].hand.filter(c => selectedHandCards.includes(c.id)) as unknown as import('../engine/types').AdventurerCard[];
                                                const isValid = cards.every(c => c.suit === cards[0].suit);
                                                if (!isValid) return "0% ";

                                                const prob = Probability.calculateSuccessChance(selectedHandCards.length + extraDice, Math.max(1, target - bonus));
                                                return `${Math.round(prob)}% `;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#ecf0f1' }}>Stomp (Flush)</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => handleAction('scream')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0} title="Play cards of the same value (Kind)" style={{
                                        fontSize: '2em', padding: '0', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.6), rgba(142, 68, 173, 0.6))', color: 'white', border: '2px solid #8e44ad', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        😱
                                    </button>
                                    {isMyTurn && selectedLandscapeCard && selectedHandCards.length > 0 && (selectedLandscapeCard.type === 'creature' || selectedLandscapeCard.type === 'enhancement') && (
                                        <div style={{
                                            position: 'absolute', top: -10, right: -10,
                                            background: '#34495e', color: 'white', fontSize: '0.7em', padding: '2px 6px', borderRadius: '10px',
                                            border: '1px solid white', whiteSpace: 'nowrap'
                                        }}>
                                            {(() => {
                                                const target = (selectedLandscapeCard as any).captureCost.scream;
                                                const hasCloakOfDarkness = gameState.players[0].capturedCards.some(c => c.name === 'Cloak of Darkness');
                                                const hasMagicalUnicorn = gameState.players[0].capturedCards.some(c => c.name === 'Magical Unicorn');

                                                let bonus = gameState.players[0].capturedCards.reduce((acc, c) => acc + (c.name === 'Ghost Disguise' ? 2 : 0), 0) + (hasCloakOfDarkness ? 2 : 0) + (hasMagicalUnicorn ? 1 : 0);
                                                let extraDice = 0;
                                                selectedConsumables.forEach(cId => {
                                                    const card = gameState.players[0].capturedCards.find(c => c.id === cId);
                                                    if (card?.name === 'Lightning Bolt') bonus += 4;
                                                    if (card?.name === 'Friendly Bunny') extraDice += 1;
                                                });

                                                // Validate Scream (Kind)
                                                const cards = gameState.players[0].hand.filter(c => selectedHandCards.includes(c.id)) as unknown as import('../engine/types').AdventurerCard[];
                                                const isValid = cards.every(c => c.value === cards[0].value);
                                                if (!isValid) return "0% ";

                                                const prob = Probability.calculateSuccessChance(selectedHandCards.length + extraDice, Math.max(1, target - bonus));
                                                return `${Math.round(prob)}% `;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#ecf0f1' }}>Scream (Kind)</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => handleAction('dragon_spell')} disabled={!isMyTurn || !selectedLandscapeCard || selectedHandCards.length === 0} title="Dragon Spell: Roll 2 dice, need 6+ to capture Dragon. Requires 3-card Straight Flush." style={{
                                        fontSize: '2em', padding: '0', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(135deg, rgba(41, 182, 246, 0.6), rgba(3, 169, 244, 0.6))', color: 'white', border: '2px solid #03a9f4', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        🪄
                                    </button>
                                    {isMyTurn && (selectedLandscapeCard?.name === 'Orange Dragon' || selectedLandscapeCard?.name === 'Blue Dragon') && selectedHandCards.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: -10, right: -10,
                                            background: '#34495e', color: 'white', fontSize: '0.7em', padding: '2px 6px', borderRadius: '10px',
                                            border: '1px solid white', whiteSpace: 'nowrap'
                                        }}>
                                            {(() => {
                                                if (selectedHandCards.length !== 3) return "0%";
                                                // Re-validate strictly for visual feedback
                                                const cards = gameState.players[0].hand.filter(c => selectedHandCards.includes(c.id)) as unknown as import('../engine/types').AdventurerCard[];
                                                // Check Flush
                                                const isFlush = cards.every(c => c.suit === cards[0].suit);
                                                // Check Straight
                                                const sorted = [...cards].sort((a, b) => a.value - b.value);
                                                let isStraight = true;
                                                for (let i = 0; i < sorted.length - 1; i++) {
                                                    if (sorted[i + 1].value !== sorted[i].value + 1) isStraight = false;
                                                }

                                                if (isFlush && isStraight) {
                                                    let bonus = 0; // Does Lightning Bolt apply to Dragon Spell? Yes.
                                                    let extraDice = 0;
                                                    selectedConsumables.forEach(cId => {
                                                        const card = gameState.players[0].capturedCards.find(c => c.id === cId);
                                                        if (card?.name === 'Lightning Bolt') bonus += 4;
                                                        if (card?.name === 'Friendly Bunny') extraDice += 1;
                                                    });

                                                    // Dragon Spell: 2 Dice, Target 6
                                                    const prob = Probability.calculateSuccessChance(2 + extraDice, Math.max(1, 6 - bonus));
                                                    return `${Math.round(prob)}%`;
                                                }
                                                return "0%";
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#ecf0f1' }}>Dragon Spell</span>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Metrics Bar */}
            <section style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '10px', color: '#ecf0f1', fontSize: '0.9em' }}>
                <div title="Number of times the deck can be reshuffled">🔄 Shuffles Left: <strong>{3 - gameState.deckCycles}</strong></div>
                <div title="Number of cards in Bot's hand">🤖 Bot Hand: <strong>{gameState.players.find(p => p.isBot)?.hand.length || 0}</strong></div>
                <div title="Cards remaining in the Adventure Deck">🃏 Adventure Deck: <strong>{gameState.adventurerDeck.length}</strong></div>
                <div title="Cards remaining in the Dragonwood Deck">🌲 Landscape Deck: <strong>{gameState.dragonwoodDeck.length}</strong></div>
            </section>

            {/* Collapsible Game Log */}
            <section style={{ marginBottom: '10px' }}>
                <div
                    onClick={() => setIsLogCollapsed(!isLogCollapsed)}
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px 15px',
                        borderRadius: isLogCollapsed ? '8px' : '8px 8px 0 0',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: '#ecf0f1',
                        fontSize: '0.9em'
                    }}
                >
                    <strong>📜 Adventure Log</strong>
                    <span>{isLogCollapsed ? 'Show ▼' : 'Hide ▲'}</span>
                </div>
                {!isLogCollapsed && (
                    <div
                        ref={logContainerRef}
                        style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '10px',
                            borderRadius: '0 0 8px 8px',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            borderTop: '1px solid rgba(255,255,255,0.1)'
                        }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Standard order: Oldest at top, Newest at bottom */}
                            {gameState.turnLog.map((log, i) => (
                                <div key={i} style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '2px' }}>{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </section>



            {/* Toast Notification for Dice Rolls */}
            {
                ((showToast && (gameState.diceRollConfig.pending || gameState.diceRollConfig.results.length > 0)) || genericToast.visible) && (
                    <div style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        width: 'auto',
                        maxWidth: '300px',
                        minWidth: '250px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '15px',
                        background: getToastBackground(),
                        backdropFilter: 'blur(4px)',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                        zIndex: 2000,
                        animation: 'slideInRight 0.3s ease-out'
                    }}>
                        <button
                            onClick={() => setShowToast(false)}
                            style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'rgba(0,0,0,0.15)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.8em',
                                padding: 0
                            }}
                        >✕</button>

                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1em', textAlign: 'center', paddingRight: '15px' }}>
                            {genericToast.visible ? (
                                genericToast.message
                            ) : (
                                <>
                                    {gameState.diceRollConfig.player ?
                                        `${gameState.diceRollConfig.player.name} ${gameState.diceRollConfig.player.isBot ? '🤖' : '👤'} `
                                        : ''}
                                    {gameState.diceRollConfig.targetCardName ? `vs ${gameState.diceRollConfig.targetCardName}: ` : ''}
                                    {gameState.diceRollConfig.pending ? 'Rolling...' : (gameState.diceRollConfig.success === true ? 'Success!' : (gameState.diceRollConfig.success === false ? 'Failed!' : (gameState.diceRollConfig.results.length > 0 ? 'Roll Result' : 'Ready to Roll')))}
                                </>
                            )}
                        </h3>
                        {showToast && gameState.diceRollConfig.results.length > 0 && (
                            <>
                                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {gameState.diceRollConfig.results.map((val, i) => (
                                        <div key={i} style={{ transform: 'scale(0.8)' }}>
                                            <DiceFace value={val} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                                    Total: {gameState.diceRollConfig.total ?? gameState.diceRollConfig.results.reduce((a, b) => a + b, 0)}
                                    {gameState.diceRollConfig.bonus ? <span style={{ fontSize: '0.7em', color: '#f1c40f', marginLeft: '3px' }}>(+{gameState.diceRollConfig.bonus})</span> : ''}
                                </div>
                            </>
                        )}
                        {showToast && gameState.diceRollConfig.required !== undefined && (
                            <div style={{ fontSize: '0.9em', marginTop: '2px', opacity: 0.9 }}>
                                Needed: {gameState.diceRollConfig.required}
                            </div>
                        )}

                        {/* Visual Timer Line */}
                        {((!gameState.diceRollConfig.pending && gameState.diceRollConfig.results.length > 0) || genericToast.visible) && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                width: '100%',
                                borderBottomLeftRadius: '12px',
                                animation: 'shrinkWidth 5s linear forwards'
                            }} />
                        )}
                    </div>
                )
            }

            {/* Game Over Overlay */}
            {
                gameState.phase === 'game_over' && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: '#ecf0f1', padding: '30px', borderRadius: '20px',
                            textAlign: 'center', boxShadow: '0 0 30px rgba(230, 126, 34, 0.6)',
                            maxWidth: '900px', width: '90%',
                            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                        }}>
                            {(() => {
                                // 1. Calculate Base Stats
                                const playersWithStats = gameState.players.map(p => {
                                    const baseScore = p.capturedCards.reduce((acc, c) => acc + ('victoryPoints' in c ? (c as any).victoryPoints : 0), 0);
                                    const creatureCount = p.capturedCards.filter(c => c.type === 'creature').length;
                                    return { ...p, baseScore, creatureCount, bonus: 0, totalScore: 0 };
                                });

                                // 2. Calculate Creature Bonuses
                                const maxCreatures = Math.max(...playersWithStats.map(p => p.creatureCount));
                                // Rule: "whoever has the most gets a bonus... ties get 2 each"
                                // If everyone has 0, technically they tie for most? Let's assume yes for strict adherence, or maybe >0 check.
                                // Given the context of "Comparing amount captured", 0 vs 0 is a tie.
                                const creatureWinners = playersWithStats.filter(p => p.creatureCount === maxCreatures);
                                if (creatureWinners.length === 1) {
                                    creatureWinners[0].bonus = 3;
                                } else {
                                    creatureWinners.forEach(w => w.bonus = 2);
                                }

                                // 3. Final Score
                                playersWithStats.forEach(p => p.totalScore = p.baseScore + p.bonus);

                                // 4. Sort with Tie Breaker
                                const allPlayers = playersWithStats.sort((a, b) => {
                                    // Primary: Total Score
                                    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                                    // Tie Breaker: "whoever captured the most creatures"
                                    return b.creatureCount - a.creatureCount;
                                    // If still tied, it remains a tie (stable sort or simple return 0)
                                });

                                const winner = allPlayers[0];
                                const humanPlayer = gameState.players.find(p => !p.isBot);
                                const isWinner = winner.id === humanPlayer?.id;
                                // Strict Tie Check: Is the top player actually tied with the second?
                                const isTie = allPlayers.length > 1 &&
                                    allPlayers[0].totalScore === allPlayers[1].totalScore &&
                                    allPlayers[0].creatureCount === allPlayers[1].creatureCount;

                                // Adjust Title for Tie
                                let title = isWinner ? '🎉 Victory! 🏆' : '💀 Defeat...';
                                if (isTie && allPlayers[0].id === humanPlayer?.id) title = '🤝 It\'s a Tie!';
                                if (isTie && allPlayers[0].id !== humanPlayer?.id && allPlayers[1].id === humanPlayer?.id) title = '🤝 It\'s a Tie!'; // Player is one of the tiers

                                return (
                                    <>
                                        <h1 style={{ fontSize: '3em', color: (isWinner && !isTie) ? '#f1c40f' : (isTie ? '#3498db' : '#e74c3c'), marginBottom: '10px' }}>
                                            {title}
                                        </h1>

                                        {(!isWinner && !isTie) && (
                                            <p style={{ fontSize: '1.1em', color: '#7f8c8d', marginBottom: '20px', fontStyle: 'italic' }}>
                                                "Don't give up! A true adventurer learns from every defeat. Better luck next time!"
                                            </p>
                                        )}

                                        <div style={{ marginBottom: '30px', textAlign: 'left', display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'stretch' }}>
                                            {allPlayers.map((p, i) => (
                                                <div key={p.id} style={{
                                                    flex: 1,
                                                    display: 'flex', flexDirection: 'column',
                                                    background: i === 0 ? '#f1c40f' : 'white',
                                                    borderRadius: '12px',
                                                    border: i === 0 ? '3px solid #f39c12' : '1px solid #bdc3c7',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                }}>
                                                    {/* Player Header */}
                                                    <div style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '12px 20px',
                                                        background: 'rgba(0,0,0,0.05)',
                                                        borderBottom: '1px solid rgba(0,0,0,0.1)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2c3e50', fontWeight: 'bold' }}>
                                                            <span style={{ fontSize: '1.5em' }}>{i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉')}</span>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '1.2em' }}>{p.name} {p.isBot ? '🤖' : '👤'}</span>
                                                                <span style={{ fontSize: '0.8em', opacity: 0.7, fontWeight: 'normal' }}>Captured Creatures: {p.creatureCount}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2c3e50' }}>{p.totalScore} VP</div>
                                                            {p.bonus > 0 && <div style={{ fontSize: '0.8em', color: '#27ae60', fontWeight: 'bold' }}>({p.baseScore} + {p.bonus} Bonus)</div>}
                                                        </div>
                                                    </div>

                                                    {/* Captured Cards Gallery */}
                                                    <div style={{ padding: '15px' }}>
                                                        {p.capturedCards.length > 0 ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                {p.capturedCards.sort((a, b) => {
                                                                    const vpA = 'victoryPoints' in a ? (a as any).victoryPoints : 0;
                                                                    const vpB = 'victoryPoints' in b ? (b as any).victoryPoints : 0;
                                                                    return vpB - vpA;
                                                                }).map((card, idx) => {
                                                                    const vp = 'victoryPoints' in card ? (card as any).victoryPoints : 0;
                                                                    const isEnhancement = card.type === 'enhancement';
                                                                    const isDragon = card.name === 'Orange Dragon' || card.name === 'Blue Dragon';
                                                                    const imagePath = (card as any).image ? `/images/${(card as any).image}.png` : (isDragon ? '/images/dragon.png' : null);

                                                                    return (
                                                                        <div key={idx} style={{
                                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                            width: '70px', height: '90px',
                                                                            background: imagePath ? `url(${imagePath})` : (isEnhancement ? '#d5f5e3' : '#fadbd8'),
                                                                            backgroundSize: 'cover',
                                                                            backgroundPosition: 'center',
                                                                            border: isDragon ? '2px solid #8e44ad' : (isEnhancement ? '1px solid #2ecc71' : '1px solid #e74c3c'),
                                                                            borderRadius: '6px', padding: '4px',
                                                                            justifyContent: 'space-between',
                                                                            textAlign: 'center', position: 'relative',
                                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                                        }} title={card.name}>
                                                                            {/* Semi-transparent overlay for readability if image exists */}
                                                                            {imagePath && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', borderRadius: '5px' }} />}

                                                                            <div style={{ position: 'relative', fontSize: '0.6em', lineHeight: '1.1em', fontWeight: 'bold', overflow: 'hidden', color: '#2c3e50', textShadow: '0 0 2px white' }}>
                                                                                {card.name}
                                                                            </div>
                                                                            <div style={{ position: 'relative', fontSize: '1.2em', fontWeight: 'bold', color: isEnhancement ? '#27ae60' : '#c0392b', textShadow: '0 0 2px white' }}>
                                                                                {vp > 0 ? vp : '-'}
                                                                            </div>
                                                                            <div style={{ position: 'relative', fontSize: '0.5em', opacity: 0.9, fontWeight: 'bold', color: '#2c3e50', textShadow: '0 0 2px white' }}>
                                                                                {isEnhancement ? 'ITEM' : 'FOE'}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontStyle: 'italic', opacity: 0.6, textAlign: 'center', fontSize: '0.9em' }}>
                                                                No cards captured
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}

                            {/* Adventure Log in Game Over */}
                            <div style={{
                                width: '100%', textAlign: 'left', marginBottom: '20px',
                                background: 'rgba(0,0,0,0.05)', borderRadius: '10px',
                                overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)'
                            }}>
                                <div
                                    onClick={() => setIsGameOverLogExpanded(!isGameOverLogExpanded)}
                                    style={{
                                        padding: '10px 15px',
                                        cursor: 'pointer',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(0,0,0,0.05)',
                                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '1em' }}>📜 Complete Adventure Log</h3>
                                    <span style={{ fontSize: '0.9em', color: '#7f8c8d' }}>{isGameOverLogExpanded ? 'Collapse ▲' : 'Expand ▼'}</span>
                                </div>
                                <div style={{
                                    padding: '15px',
                                    maxHeight: isGameOverLogExpanded ? '50vh' : '150px',
                                    overflowY: 'auto',
                                    transition: 'max-height 0.3s ease-out'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {gameState.turnLog.map((log, i) => (
                                            <div key={i} style={{ fontSize: '0.9em', color: '#34495e', marginBottom: '4px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '2px' }}>
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
