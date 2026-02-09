import type { EnemyState } from "../../lib/network/messages";

const ENEMY_COLORS: Record<string, number> = {
  slime: 0x44bb44,
  bat: 0x8844cc,
  skeleton: 0xcccccc,
};

/**
 * Enemy: server-authoritative sprite with interpolation.
 * Phase 3 implementation.
 */
export class Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  enemyId: string;
  enemyType: string;

  constructor(
    scene: Phaser.Scene,
    enemyId: string,
    enemyType: string,
    x: number,
    y: number
  ) {
    this.enemyId = enemyId;
    this.enemyType = enemyType;

    const texKey = `enemy_${enemyType}`;
    if (!scene.textures.exists(texKey)) {
      const color = ENEMY_COLORS[enemyType] ?? 0xff4444;
      const gfx = scene.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, 0, 28, 28);
      gfx.generateTexture(texKey, 28, 28);
      gfx.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, texKey);
    this.sprite.body!.allowGravity = false;
  }

  updateFromServer(_state: EnemyState): void {
    // TODO: interpolate position, update visual state
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
