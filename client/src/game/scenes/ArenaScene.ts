import { Fighter } from "../entities/Fighter";
import { FighterInputManager } from "../systems/FighterInputManager";
import { CPUController } from "../systems/CPUController";
import { PHYSICS } from "../config/physics";
import { getFighterConfig, type FighterConfig } from "../config/fighters";
import { gameStore } from "../../lib/stores/game.svelte";

/**
 * Compute sprite.y so that the character's feet land exactly on FLOOR_Y.
 */
function calcSpawnY(config: FighterConfig, floorY: number): number {
  const scale = config.scale ?? 1.5;
  const displayH = 128 * scale;
  const footPx = (config.spriteFootY ?? 0.62) * displayH;
  return floorY + displayH / 2 - footPx;
}

const FLOOR_Y = PHYSICS.FLOOR_Y;
const WALL_LEFT = PHYSICS.ARENA_WALL_LEFT;
const WALL_RIGHT = PHYSICS.ARENA_WALL_RIGHT;

interface ArenaSceneData {
  p1Character: string;
  p2Character: string;
  isCPU: boolean;
}

export class ArenaScene extends Phaser.Scene {
  private fighters: Fighter[] = [];
  private inputs: (FighterInputManager | CPUController)[] = [];
  private isCPU = true;

  private matchActive = false;
  private gameOver = false;

  // Timer
  private matchTimer = PHYSICS.MATCH_TIME;
  private matchTimerEvent?: Phaser.Time.TimerEvent;

  // UI text
  private countdownText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private comboFadeTimer = 0;
  private announcerText?: Phaser.GameObjects.Text;

  // KO respawn queue
  private pendingRespawns: { fighter: Fighter; timer: number }[] = [];

  constructor() {
    super({ key: "ArenaScene" });
  }

  init(data: ArenaSceneData): void {
    this.fighters = [];
    this.inputs = [];
    this.matchTimer = PHYSICS.MATCH_TIME;
    this.matchActive = false;
    this.gameOver = false;
    this.pendingRespawns = [];
    this.isCPU = data.isCPU !== false;
    (this as any)._initData = {
      p1Character: data.p1Character || "blaze",
      p2Character: data.p2Character || "titan",
    };
  }

