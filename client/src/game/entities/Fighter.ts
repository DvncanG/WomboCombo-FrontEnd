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
  | "shielding"
  | "dodge"
  | "air_dodge"
  | "shield_broken"
  | "charging_smash"
  | "respawning"
  | "ko";

const HEAD_PAD_PX = 6;

export class Fighter {
  sprite: Phaser.Physics.Arcade.Sprite;
  config: FighterConfig;
  playerIndex: number;
  state: FighterState = "idle";
  facing: "left" | "right";

  // Damage % (Smash-style: starts at 0, goes up)
  damage = 0;
  stocks: number;

  // Combat
  currentAttack: AttackData | null = null;
  currentAttackType = "";
  attackTimer = 0;
  hasHitThisAttack = false;
  hitboxRect: Phaser.GameObjects.Rectangle | null = null;
  canCancelAttack = false;

  // Smash charge
  smashChargeTime = 0;
  isChargingSmash = false;

  // Combo
  comboCount = 0;
  lastHitTime = 0;

  // Movement
  airJumpsLeft: number;
  fastFalling = false;

  // Hitstun & hitlag
  hitstunTimer = 0;
  hitlagTimer = 0;
  hitlagFrozen = false;
  private savedVelocity = { x: 0, y: 0 };

  // Invulnerability
  invulnTimer = 0;
  respawnInvulnTimer = 0;

  // Shield
  shieldHp: number;
  shieldBrokenTimer = 0;
  private shieldCircle: Phaser.GameObjects.Ellipse | null = null;

  // Dodge
  dodgeTimer = 0;
  dodgeCooldown = 0;
  private dodgeDir = 0;

  // DI
  diX = 0;
  diY = 0;

  // Combo breaker (burst)
  burstCooldown = 0;
  burstJustFired = false;
  consecutiveHits = 0;

  // Light attack chain (Phantom 3-hit visual variety)
  lightComboStep = 0;
  lightComboTimer = 0;

  // Projectile visual (Blaze shot)
  private projectileSprite: Phaser.GameObjects.Ellipse | null = null;

  // Polish — visual juice
  private shadow: Phaser.GameObjects.Ellipse | null = null;
  private wasOnGround = true;
  private dustTimer = 0;
  private afterimageTimer = 0;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;

  // Spawn point
  spawnX: number;
  spawnY: number;

  // Running
  private scene: Phaser.Scene;
  private runTimer = 0;
  private wasLeft = false;
  private wasRight = false;

  // Respawn
  private respawnPlatform: Phaser.GameObjects.Rectangle | null = null;

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
    this.damage = 0;
    this.stocks = PHYSICS.STOCKS;
    this.shieldHp = PHYSICS.SHIELD_HP_MAX;
    this.airJumpsLeft = config.airJumps;

    this.sprite = scene.physics.add.sprite(x, y, config.anim.initTexture, 0);
    this.sprite.setScale(config.scale ?? 1.5);

    const scale = config.scale ?? 1.5;
    const displayH = 128 * scale;
    const footPx = (config.spriteFootY ?? 0.62) * displayH;
    const charH = footPx - HEAD_PAD_PX * scale;
    const bh = Math.round(charH * 0.94);
    const bw = Math.round(charH * 0.44);
    const offsetX = (128 * scale - bw) / 2;
    const offsetY = footPx - bh;
    this.sprite.setSize(bw, bh);
    this.sprite.setOffset(offsetX, offsetY);
    this.sprite.setBounce(0);
    this.sprite.setMaxVelocity(600, PHYSICS.PLAYER_MAX_FALL);
    this.sprite.setFlipX(this.facing === "left");

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(PHYSICS.GRAVITY);
    // Closed stage — solid floor + walls (Tekken/SF style)
    body.setCollideWorldBounds(true);

    (this.sprite as any).fighter = this;
    this.playAnim("idle");

