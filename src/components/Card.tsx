import React from 'react';
import type { AdventurerCard, DragonwoodCard, PlayerCard, Creature, Enhancement } from '../engine/types';

interface CardProps {
    card: PlayerCard | DragonwoodCard;
    isSelected?: boolean;
    onClick?: () => void;
}

export const CardComponent: React.FC<CardProps> = ({ card, isSelected, onClick }) => {

    // Determine style based on card type
    let bgStyle: React.CSSProperties = {};
    let content = null;

    if (card.type === 'adventurer') {
        const adv = card as AdventurerCard;
        bgStyle = {
            border: `4px solid var(--suit-${adv.suit})`
        };
        content = (
            <>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: `var(--suit-${adv.suit})` }}>
                    {adv.value}
                </div>
                <div style={{ textTransform: 'capitalize' }}>
                    {adv.suit}
                </div>
            </>
        );
    } else if (card.type === 'lucky_ladybug') {
        bgStyle = {
            border: '4px solid pink'
        };
        content = <div>🐞 Ladybug</div>;
    } else if (card.type === 'creature') {
        const creat = card as Creature;
        bgStyle = {
            background: '#34495e',
            color: 'white',
            border: '2px solid #95a5a6',
            padding: 0,
            overflow: 'hidden'
        };

        // Check if image exists (basic mapping or url)
        // For MVP, assuming images are in /images/{imageName}.png
        const imageUrl = creat.image ? `/images/${creat.image}.png` : null;

        content = (
            <>
                {imageUrl && (
                    <div style={{
                        width: '100%',
                        height: '60%',
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderBottom: '2px solid #2c3e50'
                    }} />
                )}
                <div style={{ padding: '5px', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9em', textAlign: 'center' }}>{creat.name}</div>
                    <div style={{ fontSize: '0.8em', textAlign: 'center' }}>VP: {creat.victoryPoints}</div>
                    <div style={{ marginTop: 'auto', fontSize: '0.7em', display: 'flex', justifyContent: 'space-around' }}>
                        <span title="Strike">⚔️ {creat.captureCost?.strike}</span>
                        <span title="Stomp">🦶 {creat.captureCost?.stomp}</span>
                        <span title="Scream">😱 {creat.captureCost?.scream}</span>
                    </div>
                </div>
            </>
        );
    } else if (card.type === 'enhancement') {
        const enh = card as Enhancement;
        bgStyle = {
            background: '#8e44ad',
            color: 'white',
            padding: 0,
            overflow: 'hidden'
        };

        const imageUrl = enh.image ? `/images/${enh.image}.png` : null;

        content = (
            <>
                {imageUrl && (
                    <div style={{
                        width: '100%',
                        height: '60%',
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderBottom: '2px solid #2c3e50'
                    }} />
                )}
                <div style={{ padding: '5px', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9em', textAlign: 'center' }}>{enh.name}</div>
                    <div style={{ fontSize: '0.7em', textAlign: 'center', margin: 'auto 0' }}>{enh.effectDescription}</div>
                    <div style={{ marginTop: 'auto', fontSize: '0.7em', display: 'flex', justifyContent: 'space-around' }}>
                        {enh.captureCost.strike < 99 && <span title="Strike">⚔️ {enh.captureCost.strike}</span>}
                        {enh.captureCost.stomp < 99 && <span title="Stomp">🦶 {enh.captureCost.stomp}</span>}
                        {enh.captureCost.scream < 99 && <span title="Scream">😱 {enh.captureCost.scream}</span>}
                    </div>
                </div>
            </>
        );
    }

    return (
        <div
            className={`card ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            style={{ ...bgStyle }}
        >
            {content}
        </div>
    );
};