  create(): void {
    const data = (this as any)._initData as { p1Character: string; p2Character: string };
    const W = PHYSICS.ARENA_WIDTH;
    const H = PHYSICS.ARENA_HEIGHT;

    // ── World bounds — closed stage: walls + floor ────────────────────
    // Top boundary is far up to allow jumps but fighters are contained by walls/floor.
    this.physics.world.setBounds(
      WALL_LEFT, -3000,
      WALL_RIGHT - WALL_LEFT, 3000 + FLOOR_Y,
    );

    // ── Background & stage visuals ────────────────────────────────────
    this.drawStage(W, H);

    // ── Create fighters ──────────────────────────────────────────────
    const p1Config = getFighterConfig(data.p1Character);
    const p2Config = getFighterConfig(data.p2Character);

    const fighter1 = new Fighter(this, 320, calcSpawnY(p1Config, FLOOR_Y), p1Config, 0);
    const fighter2 = new Fighter(this, W - 320, calcSpawnY(p2Config, FLOOR_Y), p2Config, 1);
    this.fighters = [fighter1, fighter2];

    // ── Input ────────────────────────────────────────────────────────
    const p1Input = new FighterInputManager(this, 0);
    if (this.isCPU) {
      this.inputs = [p1Input, new CPUController(fighter2, fighter1)];
    } else {
      this.inputs = [p1Input, new FighterInputManager(this, 1)];
    }

    // ── Camera — wider bounds for dynamic tracking ────────────────────
    this.cameras.main.setBounds(-60, -100, W + 120, H + 200);
    this.cameras.main.setScroll(0, 0);

    // ── Game store init ──────────────────────────────────────────────
    gameStore.phase = "playing";
    gameStore.p1Character = data.p1Character;
    gameStore.p2Character = data.p2Character;
    gameStore.p1Name = "Player 1";
    gameStore.p2Name = this.isCPU ? "CPU" : "Player 2";
    gameStore.p1Damage = 0;
    gameStore.p2Damage = 0;
    gameStore.p1Stocks = PHYSICS.STOCKS;
    gameStore.p2Stocks = PHYSICS.STOCKS;
    gameStore.totalStocks = PHYSICS.STOCKS;
    gameStore.timer = this.matchTimer;
    gameStore.winner = null;

    // ── Combo text ───────────────────────────────────────────────────
    this.comboText = this.add.text(W / 2, H * 0.28, "", {
      fontSize: "28px", fontFamily: "monospace",
      color: "#ffcc00", stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    // ── Announcer text ───────────────────────────────────────────────
    this.announcerText = this.add.text(W / 2, H * 0.35, "", {
      fontSize: "40px", fontFamily: "monospace",
      color: "#ffffff", stroke: "#000000", strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(25);

    // ── Start ────────────────────────────────────────────────────────
    this.startCountdown();
  }

  // ── Stage visuals (Tekken/SF style) ────────────────────────────────────
  private drawStage(w: number, h: number): void {
    const bgKey = gameStore.selectedStage || "bg_city1";
    const bg = this.add.image(w / 2, h / 2, bgKey).setDepth(-10);
    bg.setDisplaySize(w, h);

    const gfx = this.add.graphics().setDepth(-5);

    // Floor line
    gfx.fillStyle(0xffffff, 0.18);
    gfx.fillRect(WALL_LEFT, FLOOR_Y, WALL_RIGHT - WALL_LEFT, 3);

    // Subtle floor glow
    gfx.fillStyle(0xffffff, 0.04);
    gfx.fillRect(WALL_LEFT, FLOOR_Y + 3, WALL_RIGHT - WALL_LEFT, 20);

    // Wall indicators (subtle vertical lines)
    gfx.fillStyle(0xffffff, 0.08);
    gfx.fillRect(WALL_LEFT - 2, FLOOR_Y - 400, 3, 403);
    gfx.fillRect(WALL_RIGHT - 1, FLOOR_Y - 400, 3, 403);

    // Wall glow at base
    gfx.fillStyle(0xffffff, 0.05);
    gfx.fillRect(WALL_LEFT - 1, FLOOR_Y - 60, 2, 63);
    gfx.fillRect(WALL_RIGHT, FLOOR_Y - 60, 2, 63);
  }

  // ── Countdown ──────────────────────────────────────────────────────────
  private startCountdown(): void {
    const W = PHYSICS.ARENA_WIDTH;
    const H = PHYSICS.ARENA_HEIGHT;

    this.countdownText = this.add.text(W / 2, H * 0.40, "3", {
      fontSize: "80px", fontFamily: "monospace",
      color: "#ffffff", stroke: "#000000", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(30);

    let count = 3;
    const countdownEvent = this.time.addEvent({
      delay: 700,
      repeat: 4,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText?.setText(`${count}`);
          this.tweens.add({ targets: this.countdownText, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true });
        } else if (count === 0) {
          this.countdownText?.setText("FIGHT!");
          this.countdownText?.setColor("#ff4444");
          this.tweens.add({ targets: this.countdownText, scaleX: 1.5, scaleY: 1.5, duration: 200, yoyo: true });
          this.matchActive = true;
          this.startMatchTimer();
        } else {
          this.countdownText?.destroy();
          this.countdownText = undefined;
          countdownEvent.destroy();
        }
      },
    });
  }

  private startMatchTimer(): void {
    this.matchTimer = PHYSICS.MATCH_TIME;
    gameStore.timer = this.matchTimer;

    this.matchTimerEvent?.destroy();
    this.matchTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: PHYSICS.MATCH_TIME - 1,
      callback: () => {
        this.matchTimer--;
        gameStore.timer = this.matchTimer;
        if (this.matchTimer <= 0 && this.matchActive) {
          this.finishMatch();
        }
      },
    });
  }

  // ── Main update ────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    for (const input of this.inputs) input.update(delta);

    if (this.matchActive) {
      for (let i = 0; i < this.fighters.length; i++) {
        this.fighters[i].update(this.inputs[i], delta);
      }

      this.checkHitboxCollisions();
      this.checkWallBounces();
      this.checkBursts();
      this.checkKOs();
      this.updateRespawns(delta);
      this.syncGameStore();
      this.updateComboText(delta);
      this.updateCamera();
      this.checkMatchEnd();
    }
  }

  // ── Hit detection ──────────────────────────────────────────────────────
  private checkHitboxCollisions(): void {
    for (let i = 0; i < this.fighters.length; i++) {
      const attacker = this.fighters[i];
      if (attacker.state !== "attack_active" || attacker.hasHitThisAttack) continue;
      if (!attacker.currentAttack) continue;

      const hitbox = attacker.getHitboxBounds();
      if (!hitbox) continue;

      for (let j = 0; j < this.fighters.length; j++) {
        if (i === j) continue;
        const defender = this.fighters[j];
        if (defender.state === "ko" || defender.state === "respawning") continue;
        if (defender.invulnTimer > 0 || defender.respawnInvulnTimer > 0) continue;
        if (defender.state === "dodge" || defender.state === "air_dodge") continue;

        if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, defender.getHurtbox())) {
          defender.takeHit(attacker.currentAttack!, attacker.facing);
          attacker.hasHitThisAttack = true;

          // Attacker hitlag
          attacker.applyAttackerHitlag(attacker.currentAttack!.damage);

          // Combo tracking
          const now = this.time.now;
          if (now - attacker.lastHitTime < 1500) {
            attacker.comboCount++;
          } else {
            attacker.comboCount = 1;
          }
          attacker.lastHitTime = now;

          if (attacker.comboCount > 1) {
            gameStore.comboCount = attacker.comboCount;
            gameStore.lastComboPlayer = attacker.playerIndex;
            this.showCombo(attacker.comboCount, attacker.playerIndex);
          }

          // Screen effects scale with knockback
          const kb = defender.calcSmashKnockback(attacker.currentAttack!);
          if (kb > 60) {
            this.cameras.main.shake(50 + kb * 0.4, 0.002 + kb * 0.00002);
          }
          if (kb > 130) {
            this.cameras.main.flash(80, 255, 255, 255, true);
          }

          this.spawnHitParticles(defender.sprite.x, defender.sprite.y - 40, kb);
          break;
        }
      }
    }
  }

  // ── Wall bounce detection ──────────────────────────────────────────────
  private checkWallBounces(): void {
    for (const fighter of this.fighters) {
      if (fighter.state !== "hitstun" && fighter.state !== "launched") continue;

      const body = fighter.sprite.body as Phaser.Physics.Arcade.Body;
      // Check if fighter is pressed against a wall during knockback
      if (body.blocked.left || body.blocked.right) {
        const speed = Math.abs(body.velocity.x);
        if (speed > 50) {
          fighter.wallBounce();

          // Wall splat visual
          const wallX = body.blocked.left ? WALL_LEFT + 5 : WALL_RIGHT - 5;
          this.spawnWallSplatEffect(wallX, body.y + body.halfHeight);

          this.cameras.main.shake(60, 0.004);
        }
      }
    }
  }

  // ── Burst pushback — combo breaker pushes nearby opponents away ────────
  private checkBursts(): void {
    for (let i = 0; i < this.fighters.length; i++) {
      const fighter = this.fighters[i];
      if (!fighter.burstJustFired) continue;
      fighter.burstJustFired = false;

      for (let j = 0; j < this.fighters.length; j++) {
        if (i === j) continue;
        const other = this.fighters[j];
        if (other.state === "ko" || other.state === "respawning") continue;
        const dx = other.sprite.x - fighter.sprite.x;
        const dist = Math.abs(dx);
        if (dist < 200) {
          const dir = dx >= 0 ? 1 : -1;
          const pushForce = PHYSICS.BURST_PUSHBACK * (1 - dist / 200);
          other.sprite.setVelocityX(dir * pushForce);
          other.sprite.setVelocityY(-pushForce * 0.3);
        }
      }

      // Announcer callout
      this.showAnnouncer("BURST!");
    }
  }

  // ── KO checks ──────────────────────────────────────────────────────────
  private checkKOs(): void {
    for (const fighter of this.fighters) {
      if (fighter.checkBlastZones()) {
        this.onFighterKO(fighter);
      }
    }
  }

  private onFighterKO(fighter: Fighter): void {
    // Update store
    if (fighter.playerIndex === 0) {
      gameStore.p1Stocks = fighter.stocks;
    } else {
      gameStore.p2Stocks = fighter.stocks;
    }

    // KO effects
    this.spawnKOBlast(fighter);
    this.cameras.main.shake(300, 0.008);
    this.cameras.main.flash(200, 255, 100, 100);
    this.showAnnouncer("K.O.!");

    // Respawn if stocks remain
    if (fighter.stocks > 0) {
      this.pendingRespawns.push({ fighter, timer: PHYSICS.RESPAWN_TIME });
    }
  }

  private updateRespawns(delta: number): void {
    for (let i = this.pendingRespawns.length - 1; i >= 0; i--) {
      this.pendingRespawns[i].timer -= delta;
      if (this.pendingRespawns[i].timer <= 0) {
        const { fighter } = this.pendingRespawns[i];
        const W = PHYSICS.ARENA_WIDTH;
        fighter.startRespawn(W / 2, FLOOR_Y);

        if (fighter.playerIndex === 0) {
          gameStore.p1Damage = 0;
        } else {
          gameStore.p2Damage = 0;
        }

        this.pendingRespawns.splice(i, 1);
      }
    }
  }

  // ── Match end ──────────────────────────────────────────────────────────
  private checkMatchEnd(): void {
    if (this.gameOver) return;
    const [f1, f2] = this.fighters;

    if ((f1.stocks <= 0 && f1.state === "ko") || (f2.stocks <= 0 && f2.state === "ko")) {
      this.finishMatch();
    }
  }

  private finishMatch(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.matchActive = false;
    this.matchTimerEvent?.destroy();

    const [f1, f2] = this.fighters;
    let winnerIdx: number;

    if (f1.stocks <= 0 && f2.stocks <= 0) {
      winnerIdx = f1.damage <= f2.damage ? 0 : 1;
    } else if (f1.stocks <= 0) {
      winnerIdx = 1;
    } else if (f2.stocks <= 0) {
      winnerIdx = 0;
    } else {
      // Time up
      if (f1.stocks !== f2.stocks) {
        winnerIdx = f1.stocks > f2.stocks ? 0 : 1;
      } else {
        winnerIdx = f1.damage <= f2.damage ? 0 : 1;
      }
    }

    const W = PHYSICS.ARENA_WIDTH;
    const H = PHYSICS.ARENA_HEIGHT;
    const winnerName = winnerIdx === 0 ? gameStore.p1Name : gameStore.p2Name;
    gameStore.winner = winnerName;
    gameStore.phase = "game_over";

    this.showAnnouncer("GAME!");

    const winText = this.add.text(W / 2, H * 0.36, `${winnerName} WINS!`, {
      fontSize: "60px", fontFamily: "monospace",
      color: "#ffcc00", stroke: "#000", strokeThickness: 7,
    }).setOrigin(0.5).setDepth(35).setAlpha(0);

    this.tweens.add({
      targets: winText, alpha: 1,
      scaleX: 1.2, scaleY: 1.2,
      duration: 500, yoyo: true, hold: 2500,
    });

    this.cameras.main.shake(500, 0.005);
    this.cameras.main.flash(300, 255, 255, 255);

    this.time.delayedCall(4000, () => {
      gameStore.phase = "results";
    });
  }

  // ── HUD sync ───────────────────────────────────────────────────────────
  private syncGameStore(): void {
    const [f1, f2] = this.fighters;
    gameStore.p1Damage = Math.floor(f1.damage);
    gameStore.p2Damage = Math.floor(f2.damage);
    gameStore.p1Stocks = f1.stocks;
    gameStore.p2Stocks = f2.stocks;
  }

  // ── Combo display ──────────────────────────────────────────────────────
  private showCombo(count: number, playerIdx: number): void {
    if (!this.comboText) return;
    const name = playerIdx === 0 ? gameStore.p1Name : gameStore.p2Name;
    this.comboText.setText(`${name}  ${count} HIT COMBO!`);
    this.comboText.setAlpha(1).setScale(1.2);
    this.tweens.add({ targets: this.comboText, scaleX: 1, scaleY: 1, duration: 200 });
    this.comboFadeTimer = 1400;
  }

  private updateComboText(delta: number): void {
    if (this.comboFadeTimer > 0) {
      this.comboFadeTimer -= delta;
      if (this.comboFadeTimer <= 0) {
        this.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 });
      }
    }
  }

  // ── Dynamic camera — smoothly frames the action ───────────────────────
  private updateCamera(): void {
    const [f1, f2] = this.fighters;
    if (!f1 || !f2) return;

    const midX = (f1.sprite.x + f2.sprite.x) / 2;
    const dist = Math.abs(f1.sprite.x - f2.sprite.x);
    const W = PHYSICS.ARENA_WIDTH;

    // Subtle zoom — pull out slightly when fighters are far apart
    const targetZoom = Phaser.Math.Clamp(850 / Math.max(dist + 200, 350), 0.92, 1.04);
    const cam = this.cameras.main;
    cam.zoom += (targetZoom - cam.zoom) * 0.04;

    // Pan to keep action centered
    const visibleW = cam.width / cam.zoom;
    const targetScrollX = Phaser.Math.Clamp(midX - visibleW / 2, -50, W - visibleW + 50);
    cam.scrollX += (targetScrollX - cam.scrollX) * 0.06;
  }

  // ── Announcer text ─────────────────────────────────────────────────────
  private showAnnouncer(text: string): void {
    if (!this.announcerText) return;
    this.announcerText.setText(text);
    this.announcerText.setAlpha(1).setScale(0.5);
    this.tweens.add({
      targets: this.announcerText,
      scaleX: 1.3, scaleY: 1.3, alpha: 1,
      duration: 250,
      yoyo: true, hold: 800,
      onComplete: () => {
        this.tweens.add({ targets: this.announcerText, alpha: 0, duration: 200 });
      },
    });
  }

  // ── Hit particles ──────────────────────────────────────────────────────
  private spawnHitParticles(x: number, y: number, knockback: number): void {
    const intensity = Math.min(knockback / 100, 2.5);
    const count = 6 + Math.floor(intensity * 6);
    const colors = [0xffffff, 0xffcc00, 0xff4444, 0xff8800, 0xffee88];

    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(3, 6 + Math.floor(intensity * 4));
      const p = this.add.rectangle(x, y, size, size, Phaser.Math.RND.pick(colors), 0.95).setDepth(15);
      const spread = 50 + intensity * 40;
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-spread, spread),
        y: y + Phaser.Math.Between(-spread * 0.7, spread * 0.5),
        alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: Phaser.Math.Between(200, 350 + intensity * 100),
        onComplete: () => p.destroy(),
      });
    }

    // Impact flash on big hits
    if (knockback > 100) {
      const flash = this.add.circle(x, y, 15 + intensity * 10, 0xffffff, 0.6).setDepth(14);
      this.tweens.add({
        targets: flash,
        scaleX: 2.5, scaleY: 2.5, alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy(),
      });
    }
  }

  // ── Wall splat effect ──────────────────────────────────────────────────
  private spawnWallSplatEffect(x: number, y: number): void {
    // Vertical streak of sparks
    for (let i = 0; i < 8; i++) {
      const p = this.add.rectangle(
        x, y + Phaser.Math.Between(-40, 40),
        Phaser.Math.Between(2, 5), Phaser.Math.Between(4, 12),
        0xffcc00, 0.8,
      ).setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-15, 15),
        y: p.y + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(150, 300),
        onComplete: () => p.destroy(),
      });
    }
    // Flash at impact point
    const flash = this.add.circle(x, y, 12, 0xffffff, 0.5).setDepth(14);
    this.tweens.add({
      targets: flash, scaleX: 2, scaleY: 2, alpha: 0,
      duration: 180,
      onComplete: () => flash.destroy(),
    });
  }

  // ── KO blast effect ────────────────────────────────────────────────────
  private spawnKOBlast(fighter: Fighter): void {
    const body = fighter.sprite.body as Phaser.Physics.Arcade.Body;
    const x = Phaser.Math.Clamp(body.x + body.halfWidth, WALL_LEFT, WALL_RIGHT);
    const y = Phaser.Math.Clamp(body.y + body.halfHeight, 50, FLOOR_Y);

    // Explosion ring
    const ring = this.add.circle(x, y, 10, 0xffffff, 0.8).setDepth(30);
    ring.setStrokeStyle(4, 0xffcc00);
    this.tweens.add({
      targets: ring, scaleX: 8, scaleY: 8, alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });

    // Burst particles
    const colors = [0xff4444, 0xffcc00, 0xffffff, 0xff8800];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = Phaser.Math.Between(60, 160);
      const size = Phaser.Math.Between(4, 12);
      const p = this.add.rectangle(x, y, size, size, Phaser.Math.RND.pick(colors), 0.9).setDepth(29);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, rotation: Phaser.Math.Between(-3, 3),
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => p.destroy(),
      });
    }

    // Star
    const star = this.add.star(x, y, 6, 8, 30, 0xffffff, 0.9).setDepth(31);
    this.tweens.add({
      targets: star, scaleX: 4, scaleY: 4, alpha: 0, angle: 90,
      duration: 350,
      onComplete: () => star.destroy(),
    });
  }

  shutdown(): void {
    this.matchTimerEvent?.destroy();
    for (const fighter of this.fighters) fighter.destroy();
    this.fighters = [];
    this.inputs = [];
    this.pendingRespawns = [];
  }
}
