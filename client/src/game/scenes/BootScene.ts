import { getSceneData } from "../PhaserGame";

const FRAME_W = 128;
const FRAME_H = 128;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Street backgrounds
    this.load.image("bg_city1", "assets/backgrounds/city1.png");
    this.load.image("bg_city2", "assets/backgrounds/city2.png");
    this.load.image("bg_city3", "assets/backgrounds/city3.png");
    this.load.image("bg_city4", "assets/backgrounds/city4.png");

    // ── Gangster 1 (Blaze) ───────────────────────────────────────────
    this.load.spritesheet("g1_idle",     "assets/sprites/gangsters/Gangsters_1/Idle.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_idle2",    "assets/sprites/gangsters/Gangsters_1/Idle_2.png",   { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_walk",     "assets/sprites/gangsters/Gangsters_1/Walk.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_run",      "assets/sprites/gangsters/Gangsters_1/Run.png",      { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_jump",     "assets/sprites/gangsters/Gangsters_1/Jump.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_attack",   "assets/sprites/gangsters/Gangsters_1/Attack_1.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_shot",     "assets/sprites/gangsters/Gangsters_1/Shot.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_recharge", "assets/sprites/gangsters/Gangsters_1/Recharge.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_hurt",     "assets/sprites/gangsters/Gangsters_1/Hurt.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g1_dead",     "assets/sprites/gangsters/Gangsters_1/Dead.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // ── Gangster 2 (Phantom) ─────────────────────────────────────────
    this.load.spritesheet("g2_idle",    "assets/sprites/gangsters/Gangsters_2/Idle.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_idle2",   "assets/sprites/gangsters/Gangsters_2/Idle_2.png",   { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_walk",    "assets/sprites/gangsters/Gangsters_2/Walk.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_run",     "assets/sprites/gangsters/Gangsters_2/Run.png",      { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_jump",    "assets/sprites/gangsters/Gangsters_2/Jump.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_attack1", "assets/sprites/gangsters/Gangsters_2/Attack_1.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_attack2", "assets/sprites/gangsters/Gangsters_2/Attack_2.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_attack3", "assets/sprites/gangsters/Gangsters_2/Attack_3.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_hurt",    "assets/sprites/gangsters/Gangsters_2/Hurt.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g2_dead",    "assets/sprites/gangsters/Gangsters_2/Dead.png",     { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // ── Gangster 3 (Titan) ───────────────────────────────────────────
    this.load.spritesheet("g3_idle",   "assets/sprites/gangsters/Gangsters_3/Idle.png",   { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g3_idle2",  "assets/sprites/gangsters/Gangsters_3/Idle_2.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g3_walk",   "assets/sprites/gangsters/Gangsters_3/Walk.png",   { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g3_run",    "assets/sprites/gangsters/Gangsters_3/Run.png",    { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g3_jump",   "assets/sprites/gangsters/Gangsters_3/Jump.png",   { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g3_attack", "assets/sprites/gangsters/Gangsters_3/Attack.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g3_hurt",   "assets/sprites/gangsters/Gangsters_3/Hurt.png",   { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("g3_dead",   "assets/sprites/gangsters/Gangsters_3/Dead.png",   { frameWidth: FRAME_W, frameHeight: FRAME_H });
  }

  create(): void {
    this.createAnimations();

    const sceneData = getSceneData();
    if (sceneData) {
      this.scene.start("ArenaScene", sceneData);
    } else {
      this.scene.start("ArenaScene", { p1Character: "blaze", p2Character: "titan", isCPU: true });
    }
  }

  private createAnimations(): void {
    const a = this.anims;

    // ── GANGSTER 1 (Blaze) ───────────────────────────────────────────
    a.create({ key: "blaze_idle",     frames: a.generateFrameNumbers("g1_idle",     { start: 0, end: 5  }), frameRate: 8,  repeat: -1 });
    a.create({ key: "blaze_crouch",   frames: a.generateFrameNumbers("g1_idle2",    { start: 0, end: 10 }), frameRate: 8,  repeat: -1 });
    a.create({ key: "blaze_walk",     frames: a.generateFrameNumbers("g1_walk",     { start: 0, end: 9  }), frameRate: 12, repeat: -1 });
    a.create({ key: "blaze_run",      frames: a.generateFrameNumbers("g1_run",      { start: 0, end: 9  }), frameRate: 14, repeat: -1 });
    a.create({ key: "blaze_jump",     frames: a.generateFrameNumbers("g1_jump",     { start: 0, end: 9  }), frameRate: 12, repeat: 0  });
    a.create({ key: "blaze_fall",     frames: a.generateFrameNumbers("g1_jump",     { start: 5, end: 9  }), frameRate: 8,  repeat: -1 });
    a.create({ key: "blaze_attack",   frames: a.generateFrameNumbers("g1_attack",   { start: 0, end: 2  }), frameRate: 14, repeat: 0  });
    a.create({ key: "blaze_heavy",    frames: a.generateFrameNumbers("g1_attack",   { start: 0, end: 2  }), frameRate: 8,  repeat: 0  });
    a.create({ key: "blaze_shot",     frames: a.generateFrameNumbers("g1_shot",     { start: 0, end: 3  }), frameRate: 14, repeat: 0  });
    a.create({ key: "blaze_recharge", frames: a.generateFrameNumbers("g1_recharge", { start: 0, end: 16 }), frameRate: 14, repeat: 0  });
    a.create({ key: "blaze_hurt",     frames: a.generateFrameNumbers("g1_hurt",     { start: 0, end: 4  }), frameRate: 10, repeat: 0  });
    a.create({ key: "blaze_dead",     frames: a.generateFrameNumbers("g1_dead",     { start: 0, end: 4  }), frameRate: 8,  repeat: 0  });

    // ── GANGSTER 2 (Phantom) ─────────────────────────────────────────
    a.create({ key: "phantom_idle",    frames: a.generateFrameNumbers("g2_idle",    { start: 0, end: 6  }), frameRate: 8,  repeat: -1 });
    a.create({ key: "phantom_crouch",  frames: a.generateFrameNumbers("g2_idle2",   { start: 0, end: 12 }), frameRate: 8,  repeat: -1 });
    a.create({ key: "phantom_walk",    frames: a.generateFrameNumbers("g2_walk",    { start: 0, end: 9  }), frameRate: 12, repeat: -1 });
    a.create({ key: "phantom_run",     frames: a.generateFrameNumbers("g2_run",     { start: 0, end: 9  }), frameRate: 16, repeat: -1 });
    a.create({ key: "phantom_jump",    frames: a.generateFrameNumbers("g2_jump",    { start: 0, end: 9  }), frameRate: 12, repeat: 0  });
    a.create({ key: "phantom_fall",    frames: a.generateFrameNumbers("g2_jump",    { start: 5, end: 9  }), frameRate: 8,  repeat: -1 });
    a.create({ key: "phantom_attack",  frames: a.generateFrameNumbers("g2_attack1", { start: 0, end: 5  }), frameRate: 16, repeat: 0  });
    a.create({ key: "phantom_light2", frames: a.generateFrameNumbers("g2_attack2", { start: 0, end: 3  }), frameRate: 18, repeat: 0  });
    a.create({ key: "phantom_light3", frames: a.generateFrameNumbers("g2_attack3", { start: 0, end: 5  }), frameRate: 18, repeat: 0  });
    a.create({ key: "phantom_heavy",   frames: a.generateFrameNumbers("g2_attack2", { start: 0, end: 3  }), frameRate: 12, repeat: 0  });
    a.create({ key: "phantom_special", frames: a.generateFrameNumbers("g2_attack3", { start: 0, end: 5  }), frameRate: 14, repeat: 0  });
    a.create({ key: "phantom_hurt",    frames: a.generateFrameNumbers("g2_hurt",    { start: 0, end: 3  }), frameRate: 10, repeat: 0  });
    a.create({ key: "phantom_dead",    frames: a.generateFrameNumbers("g2_dead",    { start: 0, end: 4  }), frameRate: 8,  repeat: 0  });

    // ── GANGSTER 3 (Titan) ───────────────────────────────────────────
    a.create({ key: "titan_idle",   frames: a.generateFrameNumbers("g3_idle",   { start: 0, end: 6  }), frameRate: 7,  repeat: -1 });
    a.create({ key: "titan_crouch", frames: a.generateFrameNumbers("g3_idle2",  { start: 0, end: 13 }), frameRate: 7,  repeat: -1 });
    a.create({ key: "titan_walk",   frames: a.generateFrameNumbers("g3_walk",   { start: 0, end: 9  }), frameRate: 10, repeat: -1 });
    a.create({ key: "titan_run",    frames: a.generateFrameNumbers("g3_run",    { start: 0, end: 9  }), frameRate: 12, repeat: -1 });
    a.create({ key: "titan_jump",   frames: a.generateFrameNumbers("g3_jump",   { start: 0, end: 9  }), frameRate: 10, repeat: 0  });
    a.create({ key: "titan_fall",   frames: a.generateFrameNumbers("g3_jump",   { start: 5, end: 9  }), frameRate: 7,  repeat: -1 });
    a.create({ key: "titan_attack", frames: a.generateFrameNumbers("g3_attack", { start: 0, end: 4  }), frameRate: 10, repeat: 0  });
    a.create({ key: "titan_heavy",  frames: a.generateFrameNumbers("g3_attack", { start: 0, end: 4  }), frameRate: 6,  repeat: 0  });
    a.create({ key: "titan_hurt",   frames: a.generateFrameNumbers("g3_hurt",   { start: 0, end: 3  }), frameRate: 10, repeat: 0  });
    a.create({ key: "titan_dead",   frames: a.generateFrameNumbers("g3_dead",   { start: 0, end: 4  }), frameRate: 8,  repeat: 0  });
  }
}
