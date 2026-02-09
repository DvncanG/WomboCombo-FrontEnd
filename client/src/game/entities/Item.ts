const ITEM_COLORS: Record<string, number> = {
  health_potion: 0xff4466,
  shield: 0x4488ff,
  speed_boost: 0x44ffcc,
};

/**
 * Item: server-spawned pickup.
 * Phase 3 implementation.
 */
export class Item {
  sprite: Phaser.GameObjects.Sprite;
  itemId: string;
  itemType: string;

  constructor(
    scene: Phaser.Scene,
    itemId: string,
    itemType: string,
    x: number,
    y: number
  ) {
    this.itemId = itemId;
    this.itemType = itemType;

    const texKey = `item_${itemType}`;
    if (!scene.textures.exists(texKey)) {
      const color = ITEM_COLORS[itemType] ?? 0xffcc00;
      const gfx = scene.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, 0, 16, 16);
      gfx.generateTexture(texKey, 16, 16);
      gfx.destroy();
    }

    this.sprite = scene.add.sprite(x, y, texKey);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
