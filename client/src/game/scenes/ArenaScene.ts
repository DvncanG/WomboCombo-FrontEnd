import { Fighter } from "../entities/Fighter";
import { FighterInputManager } from "../systems/FighterInputManager";
import { CPUController } from "../systems/CPUController";
import { PHYSICS } from "../config/physics";
import { getFighterConfig, type FighterConfig } from "../config/fighters";
import { gameStore } from "../../lib/stores/game.svelte";

/**
 * Compute sprite.y so that the character's drawn feet land exactly on floorY.
 * Mirrors the body offset math in Fighter constructor.
 *   body.bottom = sprite.y - displayH/2 + offsetY + bh
 *               = sprite.y - displayH/2 + footPx          (offsetY + bh = footPx)
 *               = floorY
 *   → sprite.y = floorY + displayH/2 - footPx
 */
function calcSpawnY(config: FighterConfig, floorY: number): number {
  const scale    = config.scale ?? 1.5;
  const displayH = 128 * scale;
  const footPx   = (config.spriteFootY ?? 0.62) * displayH;
  return floorY + displayH / 2 - footPx;
}

const FLOOR_Y     = PHYSICS.FLOOR_Y;          // body bottom stops here
const WALL_LEFT   = PHYSICS.ARENA_WALL_LEFT;
const WALL_RIGHT  = PHYSICS.ARENA_WALL_RIGHT;

interface ArenaSceneData {
  p1Character: string;
  p2Character: string;
  isCPU: boolean;
}

export class ArenaScene extends Phaser.Scene {
  private fighters: Fighter[] = [];
  private inputs: (FighterInputManager | CPUController)[] = [];
  private isCPU = true;

  // Rounds
  private p1RoundWins = 0;
  private p2RoundWins = 0;
  private currentRound = 1;
  private roundActive = false;

  // Timer
  private matchTimer = PHYSICS.ROUND_TIME;
  private matchTimerEvent?: Phaser.Time.TimerEvent;

  // UI text refs
  private countdownText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private comboFadeTimer = 0;
  private roundText?: Phaser.GameObjects.Text;

  private gameOver = false;

  constructor() {
    super({ key: "ArenaScene" });
  }

  init(data: ArenaSceneData): void {
    this.fighters = [];
    this.inputs = [];
    this.matchTimer = PHYSICS.ROUND_TIME;
    this.roundActive = false;
    this.gameOver = false;
    this.p1RoundWins = 0;
    this.p2RoundWins = 0;
    this.currentRound = 1;

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

    // ── World bounds: left/right walls + floor ──────────────────────
    // Bottom of bounds = FLOOR_Y → body.bottom can't exceed FLOOR_Y
    this.physics.world.setBounds(
      WALL_LEFT, -3000,
      WALL_RIGHT - WALL_LEFT, 3000 + FLOOR_Y
    );

    // ── Background & stage visuals ───────────────────────────────────
    this.drawStage(W, H);

    // ── Create fighters ──────────────────────────────────────────────
    const p1Config = getFighterConfig(data.p1Character);
    const p2Config = getFighterConfig(data.p2Character);

    const fighter1 = new Fighter(this, 220, calcSpawnY(p1Config, FLOOR_Y), p1Config, 0);
    const fighter2 = new Fighter(this, W - 220, calcSpawnY(p2Config, FLOOR_Y), p2Config, 1);
    this.fighters = [fighter1, fighter2];

    // ── Input ────────────────────────────────────────────────────────
    const p1Input = new FighterInputManager(this, 0);
    if (this.isCPU) {
      this.inputs = [p1Input, new CPUController(fighter2, fighter1)];
    } else {
      this.inputs = [p1Input, new FighterInputManager(this, 1)];
    }

    // ── Camera ───────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setScroll(0, 0);

    // ── Game store init ──────────────────────────────────────────────
    gameStore.phase = "playing";
    gameStore.p1Character = data.p1Character;
    gameStore.p2Character = data.p2Character;
    gameStore.p1Name = "Player 1";
    gameStore.p2Name = this.isCPU ? "CPU" : "Player 2";
    gameStore.p1Health = PHYSICS.FIGHTER_HP;
    gameStore.p2Health = PHYSICS.FIGHTER_HP;
    gameStore.p1Rounds = 0;
    gameStore.p2Rounds = 0;
    gameStore.timer = this.matchTimer;
    gameStore.winner = null;

    // ── Combo text ───────────────────────────────────────────────────
    this.comboText = this.add.text(W / 2, H * 0.35, "", {
      fontSize: "28px", fontFamily: "monospace",
      color: "#ffcc00", stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    // ── First round countdown ────────────────────────────────────────
    this.startCountdown();
  }

  // ── Stage visuals ────────────────────────────────────────────────────
  private drawStage(w: number, h: number): void {
    // Use the stage selected in StageSelect (falls back to random)
    const bgKey = gameStore.selectedStage || "bg_city1";

    // Stretch bg to cover full arena
    const bg = this.add.image(w / 2, h / 2, bgKey).setDepth(-10);
    bg.setDisplaySize(w, h);

    // Subtle floor line so players can see where the ground is
    const gfx = this.add.graphics().setDepth(-5);
    gfx.fillStyle(0xffffff, 0.15);
    gfx.fillRect(0, FLOOR_Y, w, 2);
  }

  // ── Countdown ────────────────────────────────────────────────────────
  private startCountdown(): void {
    const W = PHYSICS.ARENA_WIDTH;
    const H = PHYSICS.ARENA_HEIGHT;

    // Show round number
    this.roundText?.destroy();
    this.roundText = this.add.text(W / 2, H * 0.42, `ROUND ${this.currentRound}`, {
      fontSize: "36px", fontFamily: "monospace",
      color: "#ffcc00", stroke: "#000000", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(30);

    this.countdownText = this.add.text(W / 2, H / 2, "3", {
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
          this.roundText?.destroy();
          this.roundText = undefined;
          this.tweens.add({ targets: this.countdownText, scaleX: 1.4, scaleY: 1.4, duration: 200, yoyo: true });
          this.roundActive = true;
          this.startRoundTimer();
        } else {
          this.countdownText?.destroy();
          this.countdownText = undefined;
          countdownEvent.destroy();
        }
      },
    });
  }

  private startRoundTimer(): void {
    this.matchTimer = PHYSICS.ROUND_TIME;
    gameStore.timer = this.matchTimer;

    this.matchTimerEvent?.destroy();
    this.matchTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: PHYSICS.ROUND_TIME - 1,
      callback: () => {
        this.matchTimer--;
        gameStore.timer = this.matchTimer;
        if (this.matchTimer <= 0 && this.roundActive) {
          this.finishRound();
        }
      },
    });
  }

