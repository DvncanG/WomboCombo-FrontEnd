import type { FighterInput } from "./FighterInputManager";
import type { Fighter } from "../entities/Fighter";

type CPUState = "approach" | "attack" | "retreat" | "idle";

export class CPUController implements FighterInput {
  private cpu: Fighter;
  private opp: Fighter;
  private cpuState: CPUState = "approach";

  // Attack throttle — only attack every N ms (not movement)
  private attackCooldown = 0;
  private attackDelay: number;

  // Outputs (reset every frame)
  left = false;
  right = false;
  jumpPressed = false;
  crouch = false;
  lightAttack = false;
  heavyAttack = false;
  special = false;

  constructor(cpu: Fighter, opp: Fighter, difficulty = 0.6) {
    this.cpu = cpu;
    this.opp = opp;
    // Harder = shorter attack delay
    this.attackDelay = 300 - difficulty * 200; // 100–300 ms
  }

  update(delta: number = 16): void {
    // Reset every frame
    this.left = false;
    this.right = false;
    this.jumpPressed = false;
    this.crouch = false;
    this.lightAttack = false;
    this.heavyAttack = false;
    this.special = false;

    const cs = this.cpu.state;
    if (cs === "ko") return;
    // Don't override ongoing attacks
    if (cs === "attack_startup" || cs === "attack_active" || cs === "attack_recovery") return;

    this.attackCooldown -= delta;

    const dx = this.opp.sprite.x - this.cpu.sprite.x;
    const dy = this.opp.sprite.y - this.cpu.sprite.y;
    const dist = Math.abs(dx);
    const dirToOpp = dx >= 0 ? 1 : -1;
    const cpuBody = this.cpu.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = cpuBody.blocked.down || cpuBody.touching.down;

    // ── Decide state ────────────────────────────────────────────────
    if (this.cpu.hp < 30 && dist < 150 && Math.random() < 0.005) {
      this.cpuState = "retreat";
    } else if (dist < 90) {
      this.cpuState = "attack";
    } else {
      this.cpuState = "approach";
    }

    // ── Execute every frame ─────────────────────────────────────────
    switch (this.cpuState) {

      case "approach":
        // Walk toward opponent every frame (smooth movement)
        if (dirToOpp > 0) this.right = true;
        else this.left = true;

        // Jump if opponent is above or we need to get over obstacle
        if (dy < -80 && onGround && Math.random() < 0.015) {
          this.jumpPressed = true;
        }
        break;

      case "attack":
        // Stay in range — tiny adjustments
        if (dist > 110) {
          if (dirToOpp > 0) this.right = true;
          else this.left = true;
        } else if (dist < 40) {
          // Too close — step back a little
          if (dirToOpp > 0) this.left = true;
          else this.right = true;
        }

        // Attack decision throttled by attackDelay
        if (this.attackCooldown <= 0 && dist < 120) {
          const roll = Math.random();
          const oppHitstun =
            this.opp.state === "hitstun" || this.opp.state === "launched";

          if (!onGround) {
            this.lightAttack = true;
          } else if (oppHitstun && roll < 0.7) {
            this.heavyAttack = true;
          } else if (roll < 0.55) {
            this.lightAttack = true;
          } else if (roll < 0.80) {
            this.heavyAttack = true;
          } else {
            this.special = true;
          }
          this.attackCooldown = this.attackDelay + Phaser.Math.Between(0, 150);
        }
        break;

      case "retreat":
        if (dirToOpp > 0) this.left = true;
        else this.right = true;

        if (Math.random() < 0.008 && onGround) this.jumpPressed = true;

        // Occasional deterrent attack while retreating
        if (this.attackCooldown <= 0 && dist < 140) {
          this.lightAttack = true;
          this.attackCooldown = 500;
        }
        break;

    }
  }
}
