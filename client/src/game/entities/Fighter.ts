import { PHYSICS } from "../config/physics";
import type { FighterConfig, AttackData } from "../config/fighters";
import type { FighterInput } from "../systems/FighterInputManager";

export type FighterState =
  | "idle"
  | "walking"
  | "running"
  | "jumping"
  | "falling"
  | "double_jumping"
  | "crouching"
  | "attack_startup"
  | "attack_active"
  | "attack_recovery"
  | "hitstun"
  | "launched"
  | "ko";

// Extra head space above the character art (in native 128px units)
const HEAD_PAD_PX = 6;

export class Fighter {
  sprite: Phaser.Physics.Arcade.Sprite;
  config: FighterConfig;
  playerIndex: number;
  state: FighterState = "idle";
  facing: "left" | "right";

  // HP (Street Fighter style: starts at 100, goes to 0)
  hp: number;
  readonly maxHp: number;

  // Combat
  currentAttack: AttackData | null = null;
  currentAttackType = "";
  attackTimer = 0;
  hasHitThisAttack = false;
  hitboxRect: Phaser.GameObjects.Rectangle | null = null;
  canCancelAttack = false;

  // Combo
  comboCount = 0;
  lastHitTime = 0;

  // Movement
  airJumpsLeft = 1;
  fastFalling = false;

  // Hitstun
  hitstunTimer = 0;

  // Brief invuln after taking a hit (prevents repeated hits in same frame)
  invulnTimer = 0;

  spawnX: number;
  spawnY: number;

