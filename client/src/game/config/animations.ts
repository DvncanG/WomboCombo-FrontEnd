/**
 * Animation definitions — to be populated when real spritesheets arrive.
 * Phase 3+ implementation.
 */

export interface AnimationDef {
  key: string;
  spritesheet: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number; // -1 = loop
}

export const PLAYER_ANIMATIONS: AnimationDef[] = [
  // { key: "player_idle", spritesheet: "player", startFrame: 0, endFrame: 3, frameRate: 6, repeat: -1 },
  // { key: "player_run", spritesheet: "player", startFrame: 4, endFrame: 9, frameRate: 10, repeat: -1 },
  // { key: "player_jump", spritesheet: "player", startFrame: 10, endFrame: 12, frameRate: 8, repeat: 0 },
];

export const ENEMY_ANIMATIONS: Record<string, AnimationDef[]> = {
  // slime: [...],
  // bat: [...],
};