    // Ground shadow
    this.shadow = scene.add.ellipse(x, PHYSICS.FLOOR_Y + 2, 50 * scale / 1.5, 14 * scale / 1.5, 0x000000, 0.25);
    this.shadow.setDepth(-1);
  }

  private playAnim(state: string): void {
    const key = (this.config.anim as any)[state] ?? (this.config.anim as any)["idle"];
    if (!key) return;
    if (this.sprite.anims.currentAnim?.key === key && this.sprite.anims.isPlaying) return;
    this.sprite.play(key);
  }

  // ── Main update ─────────────────────────────────────────────────────────
  update(input: FighterInput, delta: number): void {
    this.updateVisuals(delta);
    if (this.state === "ko" || this.state === "respawning") return;

    // Hitlag freeze
    if (this.hitlagTimer > 0) {
      this.hitlagTimer -= delta;
      if (this.hitlagTimer <= 0) {
        this.hitlagFrozen = false;
        this.sprite.setVelocity(this.savedVelocity.x, this.savedVelocity.y);
      }
      return;
    }

    // Timers
    if (this.invulnTimer > 0) this.invulnTimer -= delta;
    if (this.respawnInvulnTimer > 0) {
      this.respawnInvulnTimer -= delta;
      // Flash effect during respawn invuln
      this.sprite.setAlpha(Math.sin(Date.now() * 0.015) > 0 ? 1 : 0.3);
      if (this.respawnInvulnTimer <= 0) this.sprite.setAlpha(1);
    }
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;
    if (this.burstCooldown > 0) this.burstCooldown -= delta;
    if (this.lightComboTimer > 0) this.lightComboTimer -= delta;

    // Shield regen when not shielding
    if (this.state !== "shielding" && this.shieldHp < PHYSICS.SHIELD_HP_MAX) {
      this.shieldHp = Math.min(PHYSICS.SHIELD_HP_MAX, this.shieldHp + PHYSICS.SHIELD_REGEN_RATE * delta / 1000);
    }

    // Shield broken stun
    if (this.state === "shield_broken") {
      this.shieldBrokenTimer -= delta;
      if (this.shieldBrokenTimer <= 0) {
        this.state = "idle";
      }
      this.syncAnim();
      return;
    }

    // Dodge invulnerability
    if (this.state === "dodge" || this.state === "air_dodge") {
      this.dodgeTimer -= delta;
      this.sprite.setAlpha(0.35);
      if (this.state === "dodge") {
        this.sprite.setVelocityX(this.dodgeDir * PHYSICS.ROLL_SPEED);
      }
      if (this.dodgeTimer <= 0) {
        this.sprite.setAlpha(this.respawnInvulnTimer > 0 ? 0.5 : 1);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        this.state = (body.blocked.down || body.touching.down) ? "idle" : "falling";
      }
      this.syncAnim();
      return;
    }

    // Hitstun / launched
    if (this.state === "hitstun" || this.state === "launched") {
      this.hitstunTimer -= delta;

      // DI — allow slight angle adjustment during knockback
      if (input.left) this.diX = -1;
      else if (input.right) this.diX = 1;
      else this.diX = 0;
      if (input.jumpPressed) this.diY = -1;
      else if (input.crouch) this.diY = 1;
      else this.diY = 0;

      if (this.diX !== 0 || this.diY !== 0) {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.velocity.x += this.diX * PHYSICS.DI_INFLUENCE * Math.abs(body.velocity.x) * (delta / 16);
        body.velocity.y += this.diY * PHYSICS.DI_INFLUENCE * Math.abs(body.velocity.y) * (delta / 16) * 0.3;
      }

      // Combo breaker — press shield during hitstun to burst free
      if (input.shield && this.burstCooldown <= 0 && this.consecutiveHits >= 3) {
        this.burst();
        return;
      }

      if (this.hitstunTimer <= 0) {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const onG = body.blocked.down || body.touching.down;
        this.state = onG ? "idle" : "falling";
        this.consecutiveHits = 0;
        // Grant escape air jump after hitstun ends in the air
        if (!onG && this.airJumpsLeft < 1) {
          this.airJumpsLeft = 1;
        }
      }
      this.syncAnim();
      return;
    }

    // Smash charge
    if (this.state === "charging_smash") {
      this.smashChargeTime += delta;
      if (this.smashChargeTime >= PHYSICS.SMASH_CHARGE_MAX || !(input as any).heavyHeld) {
        this.releaseSmashAttack();
      }
      this.syncAnim();
      return;
    }

    // Attack states
    if (
      this.state === "attack_startup" ||
      this.state === "attack_active" ||
      this.state === "attack_recovery"
    ) {
      this.advanceAttack(delta, input);
      this.syncAnim();
      return;
    }

    // Shield
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    if (input.shield && onGround && this.shieldHp > 0 && this.state !== "shielding") {
      this.state = "shielding";
    }

    if (this.state === "shielding") {
      if (!input.shield || this.shieldHp <= 0) {
        this.destroyShield();
        if (this.shieldHp <= 0) {
          this.breakShield();
          return;
        }
        this.state = "idle";
      } else {
        this.shieldHp -= PHYSICS.SHIELD_DECAY_RATE * delta / 1000;
        this.sprite.setVelocityX(this.sprite.body!.velocity.x * 0.85);
        this.updateShieldVisual();

        // Dodge out of shield
        if ((input.left || input.right) && this.dodgeCooldown <= 0) {
          this.destroyShield();
          this.startDodge(input.left ? -1 : 1, false);
          return;
        }
        // Jump out of shield
        if (input.jumpPressed) {
          this.destroyShield();
          this.state = "idle";
          this.handleJump(input);
        }

        this.syncAnim();
        return;
      }
    }

    // Air dodge
    if (input.shield && !onGround && this.dodgeCooldown <= 0) {
      this.startDodge(0, true);
      return;
    }

    // Coyote time — brief window to jump after walking off edge
    if (onGround) {
      this.coyoteTimer = 80;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= delta;
    }
    // Jump buffer — press jump slightly early and it activates on landing
    if (input.jumpPressed) {
      this.jumpBufferTimer = 100;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= delta;
    }
    // Landing detection — squash + dust
    if (onGround && !this.wasOnGround) {
      this.onLand();
    }
    this.wasOnGround = onGround;

    // Normal movement & attacks
    this.handleMovement(input, delta);
    this.handleJump(input);
    this.handleFastFall(input);

    let attackStarted = false;

    // Up attack (jump + light while grounded, or up + attack in air)
    if (input.upAttack) {
      attackStarted = true;
      this.startAttack(onGround ? "airUp" : "airUp", onGround);
    } else if (input.special) {
      attackStarted = true;
      this.startAttack("special", onGround);
    } else if (input.heavyAttack) {
      attackStarted = true;
      if (onGround && this.config.attacks.heavy.isSmashable) {
        this.startSmashCharge();
      } else {
        this.startAttack(onGround ? "heavy" : "airHeavy", onGround);
      }
    } else if (input.lightAttack) {
      attackStarted = true;
      this.startAttack(onGround ? "light" : "airLight", onGround);
    }

    // Face opponent direction
    if (input.left && !input.right) {
      this.facing = "left";
      this.sprite.setFlipX(true);
    } else if (input.right && !input.left) {
      this.facing = "right";
      this.sprite.setFlipX(false);
    }

    if (onGround) {
      this.airJumpsLeft = this.config.airJumps;
      this.fastFalling = false;
      this.sprite.setMaxVelocity(600, PHYSICS.PLAYER_MAX_FALL);
      if (!attackStarted) {
        if (input.crouch) {
          this.state = "crouching";
        } else if (input.left || input.right) {
          this.state = this.runTimer > 300 ? "running" : "walking";
        } else {
          this.state = "idle";
        }
      }
    } else if (!attackStarted) {
      // Transition jump → falling once descending (fixes teabag loop)
      const body2 = this.sprite.body as Phaser.Physics.Arcade.Body;
      if ((this.state === "jumping" || this.state === "double_jumping") && body2.velocity.y > 0) {
        this.state = "falling";
      } else if (this.state !== "jumping" && this.state !== "double_jumping") {
        this.state = "falling";
      }
    }

    this.syncAnim();
  }

  // ── Movement ────────────────────────────────────────────────────────────
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
    const wantsJump = input.jumpPressed || this.jumpBufferTimer > 0;
    if (!wantsJump) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    const canCoyoteJump = !onGround && this.coyoteTimer > 0;

    if (onGround || canCoyoteJump) {
      this.sprite.setVelocityY(this.config.jumpForce);
      this.state = "jumping";
      this.fastFalling = false;
      this.runTimer = 0;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.spawnDust(3);
    } else if (this.airJumpsLeft > 0) {
      this.sprite.setVelocityY(this.config.doubleJumpForce);
      this.airJumpsLeft--;
      this.state = "double_jumping";
      this.fastFalling = false;
      this.jumpBufferTimer = 0;
    }
  }

  private handleFastFall(input: FighterInput): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (!onGround && input.crouch && !this.fastFalling && body.velocity.y > 50) {
      this.fastFalling = true;
      this.sprite.setVelocityY(PHYSICS.FAST_FALL_SPEED);
      this.sprite.setMaxVelocity(600, PHYSICS.FAST_FALL_SPEED);
    }
    if (onGround) {
      this.fastFalling = false;
      this.sprite.setMaxVelocity(600, PHYSICS.PLAYER_MAX_FALL);
    }
  }

  // ── Shield ──────────────────────────────────────────────────────────────
  private updateShieldVisual(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    // Use sprite X for horizontal (matches body center) and body center for vertical
    const cx = this.sprite.x;
    const cy = body.y + body.halfHeight;
    const hpRatio = this.shieldHp / PHYSICS.SHIELD_HP_MAX;
    // Size proportional to character body — fully envelops the fighter
    const baseSize = Math.max(body.width, body.height) * 1.1;
    const size = baseSize * (0.5 + hpRatio * 0.5);
    const alpha = 0.15 + hpRatio * 0.4;

    if (!this.shieldCircle) {
      const color = this.playerIndex === 0 ? 0x4488ff : 0xff4444;
      this.shieldCircle = this.scene.add.ellipse(cx, cy, size, size, color, alpha);
      this.shieldCircle.setDepth(12);
    } else {
      this.shieldCircle.setPosition(cx, cy);
      this.shieldCircle.setSize(size, size);
      this.shieldCircle.setAlpha(alpha);
    }
  }

  private destroyShield(): void {
    if (this.shieldCircle) {
      this.shieldCircle.destroy();
      this.shieldCircle = null;
    }
  }

  private breakShield(): void {
    this.destroyShield();
    this.state = "shield_broken";
    this.shieldBrokenTimer = PHYSICS.SHIELD_STUN_DURATION;
    this.shieldHp = 0;
    this.sprite.setVelocityY(-300);
    // Visual flash
    this.scene.cameras.main.flash(200, 255, 255, 255);
  }

  // ── Dodge ───────────────────────────────────────────────────────────────
  private startDodge(dir: number, isAir: boolean): void {
    if (isAir) {
      this.state = "air_dodge";
      this.dodgeTimer = PHYSICS.DODGE_DURATION * 0.7;
      this.sprite.setVelocity(
        dir !== 0 ? dir * PHYSICS.AIR_DODGE_SPEED : 0,
        0
      );
    } else {
      this.state = "dodge";
      this.dodgeDir = dir;
      this.dodgeTimer = PHYSICS.DODGE_DURATION;
    }
    this.dodgeCooldown = PHYSICS.DODGE_COOLDOWN;
    this.invulnTimer = this.dodgeTimer; // invuln during dodge
    if (!isAir) this.spawnDust(2);
  }

  // ── Smash charge ────────────────────────────────────────────────────────
  private startSmashCharge(): void {
    this.state = "charging_smash";
    this.smashChargeTime = 0;
    this.isChargingSmash = true;
    this.sprite.setVelocityX(this.sprite.body!.velocity.x * 0.1);
    this.playAnim("heavy");
    this.sprite.anims.pause();
  }

  private releaseSmashAttack(): void {
    this.isChargingSmash = false;
    this.sprite.anims.resume();
    const chargeMult = 1 + (Math.min(this.smashChargeTime, PHYSICS.SMASH_CHARGE_MAX) / PHYSICS.SMASH_CHARGE_MAX) * (PHYSICS.SMASH_CHARGE_MULT - 1);
    this.startAttack("heavy", true, chargeMult);
  }

  // ── Attacks ─────────────────────────────────────────────────────────────
  private startAttack(type: string, onGround: boolean, chargeMult = 1): void {
    const attacks = this.config.attacks as Record<string, AttackData>;
    const attack = attacks[type];
    if (!attack) return;

    this.currentAttack = chargeMult > 1
      ? { ...attack, damage: Math.round(attack.damage * chargeMult) }
      : attack;
    this.currentAttackType = type;
    this.attackTimer = 0;
    this.hasHitThisAttack = false;
    this.canCancelAttack = false;
    this.state = "attack_startup";

    // Light attack chain — Phantom cycles through 3 distinct animations
    if ((type === "light" || type === "airLight") && this.config.anim.attack2) {
      if (this.lightComboTimer > 0) {
        this.lightComboStep = (this.lightComboStep + 1) % 3;
      } else {
        this.lightComboStep = 0;
      }
      this.lightComboTimer = 600;
      // Chain hits escalate: 2nd and 3rd hit deal more damage/knockback
      if (this.lightComboStep > 0) {
        this.currentAttack = {
          ...this.currentAttack!,
          damage: this.currentAttack!.damage + this.lightComboStep,
          baseKnockback: this.currentAttack!.baseKnockback + this.lightComboStep * 3,
        };
      }
    }

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
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      const onGround = body.blocked.down || body.touching.down;
      if (onGround && this.config.attacks.heavy.isSmashable) {
        this.startSmashCharge();
      } else {
        this.startAttack("heavy", onGround);
      }
      return;
    }

    if (this.attackTimer < startup) {
      this.state = "attack_startup";
    } else if (this.attackTimer < startup + active) {
      this.state = "attack_active";
      if (!this.hitboxRect) this.createHitbox();
      this.updateHitboxPosition();
      // Blaze projectile visual during shot
      if (this.config.anim.shot && this.currentAttackType === "special" && !this.projectileSprite) {
        this.spawnProjectile();
      }
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
    if (this.projectileSprite) {
      this.projectileSprite.destroy();
      this.projectileSprite = null;
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
      hw, hh,
    );
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }

  // ── Smash Bros knockback formula ────────────────────────────────────────
  calcSmashKnockback(attack: AttackData): number {
    const p = this.damage;
    const d = attack.damage;
    const w = this.config.weight;
    // KB = (((p/10 + p*d/20) * 200/(w+100) * 1.4) + 18) * growth/100 + baseKB
    const raw = (((p / 10 + p * d / 20) * 200 / (w + 100) * 1.4) + 18)
      * (attack.knockbackGrowth / 100)
      + attack.baseKnockback;
    return raw;
  }

  // ── Take hit ────────────────────────────────────────────────────────────
  takeHit(attack: AttackData, attackerFacing: "left" | "right"): void {
    if (this.invulnTimer > 0 || this.respawnInvulnTimer > 0 || this.state === "ko" || this.state === "respawning") return;
    if (this.state === "dodge" || this.state === "air_dodge") return;

    // Super armor — Titan doesn't flinch during heavy/special attacks
    if (this.config.superArmor &&
        (this.state === "attack_startup" || this.state === "attack_active" || this.state === "charging_smash")) {
      const sa = this.config.superArmor;
      const isArmoredAttack =
        (sa.heavy && (this.currentAttackType === "heavy" || this.currentAttackType === "airHeavy" || this.state === "charging_smash")) ||
        (sa.special && this.currentAttackType === "special");
      if (isArmoredAttack) {
        this.damage += attack.damage;
        this.sprite.setTint(0xffffaa);
        this.scene.time.delayedCall(120, () => this.sprite.clearTint());
        this.scene.cameras.main.shake(30, 0.001);
        // Armor spark
        const spark = this.scene.add.circle(this.sprite.x, this.sprite.y - 30, 15, 0xffff00, 0.7).setDepth(15);
        this.scene.tweens.add({
          targets: spark, scaleX: 2.5, scaleY: 2.5, alpha: 0,
          duration: 150,
          onComplete: () => spark.destroy(),
        });
        return;
      }
    }

    // Shield absorb
    if (this.state === "shielding" && this.shieldHp > 0) {
      this.shieldHp -= attack.damage * 1.5;
      const pushDir = attackerFacing === "right" ? 1 : -1;
      this.sprite.setVelocityX(pushDir * PHYSICS.SHIELD_PUSHBACK);
      if (this.shieldHp <= 0) {
        this.breakShield();
      }
      return;
    }

    // Apply damage %
    this.damage += attack.damage;

    // Track consecutive hits for combo decay
    this.consecutiveHits++;

    // Calculate Smash-style knockback
    const knockbackForce = this.calcSmashKnockback(attack);
    const angleRad = (attack.angle * Math.PI) / 180;
    const dir = attackerFacing === "right" ? 1 : -1;

    const vx = Math.cos(angleRad) * knockbackForce * dir * PHYSICS.KNOCKBACK_FORMULA_SCALE;
    const vy = -Math.sin(angleRad) * knockbackForce * PHYSICS.KNOCKBACK_FORMULA_SCALE;

    // Hitlag — both attacker and defender freeze briefly
    const hitlagDuration = PHYSICS.HITLAG_BASE + attack.damage * PHYSICS.HITLAG_PER_DAMAGE;
    this.startHitlag(hitlagDuration, vx, vy);

    // Hitstun scales with knockback, decays with consecutive hits (anti-infinite)
    const decayMult = Math.max(
      1 - PHYSICS.HITSTUN_DECAY_PER_HIT * (this.consecutiveHits - 1),
      PHYSICS.MAX_COMBO_DECAY,
    );
    this.hitstunTimer = (PHYSICS.HITSTUN_BASE_MS + knockbackForce * PHYSICS.HITSTUN_PER_KB) * decayMult;
    this.invulnTimer = 60;

    this.state = knockbackForce > 60 ? "launched" : "hitstun";

    this.destroyHitbox();
    this.destroyShield();
    this.currentAttack = null;
    this.currentAttackType = "";
    this.isChargingSmash = false;
    this.playAnim("hurt");
  }

  private startHitlag(duration: number, pendingVx: number, pendingVy: number): void {
    this.hitlagTimer = duration;
    this.hitlagFrozen = true;
    this.savedVelocity = { x: pendingVx, y: pendingVy };
    this.sprite.setVelocity(0, 0);
  }

  // Called by attacker when they land a hit (hitlag on attacker side)
  applyAttackerHitlag(damage: number): void {
    const dur = PHYSICS.HITLAG_BASE + damage * PHYSICS.HITLAG_PER_DAMAGE * 0.6;
    const vx = this.sprite.body!.velocity.x;
    const vy = this.sprite.body!.velocity.y;
    this.hitlagTimer = dur;
    this.hitlagFrozen = true;
    this.savedVelocity = { x: vx, y: vy };
    this.sprite.setVelocity(0, 0);
  }

  // ── KO checks (closed stage) ────────────────────────────────────────────
  // KO by: (1) launched past top blast zone, (2) damage exceeds threshold
  checkBlastZones(): boolean {
    if (this.state === "ko" || this.state === "respawning") return false;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const y = body.y + body.halfHeight;

    // Top blast zone — launched upward off screen
    if (y < PHYSICS.BLAST_TOP) {
      this.onKO();
      return true;
    }

    // Damage threshold KO (safety valve for closed stage)
    if (this.damage >= PHYSICS.KO_DAMAGE_THRESHOLD) {
      this.onKO();
      return true;
    }

    return false;
  }

  // ── Wall bounce (called from scene when hitting walls at high KB) ──────
  wallBounce(): void {
    if (this.state !== "hitstun" && this.state !== "launched") return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    // Reverse horizontal velocity and reduce
    body.velocity.x *= -PHYSICS.WALL_BOUNCE_FACTOR;
    // Extra hitstun from wall splat
    this.hitstunTimer += PHYSICS.WALL_SPLAT_STUN;
  }

  // ── Combo breaker (burst) ──────────────────────────────────────────────
  private burst(): void {
    this.hitstunTimer = 0;
    this.consecutiveHits = 0;
    this.burstCooldown = PHYSICS.BURST_COOLDOWN;
    this.invulnTimer = PHYSICS.BURST_INVULN;
    this.burstJustFired = true;
    this.state = "idle";
    this.sprite.setVelocity(0, -200);

    // Shockwave visual
    const x = this.sprite.x;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const y = body.y + body.halfHeight;
    const color = this.playerIndex === 0 ? 0x4488ff : 0xff4444;
    const ring = this.scene.add.circle(x, y, 20, color, 0.6).setDepth(20);
    ring.setStrokeStyle(3, 0xffffff);
    this.scene.tweens.add({
      targets: ring, scaleX: 5, scaleY: 5, alpha: 0,
      duration: 350,
      onComplete: () => ring.destroy(),
    });
    this.scene.cameras.main.flash(100, 200, 200, 255);
    this.scene.cameras.main.shake(80, 0.003);
  }

  // ── Blaze projectile visual ──────────────────────────────────────────────
  private spawnProjectile(): void {
    if (!this.currentAttack) return;
    const dir = this.facing === "right" ? 1 : -1;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const startX = body.x + body.halfWidth + 20 * dir;
    const startY = body.y + body.halfHeight - 10;
    const endX = startX + 260 * dir;

    this.projectileSprite = this.scene.add.ellipse(startX, startY, 18, 8, 0xff6600, 0.9).setDepth(11);
    // Muzzle flash
    const flash = this.scene.add.circle(startX, startY, 12, 0xffaa00, 0.8).setDepth(11);
    this.scene.tweens.add({
      targets: flash, scaleX: 2, scaleY: 2, alpha: 0,
      duration: 120,
      onComplete: () => flash.destroy(),
    });
    // Bullet travel
    this.scene.tweens.add({
      targets: this.projectileSprite,
      x: endX,
      duration: this.currentAttack.active,
      onComplete: () => {
        this.projectileSprite?.destroy();
        this.projectileSprite = null;
      },
    });
  }

  onKO(): void {
    this.stocks--;
    this.state = "ko";
    this.sprite.setVelocity(0, 0);
    this.sprite.setVisible(false);
    this.shadow?.setVisible(false);
    this.destroyHitbox();
    this.destroyShield();
    this.currentAttack = null;
    this.currentAttackType = "";
    this.isChargingSmash = false;
  }

  // ── Respawn (closed stage — drop from top center) ──────────────────────
  startRespawn(x: number, floorY: number): void {
    this.state = "respawning";
    this.damage = 0;

    // Calculate proper spawn Y using same logic as ArenaScene
    const scale = this.config.scale ?? 1.5;
    const displayH = 128 * scale;
    const footPx = (this.config.spriteFootY ?? 0.62) * displayH;
    const spawnY = floorY + displayH / 2 - footPx;

    this.sprite.setPosition(x, spawnY - 120);
    this.sprite.setVelocity(0, 0);
    this.sprite.setVisible(true);
    this.sprite.setAlpha(0.4);
    this.shadow?.setVisible(true);
    this.airJumpsLeft = this.config.airJumps;
    this.fastFalling = false;
    this.hitstunTimer = 0;
    this.hitlagTimer = 0;
    this.hitlagFrozen = false;
    this.consecutiveHits = 0;
    this.lightComboStep = 0;
    this.lightComboTimer = 0;
    this.runTimer = 0;
    this.wasLeft = false;
    this.wasRight = false;
    this.facing = this.playerIndex === 0 ? "right" : "left";
    this.sprite.setFlipX(this.facing === "left");
    this.shieldHp = PHYSICS.SHIELD_HP_MAX;
    this.dodgeCooldown = 0;

    // Disable gravity briefly for float-down
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);
    body.setVelocityY(0);

    // Float down to stage
    this.scene.tweens.add({
      targets: this.sprite,
      y: spawnY,
      duration: PHYSICS.RESPAWN_TIME,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.completeRespawn();
      },
    });
  }

  private completeRespawn(): void {
    this.state = "idle";
    this.respawnInvulnTimer = PHYSICS.RESPAWN_INVULN;
    this.sprite.setAlpha(0.5);
    this.playAnim("idle");

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(PHYSICS.GRAVITY);
  }

  /** Full reset for new match */
  resetForRound(x: number, y: number): void {
    this.damage = 0;
    this.state = "idle";
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setVisible(true);
    this.sprite.setAlpha(1);
    this.airJumpsLeft = this.config.airJumps;
    this.fastFalling = false;
    this.hitstunTimer = 0;
    this.hitlagTimer = 0;
    this.hitlagFrozen = false;
    this.invulnTimer = 0;
    this.respawnInvulnTimer = 0;
    this.currentAttack = null;
    this.currentAttackType = "";
    this.hasHitThisAttack = false;
    this.isChargingSmash = false;
    this.comboCount = 0;
    this.burstCooldown = 0;
    this.consecutiveHits = 0;
    this.burstJustFired = false;
    this.lightComboStep = 0;
    this.lightComboTimer = 0;
    this.runTimer = 0;
    this.wasLeft = false;
    this.wasRight = false;
    this.shieldHp = PHYSICS.SHIELD_HP_MAX;
    this.dodgeCooldown = 0;
    this.wasOnGround = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.facing = this.playerIndex === 0 ? "right" : "left";
    this.sprite.setFlipX(this.facing === "left");
    this.shadow?.setVisible(true);
    this.destroyHitbox();
    this.destroyShield();
    this.playAnim("idle");
  }

  // ── Animation sync ──────────────────────────────────────────────────────
  private syncAnim(): void {
    switch (this.state) {
      case "idle":              this.playAnim("idle"); break;
      case "walking":           this.playAnim("walk"); break;
      case "running":           this.playAnim("run");  break;
      case "crouching":         this.playAnim("crouch"); break;
      case "jumping":
      case "double_jumping":    this.playAnim("jump"); break;
      case "falling":           this.playAnim("fall"); break;
      case "attack_startup":
      case "attack_active":
      case "attack_recovery":   this.playAnim(this.getAttackAnimName()); break;
      case "hitstun":
      case "launched":          this.playAnim("hurt"); break;
      case "ko":                this.playAnim("dead"); break;
      case "shielding":         this.playAnim("crouch"); break;
      case "shield_broken":     this.playAnim("hurt"); break;
      case "dodge":             this.playAnim("run"); break;
      case "air_dodge":         this.playAnim("fall"); break;
      case "charging_smash":    break; // anim paused during charge
    }
  }

  private getAttackAnimName(): string {
    // Light attack chain — cycle through attack/attack2/attack3
    if (this.currentAttackType === "light" || this.currentAttackType === "airLight") {
      if (this.lightComboStep === 1 && this.config.anim.attack2) return "attack2";
      if (this.lightComboStep === 2 && this.config.anim.attack3) return "attack3";
      return "attack";
    }
    switch (this.currentAttackType) {
      case "heavy":
      case "airHeavy": return "heavy";
      case "airUp": return "attack";
      case "special":
        if (this.config.anim.shot) return "shot";
        return this.config.anim.special ? "special" : "attack";
      default: return "attack";
    }
  }

  // ── Polish: visual juice ────────────────────────────────────────────────

  private updateVisuals(delta: number): void {
    this.updateShadow();

    // Don't spawn effects during hitlag freeze
    if (this.hitlagFrozen) return;

    // Afterimage trail during attacks and dodge
    if (this.state === "attack_active" || this.state === "dodge" || this.state === "air_dodge") {
      this.afterimageTimer -= delta;
      if (this.afterimageTimer <= 0) {
        this.spawnAfterimage();
        this.afterimageTimer = 50;
      }
    }

    // Running dust
    if (this.state === "running") {
      this.dustTimer -= delta;
      if (this.dustTimer <= 0) {
        this.spawnDust(1);
        this.dustTimer = 120;
      }
    }

    // Dodge dust trail
    if (this.state === "dodge") {
      this.dustTimer -= delta;
      if (this.dustTimer <= 0) {
        this.spawnDust(1);
        this.dustTimer = 80;
      }
    }
  }

  private updateShadow(): void {
    if (!this.shadow) return;
    if (this.state === "ko" || !this.sprite.visible) {
      this.shadow.setVisible(false);
      return;
    }
    this.shadow.setVisible(true);
    this.shadow.setPosition(this.sprite.x, PHYSICS.FLOOR_Y + 2);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const heightAboveGround = PHYSICS.FLOOR_Y - (body.y + body.height);
    const t = Math.max(0.3, 1 - heightAboveGround / 400);
    const baseW = 50 * (this.config.scale ?? 1.5) / 1.5;
    this.shadow.setSize(baseW * t, 14 * t);
    this.shadow.setAlpha(0.2 * t);
  }

  private onLand(): void {
    this.spawnDust(4);
  }

  private spawnDust(count: number): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const footY = body.y + body.height;
    const cx = this.sprite.x;
    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(3, 7);
      const p = this.scene.add.circle(
        cx + Phaser.Math.Between(-20, 20), footY,
        size, 0xcccccc, 0.5,
      ).setDepth(5);
      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-30, 30),
        y: p.y - Phaser.Math.Between(5, 25),
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: Phaser.Math.Between(200, 400),
        onComplete: () => p.destroy(),
      });
    }
  }

  private spawnAfterimage(): void {
    const img = this.scene.add.sprite(this.sprite.x, this.sprite.y, this.sprite.texture.key, this.sprite.frame.name);
    img.setScale(this.sprite.scaleX, this.sprite.scaleY);
    img.setFlipX(this.sprite.flipX);
    img.setAlpha(0.3);
    img.setTint(this.config.color);
    img.setDepth(this.sprite.depth - 1);
    this.scene.tweens.add({
      targets: img,
      alpha: 0,
      duration: 180,
      onComplete: () => img.destroy(),
    });
  }

  destroy(): void {
    this.destroyHitbox();
    this.destroyShield();
    this.projectileSprite?.destroy();
    this.shadow?.destroy();
    this.respawnPlatform?.destroy();
    this.sprite.destroy();
  }
}
