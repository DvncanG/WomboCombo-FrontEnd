class SettingsStore {
  musicVolume = $state(0.5);
  sfxVolume = $state(0.7);
  playerName = $state("Player");
  showFps = $state(false);
}

export const settings = new SettingsStore();
