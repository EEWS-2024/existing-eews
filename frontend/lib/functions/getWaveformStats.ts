export const getWaveformStats = (waveforms: any[]) => {
  if (waveforms.length == 0) return [0, 0];
  waveforms = waveforms.map((waveform) => waveform.value);
  const mean = Math.round((waveforms.reduce((a, b) => Math.abs(a) + Math.abs(b)) / waveforms.length) * 1000) / 1000;
  const max = waveforms.reduce((a, b) => Math.max(Math.abs(a), Math.abs(b)), 0);
  return [mean, max];
};
