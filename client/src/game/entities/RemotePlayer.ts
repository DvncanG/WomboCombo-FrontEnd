import type { PlayerState } from "../../lib/network/messages";
import { NETWORK } from "../config/physics";

interface Snapshot {
  timestamp: number;
  x: number;
  y: number;
  state: string;
  facing: "left" | "right";
}

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 32;
const REMOTE_COLOR = 0x44cc66;

/**
 * RemotePlayer: sprite controlled by server data, rendered with interpolation.
 * Phase 2 implementation.
 */
export class RemotePlayer {
  sprite: Phaser.Physics.Arcade.Sprite;
  playerId: string;
  private buffer: Snapshot[] = [];

  constructor(scene: Phaser.Scene, playerId: string, x: number, y: number) {
    this.playerId = playerId;

    if (!scene.textures.exists("remote_placeholder")) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(REMOTE_COLOR, 1);
      gfx.fillRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(14, 6, 6, 6);
      gfx.generateTexture("remote_placeholder", PLAYER_WIDTH, PLAYER_HEIGHT);
      gfx.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, "remote_placeholder");
    this.sprite.body!.allowGravity = false;
  }

  /** Push a new server snapshot into the interpolation buffer */
  pushState(state: PlayerState): void {
    this.buffer.push({
      timestamp: Date.now(),
      x: state.x,
      y: state.y,
      state: state.state,
      facing: state.facing,
    });

    // Keep buffer small
    if (this.buffer.length > 10) {
      this.buffer.shift();
    }
  }

  /** Interpolate position each frame */
  update(): void {
    const renderTime = Date.now() - NETWORK.INTERPOLATION_DELAY;

    // Find two snapshots to interpolate between
    let prev: Snapshot | null = null;
    let next: Snapshot | null = null;

    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (
        this.buffer[i].timestamp <= renderTime &&
        this.buffer[i + 1].timestamp >= renderTime
      ) {
        prev = this.buffer[i];
        next = this.buffer[i + 1];
        break;
      }
    }

    if (prev && next) {
      const range = next.timestamp - prev.timestamp;
      const t = range > 0 ? (renderTime - prev.timestamp) / range : 0;
      this.sprite.setPosition(
        prev.x + (next.x - prev.x) * t,
        prev.y + (next.y - prev.y) * t
      );
      this.sprite.setFlipX(next.facing === "left");
    } else if (this.buffer.length > 0) {
      // Extrapolate to latest known position
      const latest = this.buffer[this.buffer.length - 1];
      this.sprite.setPosition(latest.x, latest.y);
      this.sprite.setFlipX(latest.facing === "left");
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
