export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Placeholder: no assets to load yet.
    // Future: load spritesheets, tilemaps, audio here.
    console.log("[BootScene] Preloading assets...");
  }

  create(): void {
    console.log("[BootScene] Assets loaded. Starting GameScene.");
    this.scene.start("GameScene");
  }
}