  // ── Main update ──────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    for (const input of this.inputs) input.update(delta);

    if (this.roundActive) {
      for (let i = 0; i < this.fighters.length; i++) {
        this.fighters[i].update(this.inputs[i], delta);
      }
      this.checkHitboxCollisions();
      this.syncGameStore();
      this.updateComboText(delta);
      this.checkRoundEnd();
    }
  }

  // ── Hit detection ────────────────────────────────────────────────────
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
        if (defender.state === "ko" || defender.invulnTimer > 0) continue;

        if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, defender.getHurtbox())) {
          defender.takeHit(attacker.currentAttack!, attacker.facing);
          attacker.hasHitThisAttack = true;

          // Combo tracking
          const now = this.time.now;
          if (now - attacker.lastHitTime < 1200) {
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

          if (attacker.currentAttack!.damage >= 12) {
            this.cameras.main.shake(80, 0.003);
          }
          this.spawnHitParticles(defender.sprite.x, defender.sprite.y - 40);
          break;
        }
      }
    }
  }

  // ── Round end ────────────────────────────────────────────────────────
  private checkRoundEnd(): void {
    if (!this.roundActive) return;
    const [f1, f2] = this.fighters;
    if (f1.hp <= 0 || f2.hp <= 0 || this.matchTimer <= 0) {
      this.finishRound();
    }
  }

  private finishRound(): void {
    if (!this.roundActive) return;
    this.roundActive = false;
    this.matchTimerEvent?.destroy();

    const [f1, f2] = this.fighters;
    let winnerIdx: number;

    if (f1.hp <= 0 && f2.hp <= 0) {
      winnerIdx = -1; // draw
    } else if (f1.hp <= 0) {
      winnerIdx = 1;
    } else if (f2.hp <= 0) {
      winnerIdx = 0;
    } else {
      // Timer ran out — higher HP wins
      winnerIdx = f1.hp > f2.hp ? 0 : f2.hp > f1.hp ? 1 : -1;
    }

    if (winnerIdx === 0) this.p1RoundWins++;
    else if (winnerIdx === 1) this.p2RoundWins++;

    gameStore.p1Rounds = this.p1RoundWins;
    gameStore.p2Rounds = this.p2RoundWins;

    // Show KO / round win text
    const W = PHYSICS.ARENA_WIDTH;
    const H = PHYSICS.ARENA_HEIGHT;

    const koLabel = winnerIdx === -1 ? "DRAW" : "K.O.!";
    const koText = this.add.text(W / 2, H / 2 - 30, koLabel, {
      fontSize: "80px", fontFamily: "monospace",
      color: "#ff4444", stroke: "#000", strokeThickness: 7,
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    this.tweens.add({ targets: koText, alpha: 1, scaleX: 1.15, scaleY: 1.15, duration: 300, yoyo: true, hold: 1200 });

    if (winnerIdx !== -1) {
      const winName = winnerIdx === 0 ? gameStore.p1Name : gameStore.p2Name;
      const winSub = this.add.text(W / 2, H / 2 + 50, `${winSub_name(winName)} WINS THE ROUND`, {
        fontSize: "22px", fontFamily: "monospace",
        color: "#ffcc00", stroke: "#000", strokeThickness: 4,
      }).setOrigin(0.5).setDepth(30);

      this.time.delayedCall(2200, () => winSub.destroy());
    }

    // Screen flash + shake on KO
    this.cameras.main.flash(250, 255, 255, 255);
    this.cameras.main.shake(400, 0.007);

    const matchOver =
      this.p1RoundWins >= PHYSICS.ROUNDS_TO_WIN ||
      this.p2RoundWins >= PHYSICS.ROUNDS_TO_WIN;

    if (matchOver) {
      this.time.delayedCall(2500, () => {
        koText.destroy();
        this.endMatch();
      });
    } else {
      this.time.delayedCall(2500, () => {
        koText.destroy();
        this.startNextRound();
      });
    }
  }

  private startNextRound(): void {
    this.currentRound++;
    const W = PHYSICS.ARENA_WIDTH;

    this.fighters[0].resetForRound(220, calcSpawnY(this.fighters[0].config, FLOOR_Y));
    this.fighters[1].resetForRound(W - 220, calcSpawnY(this.fighters[1].config, FLOOR_Y));

    gameStore.p1Health = PHYSICS.FIGHTER_HP;
    gameStore.p2Health = PHYSICS.FIGHTER_HP;

    this.startCountdown();
  }

  private endMatch(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    const [f1, f2] = this.fighters;
    let winnerIdx: number;
    if (this.p1RoundWins > this.p2RoundWins) winnerIdx = 0;
    else if (this.p2RoundWins > this.p1RoundWins) winnerIdx = 1;
    else winnerIdx = f1.hp >= f2.hp ? 0 : 1;

    const winnerName = winnerIdx === 0 ? gameStore.p1Name : gameStore.p2Name;
    gameStore.winner = winnerName;
    gameStore.phase = "game_over";

    const W = PHYSICS.ARENA_WIDTH;
    const H = PHYSICS.ARENA_HEIGHT;

    const winText = this.add.text(W / 2, H / 2 - 40, `${winnerName} WINS!`, {
      fontSize: "60px", fontFamily: "monospace",
      color: "#ffcc00", stroke: "#000", strokeThickness: 7,
    }).setOrigin(0.5).setDepth(35).setAlpha(0);

    this.tweens.add({ targets: winText, alpha: 1, scaleX: 1.2, scaleY: 1.2, duration: 500, yoyo: true, hold: 2000 });
    this.cameras.main.shake(500, 0.006);

    this.time.delayedCall(3500, () => {
      gameStore.phase = "results";
    });
  }

  // ── HUD sync ─────────────────────────────────────────────────────────
  private syncGameStore(): void {
    const [f1, f2] = this.fighters;
    gameStore.p1Health = Math.max(0, Math.floor(f1.hp));
    gameStore.p2Health = Math.max(0, Math.floor(f2.hp));
  }

  // ── Combo display ─────────────────────────────────────────────────────
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

  // ── Hit particles ─────────────────────────────────────────────────────
  private spawnHitParticles(x: number, y: number): void {
    const colors = [0xffffff, 0xffcc00, 0xff4444, 0xff8800];
    for (let i = 0; i < 8; i++) {
      const p = this.add.rectangle(
        x, y,
        Phaser.Math.Between(3, 9), Phaser.Math.Between(3, 9),
        Phaser.Math.RND.pick(colors), 0.9
      ).setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-70, 70),
        y: y + Phaser.Math.Between(-50, 30),
        alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: Phaser.Math.Between(200, 400),
        onComplete: () => p.destroy(),
      });
    }
  }

  shutdown(): void {
    this.matchTimerEvent?.destroy();
    for (const fighter of this.fighters) fighter.destroy();
    this.fighters = [];
    this.inputs = [];
  }
}

// Helper — avoids issues with variable scope in delayed callbacks
function winSub_name(name: string): string { return name; }
