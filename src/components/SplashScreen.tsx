import React, { useState } from 'react';
import { generateRandomName } from '../utils/NameGenerator';

interface SplashProps {
    onStartGame: (playerName: string, botName: string) => void;
}

export const SplashScreen: React.FC<SplashProps> = ({ onStartGame }) => {
    // Generate random defaults once on mount
    const [name, setName] = useState(() => generateRandomName(false));
    const [botName, setBotName] = useState(() => generateRandomName(true));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && botName.trim()) {
            onStartGame(name.trim(), botName.trim());
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
            color: '#ecf0f1', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '20px', zIndex: 999
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.1)', padding: '40px', borderRadius: '20px',
                maxWidth: '800px', width: '100%', backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
                <h1 style={{ fontSize: '4em', margin: '0 0 20px 0', textAlign: 'center', color: '#f1c40f', textShadow: '2px 2px 4px #000000' }}>
                    🐉 Dragonwood 🌲
                </h1>

                <div style={{ marginBottom: '40px', lineHeight: '1.6' }}>
                    <h2 style={{ color: '#e67e22', borderBottom: '2px solid #e67e22', paddingBottom: '10px' }}>How to Play</h2>
                    <p>
                        Welcome, adventurer! Your goal is to capture creatures and enhancements from the Dragonwood landscape to earn <strong>Victory Points (VP)</strong>.
                    </p>
                    <p>
                        On your turn, you can either:
                    </p>
                    <ul style={{ listStyleType: 'none', paddingLeft: '10px' }}>
                        <li>🃏 <strong>Draw</strong> 1 Adventurer Card</li>
                        <li>⚔️ <strong>Capture</strong> a card from the landscape using cards from your hand.</li>
                    </ul>

                    <h3>Capturing Cards</h3>
                    <p>To capture a card, you must roll dice equal to the number of cards you play. The sum of the dice must meet or exceed the capture cost.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em' }}>⚔️ Strike</div>
                            <div>Play cards in a <strong>Straight</strong></div>
                            <div style={{ fontSize: '0.8em', opacity: 0.7 }}>(e.g. 3, 4, 5)</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em' }}>🦶 Stomp</div>
                            <div>Play cards of the <strong>Same Suit</strong></div>
                            <div style={{ fontSize: '0.8em', opacity: 0.7 }}>(e.g. 3 Red, 7 Red)</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2em' }}>😱 Scream</div>
                            <div>Play cards of the <strong>Same Value</strong></div>
                            <div style={{ fontSize: '0.8em', opacity: 0.7 }}>(e.g. 4 Red, 4 Green)</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <label style={{ fontSize: '1.2em', textAlign: 'center' }}>
                            <div>Your Name</div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    display: 'block', marginTop: '10px', fontSize: '1em', padding: '10px',
                                    borderRadius: '8px', border: 'none', width: '250px', textAlign: 'center'
                                }}
                                autoFocus
                            />
                        </label>
                        <label style={{ fontSize: '1.2em', textAlign: 'center' }}>
                            <div>Bot Name</div>
                            <input
                                type="text"
                                value={botName}
                                onChange={(e) => setBotName(e.target.value)}
                                style={{
                                    display: 'block', marginTop: '10px', fontSize: '1em', padding: '10px',
                                    borderRadius: '8px', border: 'none', width: '250px', textAlign: 'center'
                                }}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        style={{
                            fontSize: '1.5em', padding: '15px 40px', background: '#27ae60', color: 'white',
                            border: 'none', borderRadius: '50px', cursor: 'pointer',
                            boxShadow: '0 5px 15px rgba(39, 174, 96, 0.4)', transition: 'transform 0.2s',
                            fontWeight: 'bold', marginTop: '20px'
                        }}
                    >
                        ⚔️ Start Adventure ⚔️
                    </button>
                </form>
            </div>
            <div style={{ marginTop: '20px', fontSize: '0.8em', opacity: 0.7, textAlign: 'center' }}>
                This project is for educational/personal use. Dragonwood is a trademark of Gamewright.
            </div>
        </div>
    );
};