  private scene: Phaser.Scene;
  private runTimer = 0;
  private wasLeft = false;
  private wasRight = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: FighterConfig,
    playerIndex: number,
  ) {
    this.scene = scene;
    this.config = config;
    this.playerIndex = playerIndex;
    this.spawnX = x;
    this.spawnY = y;
    this.facing = playerIndex === 0 ? "right" : "left";
    this.hp = PHYSICS.FIGHTER_HP;
    this.maxHp = PHYSICS.FIGHTER_HP;

    this.sprite = scene.physics.add.sprite(x, y, config.anim.initTexture, 0);
    this.sprite.setScale(config.scale ?? 1.5);

    // Body aligned to actual character art within the 128px sprite frame.
    // spriteFootY = fraction of frame height where drawn feet are.
    // Body bottom = feet; body top = just below head.
    const scale = config.scale ?? 1.5;
    const displayW = 128 * scale;
    const displayH = 128 * scale;
    const footPx  = (config.spriteFootY ?? 0.62) * displayH; // from sprite top
    const charH   = footPx - HEAD_PAD_PX * scale;            // drawn character height
    const bh      = Math.round(charH * 0.94);
    const bw      = Math.round(charH * 0.44);
    const offsetX = (displayW - bw) / 2;
    const offsetY = footPx - bh;   // body bottom sits exactly at feet
    this.sprite.setSize(bw, bh);
    this.sprite.setOffset(offsetX, offsetY);
    this.sprite.setBounce(0);
    this.sprite.setMaxVelocity(config.speed, PHYSICS.PLAYER_MAX_FALL);
    this.sprite.setFlipX(this.facing === "left");

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(PHYSICS.GRAVITY);
    body.setCollideWorldBounds(true);  // wall + floor from world bounds

    (this.sprite as any).fighter = this;

    this.playAnim("idle");
  }

  private playAnim(state: string): void {
    const key = (this.config.anim as any)[state] ?? (this.config.anim as any)["idle"];
    if (!key) return;
    if (this.sprite.anims.currentAnim?.key === key && this.sprite.anims.isPlaying) return;
    this.sprite.play(key);
  }

  update(input: FighterInput, delta: number): void {
    if (this.state === "ko") return;

    if (this.invulnTimer > 0) this.invulnTimer -= delta;

    if (this.state === "hitstun" || this.state === "launched") {
      this.hitstunTimer -= delta;
      if (this.hitstunTimer <= 0) {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        this.state = (body.blocked.down || body.touching.down) ? "idle" : "falling";
      }
      this.syncAnim();
      return;
    }

    if (
      this.state === "attack_startup" ||
      this.state === "attack_active" ||
      this.state === "attack_recovery"
    ) {
      this.advanceAttack(delta, input);
      this.syncAnim();
      return;
    }

    this.handleMovement(input, delta);
    this.handleJump(input);
    this.handleFastFall(input);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    let attackStarted = false;
    if (input.special) {
      attackStarted = true;
      this.startAttack("special", onGround);
    } else if (input.heavyAttack) {
      attackStarted = true;
      this.startAttack(onGround ? "heavy" : "airHeavy", onGround);
    } else if (input.lightAttack) {
      attackStarted = true;
      this.startAttack(onGround ? "light" : "airLight", onGround);
    }

    if (input.left && !input.right) {
      this.facing = "left";
      this.sprite.setFlipX(true);
    } else if (input.right && !input.left) {
      this.facing = "right";
      this.sprite.setFlipX(false);
    }

    const isAttacking = attackStarted;

    if (onGround) {
      this.airJumpsLeft = 1;
      this.fastFalling = false;
      this.sprite.setMaxVelocity(this.config.speed, PHYSICS.PLAYER_MAX_FALL);
      if (!isAttacking) {
        if (input.crouch) {
          this.state = "crouching";
        } else if (input.left || input.right) {
          this.state = this.runTimer > 300 ? "running" : "walking";
        } else {
          this.state = "idle";
        }
      }
    } else if (
      !isAttacking &&
      this.state !== "jumping" &&
      this.state !== "double_jumping"
    ) {
      this.state = "falling";
    }

    this.syncAnim();
  }

  private handleMovement(input: FighterInput, delta: number): void {
    if (input.left && !input.right) {
      if (this.wasLeft) this.runTimer += delta; else this.runTimer = 0;
      this.wasLeft = true; this.wasRight = false;
      const spd = this.runTimer > 300 ? this.config.speed * 1.35 : this.config.speed;
      this.sprite.setVelocityX(-spd);
    } else if (input.right && !input.left) {
      if (this.wasRight) this.runTimer += delta; else this.runTimer = 0;
      this.wasRight = true; this.wasLeft = false;
      const spd = this.runTimer > 300 ? this.config.speed * 1.35 : this.config.speed;
      this.sprite.setVelocityX(spd);
    } else {
      this.runTimer = 0;
      this.wasLeft = false;
      this.wasRight = false;
      const vx = this.sprite.body!.velocity.x;
      this.sprite.setVelocityX(vx * 0.75);
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (input.crouch && (body.blocked.down || body.touching.down)) {
      this.sprite.setVelocityX(this.sprite.body!.velocity.x * 0.6);
    }
  }

  private handleJump(input: FighterInput): void {
    if (!input.jumpPressed) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      this.sprite.setVelocityY(this.config.jumpForce);
      this.state = "jumping";
      this.fastFalling = false;
      this.runTimer = 0;
    } else if (this.airJumpsLeft > 0) {
      this.sprite.setVelocityY(this.config.doubleJumpForce);
      this.airJumpsLeft--;
      this.state = "double_jumping";
      this.fastFalling = false;
    }
  }

  private handleFastFall(input: FighterInput): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (!onGround && input.crouch && !this.fastFalling && body.velocity.y > 50) {
      this.fastFalling = true;
      this.sprite.setVelocityY(PHYSICS.FAST_FALL_SPEED);
      this.sprite.setMaxVelocity(this.config.speed, PHYSICS.FAST_FALL_SPEED);
    }
    if (onGround) {
      this.fastFalling = false;
      this.sprite.setMaxVelocity(this.config.speed, PHYSICS.PLAYER_MAX_FALL);
    }
  }

  private startAttack(type: string, onGround: boolean): void {
    const attack = (this.config.attacks as any)[type] as AttackData | undefined;
    if (!attack) return;

    this.currentAttack = attack;
    this.currentAttackType = type;
    this.attackTimer = 0;
    this.hasHitThisAttack = false;
    this.canCancelAttack = false;
    this.state = "attack_startup";

    if (onGround) {
      this.sprite.setVelocityX(this.sprite.body!.velocity.x * 0.2);
    }

    // Phantom teleport dash
    if (type === "special" && this.config.id === "phantom") {
      const dir = this.facing === "right" ? 1 : -1;
      this.sprite.x += 80 * dir;
    }
  }

  private advanceAttack(delta: number, input: FighterInput): void {
    if (!this.currentAttack) return;
    this.attackTimer += delta;
    const { startup, active, recovery } = this.currentAttack;

    // Cancel light into heavy during startup window
    if (
      this.currentAttackType === "light" &&
      this.attackTimer > startup * 0.5 &&
      this.attackTimer < startup &&
      input.heavyAttack
    ) {
      this.canCancelAttack = true;
      this.startAttack("heavy", true);
      return;
    }

    if (this.attackTimer < startup) {
      this.state = "attack_startup";
    } else if (this.attackTimer < startup + active) {
      this.state = "attack_active";
      if (!this.hitboxRect) this.createHitbox();
      this.updateHitboxPosition();
    } else if (this.attackTimer < startup + active + recovery) {
      this.state = "attack_recovery";
      this.destroyHitbox();
    } else {
      this.destroyHitbox();
      this.currentAttack = null;
      this.currentAttackType = "";
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      this.state = (body.blocked.down || body.touching.down) ? "idle" : "falling";
    }
  }

  private createHitbox(): void {
    if (!this.currentAttack || this.hitboxRect) return;
    const { hitboxW, hitboxH } = this.currentAttack;
    const scale = this.config.scale ?? 1.5;
    // Invisible — purely logical for collision detection
    this.hitboxRect = this.scene.add.rectangle(0, 0, hitboxW * scale, hitboxH * scale, 0, 0);
    this.hitboxRect.setDepth(10);
  }

  private updateHitboxPosition(): void {
    if (!this.hitboxRect || !this.currentAttack) return;
    const { hitboxOffsetX, hitboxOffsetY } = this.currentAttack;
    const dir = this.facing === "right" ? 1 : -1;
    const scale = this.config.scale ?? 1.5;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const cx = body.x + body.halfWidth;
    const cy = body.y + body.halfHeight;
    this.hitboxRect.x = cx + hitboxOffsetX * dir * scale;
    this.hitboxRect.y = cy + hitboxOffsetY * scale;
  }

  destroyHitbox(): void {
    if (this.hitboxRect) {
      this.hitboxRect.destroy();
      this.hitboxRect = null;
    }
  }

  getHitboxBounds(): Phaser.Geom.Rectangle | null {
    if (!this.hitboxRect || this.state !== "attack_active" || !this.currentAttack) return null;
    const { hitboxW, hitboxH, hitboxOffsetX, hitboxOffsetY } = this.currentAttack;
    const dir = this.facing === "right" ? 1 : -1;
    const scale = this.config.scale ?? 1.5;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const cx = body.x + body.halfWidth;
    const cy = body.y + body.halfHeight;
    const hw = hitboxW * scale;
    const hh = hitboxH * scale;
    return new Phaser.Geom.Rectangle(
      cx + hitboxOffsetX * dir * scale - hw / 2,
      cy + hitboxOffsetY * scale - hh / 2,
      hw, hh
    );
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }

  takeHit(attack: AttackData, attackerFacing: "left" | "right"): void {
    if (this.invulnTimer > 0 || this.state === "ko") return;

    this.hp = Math.max(0, this.hp - attack.damage);

    // Street Fighter knockback — fixed force, no % scaling
    const knockbackForce = attack.knockback * PHYSICS.KNOCKBACK_MULTIPLIER / this.config.weight;
    const angleRad = (attack.angle * Math.PI) / 180;
    const dir = attackerFacing === "right" ? 1 : -1;

    // Cap velocity so characters don't fly off stage
    const vx = Phaser.Math.Clamp(Math.cos(angleRad) * knockbackForce * dir, -320, 320);
    const vy = Phaser.Math.Clamp(-Math.sin(angleRad) * knockbackForce, -380, 200);

    this.sprite.setVelocity(vx, vy);

    this.hitstunTimer = PHYSICS.HITSTUN_BASE_MS + attack.damage * 8;
    this.invulnTimer = 80; // brief window to prevent multi-hit in same frame

    this.state = Math.abs(vy) > 200 ? "launched" : "hitstun";

    this.destroyHitbox();
    this.currentAttack = null;
    this.currentAttackType = "";
    this.playAnim("hurt");

    if (this.hp <= 0) this.onKO();
  }

  onKO(): void {
    this.hp = 0;
    this.state = "ko";
    this.sprite.setVelocity(0, 0);
    this.destroyHitbox();
    this.currentAttack = null;
    this.currentAttackType = "";
    this.playAnim("dead");
  }

  /** Reset fighter for the start of a new round */
  resetForRound(x: number, y: number): void {
    this.hp = this.maxHp;
    this.state = "idle";
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setVisible(true);
    this.sprite.setAlpha(1);
    this.airJumpsLeft = 1;
    this.fastFalling = false;
    this.hitstunTimer = 0;
    this.invulnTimer = 0;
    this.currentAttack = null;
    this.currentAttackType = "";
    this.hasHitThisAttack = false;
    this.comboCount = 0;
    this.runTimer = 0;
    this.wasLeft = false;
    this.wasRight = false;
    this.facing = this.playerIndex === 0 ? "right" : "left";
    this.sprite.setFlipX(this.facing === "left");
    this.destroyHitbox();
    this.playAnim("idle");
  }

  private syncAnim(): void {
    switch (this.state) {
      case "idle":           this.playAnim("idle"); break;
      case "walking":        this.playAnim("walk"); break;
      case "running":        this.playAnim("run");  break;
      case "crouching":      this.playAnim("crouch"); break;
      case "jumping":
      case "double_jumping": this.playAnim("jump"); break;
      case "falling":        this.playAnim("fall"); break;
      case "attack_startup":
      case "attack_active":
      case "attack_recovery": this.playAnim(this.getAttackAnimName()); break;
      case "hitstun":
      case "launched":       this.playAnim("hurt"); break;
      case "ko":             this.playAnim("dead"); break;
    }
  }

  private getAttackAnimName(): string {
    switch (this.currentAttackType) {
      case "heavy":
      case "airHeavy": return "heavy";
      case "special":
        if (this.config.anim.shot) return "shot";          // e.g. Blaze gun shot
        return this.config.anim.special ? "special" : "attack";
      default:         return "attack";
    }
  }

  destroy(): void {
    this.destroyHitbox();
    this.sprite.destroy();
  }
}
