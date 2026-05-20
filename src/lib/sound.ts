/**
 * Scoreboard Sound Effects
 * Uses the Web Audio API to synthetically generate highly realistic
 * gymnasium buzzer sounds without requiring any downloaded audio assets.
 */

export function playBuzzer() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Check if context is suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      // We try to resume it, but it might fail if there was absolutely no user interaction yet.
      ctx.resume();
    }

    // A realistic scoreboard buzzer sound consists of two detuned oscillators 
    // producing a harsh, grating, low-pitch square/sawtooth buzz.
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(140, ctx.currentTime); // Low pitch

    osc2.type = "square";
    osc2.frequency.setValueAtTime(145, ctx.currentTime); // Slightly detuned

    // Configure volume envelope to avoid clicking sounds and fade out elegantly
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); // Rapid fade-in
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 1.2); // Hold for 1.2s
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5); // Elegant fade-out

    // Connect nodes
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Play oscillators
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    // Stop and clean up after 1.6 seconds
    osc1.stop(ctx.currentTime + 1.6);
    osc2.stop(ctx.currentTime + 1.6);
  } catch (error) {
    console.warn("Could not play buzzer sound because of Web Audio constraints:", error);
  }
}

export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note, soft pleasant chime

    // Volume envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.warn("Could not play chime:", error);
  }
}

