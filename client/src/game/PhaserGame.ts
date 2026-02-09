import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

let gameInstance: Phaser.Game | null = null;

/** Create and mount the Phaser game into a container element */
export function createGame(container: HTMLElement): Phaser.Game {
  if (gameInstance) {
    console.warn("[PhaserGame] Game already exists, destroying first.");
    destroyGame();
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth,
    height: container.clientHeight,
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 }, // Gravity set per-body
        debug: import.meta.env.DEV,
      },
    },
    scene: [BootScene, GameScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false,
      roundPixels: true,
    },
    backgroundColor: "#1a1a2e",
  };

  gameInstance = new Phaser.Game(config);
  console.log("[PhaserGame] Game created.");
  return gameInstance;
}

/** Cleanly destroy the Phaser game — call when leaving the /game route */
export function destroyGame(): void {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
    console.log("[PhaserGame] Game destroyed.");
  }
}

export function getGame(): Phaser.Game | null {
  return gameInstance;
}
