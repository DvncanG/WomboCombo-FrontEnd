import type { FighterInput } from "./FighterInputManager";
import type { Fighter } from "../entities/Fighter";

type CPUState = "approach" | "attack" | "shield" | "retreat";

export class CPUController implements FighterInput {
  private cpu: Fighter;
  private opp: Fighter;
  private cpuState: CPUState = "approach";

  private attackCooldown = 0;
  private attackDelay: number;
  private shieldTimer = 0;

  // Outputs (reset every frame)
  left = false;
  right = false;
  jumpPressed = false;
  crouch = false;
  lightAttack = false;
  heavyAttack = false;
  heavyHeld = false;
  special = false;
  shield = false;
  upAttack = false;

  constructor(cpu: Fighter, opp: Fighter, difficulty = 0.65) {
    this.cpu = cpu;
    this.opp = opp;
    this.attackDelay = 280 - difficulty * 200;
  }

  update(delta: number = 16): void {
    // Reset
    this.left = false;
    this.right = false;
    this.jumpPressed = false;
    this.crouch = false;
    this.lightAttack = false;
    this.heavyAttack = false;
    this.heavyHeld = false;
    this.special = false;
    this.shield = false;
    this.upAttack = false;

    const cs = this.cpu.state;
    if (cs === "ko" || cs === "respawning") return;
    if (cs === "attack_startup" || cs === "attack_active" || cs === "attack_recovery") return;
    if (cs === "shield_broken" || cs === "dodge" || cs === "air_dodge") return;

    this.attackCooldown -= delta;
    if (this.shieldTimer > 0) this.shieldTimer -= delta;

    const dx = this.opp.sprite.x - this.cpu.sprite.x;
    const dy = this.opp.sprite.y - this.cpu.sprite.y;
    const dist = Math.abs(dx);
    const dirToOpp = dx >= 0 ? 1 : -1;
    const cpuBody = this.cpu.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = cpuBody.blocked.down || cpuBody.touching.down;

    // ── Decide state ──────────────────────────────────────────────────
    if (this.opp.state === "attack_active" && dist < 140 && Math.random() < 0.04) {
      this.cpuState = "shield";
    } else if (this.cpu.damage > 120 && dist < 100 && Math.random() < 0.03) {
      this.cpuState = "retreat";
    } else if (this.opp.damage > 120 && dist < 200) {
      this.cpuState = "attack";
    } else if (dist < 100) {
      this.cpuState = "attack";
    } else {
      this.cpuState = "approach";
    }

    // ── Execute ───────────────────────────────────────────────────────
    switch (this.cpuState) {

      case "approach":
        if (dirToOpp > 0) this.right = true;
        else this.left = true;

        // Jump toward elevated opponent
        if (dy < -100 && onGround && Math.random() < 0.02) {
          this.jumpPressed = true;
        }
        // Short hop approach
        if (dist < 250 && onGround && Math.random() < 0.008) {
          this.jumpPressed = true;
        }
        break;

      case "attack":
        // Stay in range
        if (dist > 120) {
          if (dirToOpp > 0) this.right = true;
          else this.left = true;
        } else if (dist < 40) {
          if (dirToOpp > 0) this.left = true;
          else this.right = true;
        }

        if (this.attackCooldown <= 0 && dist < 130) {
          const roll = Math.random();
          const oppHitstun = this.opp.state === "hitstun" || this.opp.state === "launched";
          const oppHighPercent = this.opp.damage > 110;

          if (!onGround) {
            if (dy > 30 && roll < 0.4) {
              this.heavyAttack = true;
            } else if (dy < -30 && roll < 0.4) {
              this.upAttack = true;
            } else {
              this.lightAttack = true;
            }
          } else if (oppHighPercent && roll < 0.5) {
            // Go for kill — smash attack
            this.heavyAttack = true;
            this.heavyHeld = true;
          } else if (oppHitstun && roll < 0.6) {
            if (dy < -40) {
              this.upAttack = true;
            } else {
              this.heavyAttack = true;
            }
          } else if (roll < 0.5) {
            this.lightAttack = true;
          } else if (roll < 0.75) {
            this.heavyAttack = true;
          } else {
            this.special = true;
          }
          this.attackCooldown = this.attackDelay + Phaser.Math.Between(0, 120);
        }
        break;

      case "retreat":
        if (dirToOpp > 0) this.left = true;
        else this.right = true;

        if (Math.random() < 0.01 && onGround) this.jumpPressed = true;

        if (this.attackCooldown <= 0 && dist < 140) {
          this.lightAttack = true;
          this.attackCooldown = 400;
        }
        break;

      case "shield":
        if (this.shieldTimer <= 0) {
          this.shield = true;
          this.shieldTimer = 200 + Math.random() * 300;
        } else {
          this.shield = true;
          if (this.shieldTimer < 50) {
            // Roll out of shield
            if (dirToOpp > 0) this.left = true;
            else this.right = true;
          }
        }
        break;
    }
  }
}
