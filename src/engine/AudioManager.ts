// Synthesized audio manager using Web Audio API
// Tailored for Dragonwood (Fantasy Theme)

class AudioManager {
    private audioCtx: AudioContext | null = null;
    private isMuted: boolean = false;
    private noiseBuffer: AudioBuffer | null = null;

    constructor() {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
            this.initNoiseBuffer();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    private ensureContext() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    private initNoiseBuffer() {
        if (!this.audioCtx) return;
        // 2 seconds of white noise
        const bufferSize = this.audioCtx.sampleRate * 2;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
    }

    // Helper: Play a tone with ADSR envelop
    private playTone(freq: number, type: OscillatorType, startTime: number, duration: number, volume: number = 0.1) {
        if (!this.audioCtx || this.isMuted) return;
        this.ensureContext();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        // ADS Envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // Fantasy "Magical Sparkle" Success
    public playSuccess() {
        if (!this.audioCtx || this.isMuted) return;
        this.ensureContext();
        const now = this.audioCtx.currentTime;

        // Base Chord (Major 7th - Magical feel)
        this.playTone(523.25, 'triangle', now, 0.8, 0.15); // C5
        this.playTone(659.25, 'triangle', now + 0.05, 0.8, 0.15); // E5
        this.playTone(783.99, 'triangle', now + 0.10, 0.8, 0.15); // G5
        this.playTone(987.77, 'sine', now + 0.15, 0.8, 0.15); // B5

        // Sparkles (High pitched random sine pings)
        for (let i = 0; i < 5; i++) {
            this.playTone(1500 + Math.random() * 1000, 'sine', now + 0.2 + (i * 0.08), 0.3, 0.05);
        }
    }

    // "Dungeon" Failure (Low growl/thud)
    public playFailure() {
        if (!this.audioCtx || this.isMuted) return;
        this.ensureContext();
        const now = this.audioCtx.currentTime;

        // Low varying Drone
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now); // A2
        osc.frequency.linearRampToValueAtTime(55, now + 0.5); // Drop pitch

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        // Low pass filter to muffle it (dungeon echo)
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Dice "Clatter" (Filtered Noise)
    public playRollStart() {
        if (!this.audioCtx || this.isMuted || !this.noiseBuffer) return;
        this.ensureContext();
        const now = this.audioCtx.currentTime;

        // Play 3-4 short bursts of noise to simulate dice hitting table
        for (let i = 0; i < 4; i++) {
            const source = this.audioCtx.createBufferSource();
            const gain = this.audioCtx.createGain();
            const filter = this.audioCtx.createBiquadFilter();

            source.buffer = this.noiseBuffer;
            // Variable pitch for each 'die'
            source.playbackRate.value = 0.8 + Math.random() * 0.4;

            // Lowpass to sound like wood/plastic
            filter.type = 'lowpass';
            filter.frequency.value = 800;

            gain.gain.setValueAtTime(0.3, now + i * 0.08); // Staggered
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.1);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);

            source.start(now + i * 0.08);
            source.stop(now + i * 0.08 + 0.15);
        }
    }

    // Card Draw "Swish/Slide"
    public playDraw() {
        if (!this.audioCtx || this.isMuted || !this.noiseBuffer) return;
        this.ensureContext();
        const now = this.audioCtx.currentTime;

        const source = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        source.buffer = this.noiseBuffer;

        // Bandpass to sound 'papery'
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(2000, now + 0.15);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        source.start(now);
        source.stop(now + 0.2);
    }

    public playGameOver(win: boolean) {
        if (!this.audioCtx || this.isMuted) return;
        this.ensureContext();
        const now = this.audioCtx.currentTime;

        if (win) {
            // Heroic Fanfare (Trumpets - Sawtooth w/ Filter)
            const playNote = (f: number, t: number, d: number) => {
                const osc = this.audioCtx!.createOscillator();
                const gain = this.audioCtx!.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = f;

                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, t + d);

                osc.connect(gain);
                gain.connect(this.audioCtx!.destination);
                osc.start(t);
                osc.stop(t + d);
            };

            playNote(523.25, now, 0.3); // C5
            playNote(659.25, now + 0.3, 0.3); // E5
            playNote(783.99, now + 0.6, 0.6); // G5
            playNote(1046.50, now + 1.2, 1.0); // C6
        } else {
            // Defeat Drone
            this.playFailure();
            setTimeout(() => this.playFailure(), 600);
        }
    }
}

export const audioManager = new AudioManager();
