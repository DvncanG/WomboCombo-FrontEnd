import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { ArenaScene } from "./scenes/ArenaScene";
import { PHYSICS } from "./config/physics";

let gameInstance: Phaser.Game | null = null;

export interface GameLaunchData {
  p1Character: string;
  p2Character: string;
  isCPU: boolean;
  stocks?: number;
}

/** Store scene data to pass when ArenaScene starts */
let pendingSceneData: GameLaunchData | null = null;

export function setSceneData(data: GameLaunchData): void {
  pendingSceneData = data;
}

export function getSceneData(): GameLaunchData | null {
  return pendingSceneData;
}

/** Create and mount the Phaser game into a container element */
export function createGame(container: HTMLElement): Phaser.Game {
  if (gameInstance) {
    console.warn("[PhaserGame] Game already exists, destroying first.");
    destroyGame();
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: container,
    width: PHYSICS.ARENA_WIDTH,
    height: PHYSICS.ARENA_HEIGHT,
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene, ArenaScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false,
      roundPixels: true,
    },
    backgroundColor: "#0a0a1a",
  };

  gameInstance = new Phaser.Game(config);
  console.log("[PhaserGame] Game created.");
  return gameInstance;
}

/** Cleanly destroy the Phaser game */
export function destroyGame(): void {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
    pendingSceneData = null;
    console.log("[PhaserGame] Game destroyed.");
  }
}

export function getGame(): Phaser.Game | null {
  return gameInstance;
}
