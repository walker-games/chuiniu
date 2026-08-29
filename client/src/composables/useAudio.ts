let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + dur)
}

function noise(dur: number, vol: number, filterFreq = 800) {
  const c = getCtx()
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3
  const src = c.createBufferSource()
  src.buffer = buf
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq
  src.connect(filter).connect(gain).connect(c.destination)
  src.start()
}

function sparkle(baseFreq: number, dur: number, vol: number) {
  const c = getCtx()
  for (let i = 0; i < 3; i++) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = baseFreq + i * 150 + Math.random() * 80
    const gain = c.createGain()
    const delay = i * 0.025
    gain.gain.setValueAtTime(0, c.currentTime)
    gain.gain.linearRampToValueAtTime(vol * 0.4, c.currentTime + delay + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur)
    osc.connect(gain).connect(c.destination)
    osc.start(c.currentTime + delay)
    osc.stop(c.currentTime + delay + dur)
  }
}

function boom(freq: number, dur: number, vol: number) {
  const c = getCtx()
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(20, c.currentTime + dur)
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + dur)
}

const sounds: Record<string, () => void> = {
  // Dice shaking in cup: rapid rattling noise bursts
  shake() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        noise(0.04, 0.15, 3000 + Math.random() * 2000)
        tone(300 + Math.random() * 200, 0.03, 0.06, 'square')
      }, i * 60 + Math.random() * 30)
    }
    // Wooden cup thud
    setTimeout(() => boom(120, 0.12, 0.15), 400)
  },

  // Dice revealed: rolling settle sound
  reveal() {
    // Dice tumbling
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        noise(0.03, 0.1, 2000)
        tone(400 + i * 50, 0.04, 0.08, 'triangle')
      }, i * 80)
    }
    // Final settle tap
    setTimeout(() => {
      tone(800, 0.06, 0.12, 'sine')
      sparkle(1000, 0.15, 0.08)
    }, 350)
  },

  // Bid made: confident tap
  bid() {
    tone(600, 0.08, 0.12, 'sine')
    setTimeout(() => tone(750, 0.06, 0.1, 'sine'), 50)
    noise(0.03, 0.06, 1500)
  },

  // Challenge (開!): dramatic gong
  challenge() {
    // Gong strike
    boom(80, 0.5, 0.25)
    tone(180, 0.4, 0.2, 'sine')
    tone(360, 0.3, 0.1, 'sine')
    // Metallic shimmer
    setTimeout(() => {
      sparkle(600, 0.3, 0.12)
      noise(0.15, 0.12, 1200)
    }, 50)
    // Resonance decay
    setTimeout(() => {
      tone(175, 0.6, 0.08, 'sine')
      tone(350, 0.4, 0.05, 'sine')
    }, 200)
  },

  // Punishment: ominous drum
  punishment() {
    boom(60, 0.4, 0.3)
    noise(0.1, 0.15, 600)
    setTimeout(() => {
      boom(50, 0.5, 0.2)
      tone(100, 0.2, 0.1, 'sawtooth')
    }, 200)
    setTimeout(() => boom(40, 0.6, 0.15), 450)
  },
}

export function useAudio() {
  function init() {
    // Pre-warm audio context on first user interaction
    getCtx()
  }

  function play(name: string) {
    sounds[name]?.()
  }

  function stop(_name: string) {
    // Synthesized sounds auto-stop, no-op
  }

  return { init, play, stop }
}
