/**
 * Visual configuration for enemy types.
 * Maps enemy type strings from the server to rendering config.
 */

export interface EnemyVisualConfig {
  color: number;
  width: number;
  height: number;
  spritesheet?: string;
}

export const ENEMY_VISUALS: Record<string, EnemyVisualConfig> = {
  slime: { color: 0x44bb44, width: 28, height: 20 },
  bat: { color: 0x8844cc, width: 24, height: 24 },
  skeleton: { color: 0xcccccc, width: 24, height: 32 },
  goblin: { color: 0xcc8844, width: 22, height: 28 },
};
