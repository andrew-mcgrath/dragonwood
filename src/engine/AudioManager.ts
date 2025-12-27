// Basic synthesized audio manager using Web Audio API
// This avoids external dependencies or assets for now.

class AudioManager {
    private audioCtx: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        try {
            // @ts-ignore - Handle older browsers if needed, though standard is well supported now
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    private ensureContext() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
    }

    // Helper to play a tone
    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) {
        if (!this.audioCtx || this.isMuted) return;
        this.ensureContext();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + startTime);

        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + startTime);
        osc.stop(this.audioCtx.currentTime + startTime + duration);
    }

    public playSuccess() {
        // Major Arpeggio (C - E - G - C)
        this.playTone(523.25, 'sine', 0.1, 0, 0.1);    // C5
        this.playTone(659.25, 'sine', 0.1, 0.1, 0.1);  // E5
        this.playTone(783.99, 'sine', 0.1, 0.2, 0.1);  // G5
        this.playTone(1046.50, 'sine', 0.3, 0.3, 0.1); // C6
    }

    public playFailure() {
        // Dissonant / Falling
        this.playTone(440, 'sawtooth', 0.2, 0, 0.1);   // A4
        this.playTone(415.30, 'sawtooth', 0.4, 0.1, 0.1); // G#4
    }

    public playRollStart() {
        // High pitch ping/roll sound
        // Quick sequence of random-ish high notes to simulate dice shake
        for (let i = 0; i < 5; i++) {
            this.playTone(800 + Math.random() * 400, 'square', 0.05, i * 0.05, 0.05);
        }
    }

    public playDraw() {
        // Simple "swish" or paper sound simulation (white noise is harder, using high sine sweep)
        if (!this.audioCtx || this.isMuted) return;
        this.ensureContext();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    public playGameOver(win: boolean) {
        if (win) {
            // Victory Fanfare
            const now = 0;
            this.playTone(523.25, 'square', 0.2, now, 0.2);
            this.playTone(523.25, 'square', 0.2, now + 0.2, 0.2);
            this.playTone(523.25, 'square', 0.2, now + 0.4, 0.2);
            this.playTone(698.46, 'square', 0.6, now + 0.6, 0.2); // F5
            this.playTone(880.00, 'square', 0.8, now + 1.0, 0.2); // A5 (long)
        } else {
            // Defeat - Sad trombone-ish
            const now = 0;
            this.playTone(783.99, 'triangle', 0.4, now, 0.2); // G5
            this.playTone(739.99, 'triangle', 0.4, now + 0.4, 0.2); // F#5
            this.playTone(698.46, 'triangle', 0.4, now + 0.8, 0.2); // F5
            this.playTone(659.25, 'triangle', 1.0, now + 1.2, 0.2); // E5
        }
    }
}

export const audioManager = new AudioManager();
