// REAL recorded paper only. PCM inputs are decoded from the credited CC0
// Freesound HQ previews, not generated noise or a synthesized effect.
const fs = require('node:fs');
const path = require('node:path');
const rate = 48000, duration = 4.6;
function source(name) {
  const bytes = fs.readFileSync(path.join(__dirname, 'sources', name + '.pcm'));
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
}
const folding = source('folding'), rustle = source('rustle'), unfold = source('unfold');
function preview(name, scale, airGain) {
  const mix = new Float64Array(Math.round(rate * duration));
  function cue(samples, from, span, at, length, peak, lowpass = 6500, highpass = 180) {
    const frames = Math.round(length * rate), fragment = new Float64Array(frames);
    const lpAlpha = 1 - Math.exp(-2 * Math.PI * lowpass / rate);
    const hpAlpha = Math.exp(-2 * Math.PI * highpass / rate);
    let low = 0, high = 0, previous = 0, max = 0;
    for (let frame = 0; frame < frames; frame++) {
      const index = (from + frame / frames * span) * rate, first = Math.floor(index), fraction = index - first;
      const value = (samples[first] || 0) * (1 - fraction) + (samples[first + 1] || 0) * fraction;
      low += lpAlpha * (value - low);
      high = hpAlpha * (high + low - previous); previous = low;
      // No abrupt waveform cuts. Gentle 12 ms attack, 35 ms release.
      const envelope = Math.min(1, frame / (rate * 0.012), (frames - frame - 1) / (rate * 0.035));
      fragment[frame] = high * Math.max(0, envelope);
      max = Math.max(max, Math.abs(fragment[frame]));
    }
    const start = Math.round(at * rate);
    // Round off isolated recording spikes rather than raising peak volume.
    // This increases paper detail relative to clicks without clipping.
    for (let frame = 0; frame < frames && start + frame < mix.length; frame++) {
      const softened = max ? Math.tanh(fragment[frame] / max * 4) / Math.tanh(4) : 0;
      mix[start + frame] += softened * peak * scale;
    }
  }
  // Six original creases. Separate quiet fragments avoid an identical repeated
  // sample; deliberately exclude the recording's loud handling peaks.
  [0.55, 0.81, 1.075, 1.33, 1.585, 1.845].forEach((at, index) => {
    const starts = [0.12, 0.69, 1.61, 3.13, 4.08, 9.95];
    cue(folding, starts[index], 0.19, at, 0.16, 0.105 * [0.92, 1, 0.88, 0.95, 0.82, 0.9][index]);
  });
  // Air remains recorded paper, thinned and quiet, with no continuous bed.
  cue(rustle, 0.24, 0.6, 2.10, 1.25, airGain, 3400, 1100);
  cue(rustle, 0.33, 0.34, 2.35, 0.8, airGain * 0.45, 4200, 1400);
  cue(unfold, 1.57, 0.28, 3.68, 0.18, 0.075, 5500, 350);
  // A soft short handling/contact fragment; no low-end impact or chime.
  cue(folding, 0.29, 0.12, 3.84, 0.12, 0.047, 4200, 600);
  let max = 0, squares = 0;
  for (const value of mix) { max = Math.max(max, Math.abs(value)); squares += value * value; }
  const wav = Buffer.alloc(44 + mix.length * 4);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(mix.length * 4, 40);
  for (let frame = 0; frame < mix.length; frame++) {
    const value = Math.round(Math.max(-1, Math.min(1, mix[frame])) * 32767);
    wav.writeInt16LE(value, 44 + frame * 4); wav.writeInt16LE(value, 46 + frame * 4);
  }
  fs.writeFileSync(path.join(__dirname, name + '.wav'), wav);
  return { name, duration, sampleRate: rate, stereo: true, peak: max, peakDbfs: 20 * Math.log10(max), rmsDbfs: 20 * Math.log10(Math.sqrt(squares / mix.length)), clippedSamples: [...mix].filter(value => Math.abs(value) >= 1).length };
}
const report = [preview('paper-opening-A-minimal', 1.35, 0.022), preview('paper-opening-B-rustle', 1.85, 0.040)];
fs.writeFileSync(path.join(__dirname, 'levels.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
