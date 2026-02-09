import { PHYSICS } from "../config/physics";
import type { InputManager } from "../systems/InputManager";

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 32;
const PLAYER_COLOR = 0x4488ff;

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  facing: "left" | "right" = "right";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create placeholder texture if it doesn't exist
    if (!scene.textures.exists("player_placeholder")) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(PLAYER_COLOR, 1);
      gfx.fillRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
      // Eyes to show facing direction
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(14, 6, 6, 6);
      gfx.fillRect(14, 16, 6, 4);
      gfx.generateTexture("player_placeholder", PLAYER_WIDTH, PLAYER_HEIGHT);
      gfx.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, "player_placeholder");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.sprite.setBounce(0);
    this.sprite.setMaxVelocity(PHYSICS.PLAYER_SPEED, PHYSICS.PLAYER_MAX_FALL);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(PHYSICS.GRAVITY);
  }

  update(input: InputManager): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    // Horizontal movement
    if (input.left) {
      this.sprite.setVelocityX(-PHYSICS.PLAYER_SPEED);
      this.facing = "left";
      this.sprite.setFlipX(true);
    } else if (input.right) {
      this.sprite.setVelocityX(PHYSICS.PLAYER_SPEED);
      this.facing = "right";
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    // Jump
    if (input.jump && onGround) {
      this.sprite.setVelocityY(PHYSICS.PLAYER_JUMP);
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
