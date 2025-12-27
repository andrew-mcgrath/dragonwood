# Dragonwood (Digital Version) 🐉🌲

A web-based implementation of the popular Dragonwood board game, built with React, TypeScript, and Vite.

This application was built over the course of an afternoon utilizing [Google Antigravity](https://antigravity.google/).

## Overview

Explore the enchanted forest of Dragonwood! Collect adventurer cards to earn dice, which you use to roll against your foes. Stomp on some Fire Ants, scream at a Grumpy Troll, or strike at a menacing Dragon. The goal is to capture creatures and enhancements to earn the most Victory Points.

![Dragonwood Splash](docs/img/screenshots/splash.png)
![Dragonwood Gameplay](docs/img/screenshots/gameplay.png)

## Features implemented

- **Core Gameplay Loop**: Draw cards, manage your hand, and capture landscape cards.
- **Four Attack Types**:
    - ⚔️ **Strike**: Straight (Sequential numbers, e.g., 1, 2, 3)
    - 🦶 **Stomp**: Flush (Same color, e.g., all Red)
    - 😱 **Scream**: Kind (Same value, e.g., all 4s)
    - 🪄 **Dragon Spell**: A powerful special attack intended only for Dragons. Requires a **3-card Straight Flush** (e.g., Red 3, 4, 5).
- **Enhancements**: Capture magical items to gain permanent bonuses:
    - *Silver Sword*: +2 to all Strikes ⚔️
    - *Magical Boots*: +2 to all Stomps 🦶
    - *Ghost Disguise*: +2 to all Screams 😱
    - *Cloak of Darkness*: +2 to ALL capture attempts 🥷
    - *Magical Unicorn*: +1 to ALL capture attempts 🦄
    - *Honey Pot*: Re-roll any 1s 🍯
- **Special Mechanics**:
    - **Lucky Ladybug 🐞**: Immediately draw 2 extra cards when drawn.
    - **Penalty Discard**: If you fail a capture, you must discard one adventurer card as a penalty (2 cards for a failed Dragon Spell!).
- **Bot Opponent 🤖**: Play against a simple AI that draws cards and competes for points.
- **Dynamic UI**:
    - Real-time score and bonus display.
    - Detailed game log with history.
    - Visual indicators for enhancements and dice rolls.
    - Player and Bot renaming.
    - Toast Notifications for enhanced visual feedback.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: CSS (Modules/Inline)
- **State Management**: Custom GameEngine with Observer pattern

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone git@github.com:andrew-mcgrath/dragonwood.git
    cd dragonwood
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    OR
    ```bash
    npx vite
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

### Running with Docker

1.  Make sure you have Docker installed.
2.  Run with Docker Compose:
    ```bash
    docker compose up --build -d
    ```
3.  Open browser at `http://localhost:8080`.

## How to Play

1.  **On your turn**, you can either:
    - **Draw a Card**: Click "Draw Card" to add to your hand.
    - **Capture**: Select a card in the **Landscape** (top row) and select cards from your **Hand** (bottom row) that form a valid attack (Strike, Stomp, Scream, or Dragon Spell). Then click the corresponding action button.
2.  **Dice Roll**: The game calculates your dice count (1 per card + bonuses). If your total roll meets or exceeds the capture cost, you win the card!
3.  **End of Game**: The game ends when:
    -   Both Dragons present in the game are captured.
    -   The Adventure Deck has been exhausted twice (each player gets 1 final turn).
    -   The Dragonwood Deck is empty.

## License

This project is for educational/personal use. [Dragonwood](https://gamewright.com/product/Dragonwood) is a copyright of [Gamewright](https://gamewright.com/).
