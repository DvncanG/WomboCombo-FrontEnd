/**
 * Input manager for a single fighter.
 * Caches JustDown results per frame to avoid missed inputs.
 */

export interface FighterInput {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  crouch: boolean;
  lightAttack: boolean;
  heavyAttack: boolean;
  special: boolean;
}

export class FighterInputManager implements FighterInput {
  private bindings: {
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    jump: Phaser.Input.Keyboard.Key[];
    crouch: Phaser.Input.Keyboard.Key[];
    lightAttack: Phaser.Input.Keyboard.Key[];
    heavyAttack: Phaser.Input.Keyboard.Key[];
    special: Phaser.Input.Keyboard.Key[];
  };

  // Cached per-frame JustDown results
  private _jumpPressed = false;
  private _lightAttack = false;
  private _heavyAttack = false;
  private _special = false;

  constructor(scene: Phaser.Scene, playerIndex: 0 | 1 = 0) {
    const kb = scene.input.keyboard!;

    if (playerIndex === 0) {
      // Player 1: WASD + F/G/R
      this.bindings = {
        left: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
        right: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.D)],
        jump: [
          kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        ],
        crouch: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.S)],
        lightAttack: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.F)],
        heavyAttack: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.G)],
        special: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.R)],
      };
    } else {
      // Player 2: Arrows + J/K/L
      this.bindings = {
        left: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)],
        right: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)],
        jump: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP)],
        crouch: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)],
        lightAttack: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.J)],
        heavyAttack: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.K)],
        special: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.L)],
      };
    }
  }

  /** Call once per frame BEFORE reading any input properties */
  update(_delta?: number): void {
    this._jumpPressed = this.justDown(this.bindings.jump);
    this._lightAttack = this.justDown(this.bindings.lightAttack);
    this._heavyAttack = this.justDown(this.bindings.heavyAttack);
    this._special = this.justDown(this.bindings.special);
  }

  private isDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((k) => k.isDown);
  }

  private justDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((k) => Phaser.Input.Keyboard.JustDown(k));
  }

  get left(): boolean {
    return this.isDown(this.bindings.left);
  }

  get right(): boolean {
    return this.isDown(this.bindings.right);
  }

  get jumpPressed(): boolean {
    return this._jumpPressed;
  }

  get crouch(): boolean {
    return this.isDown(this.bindings.crouch);
  }

  get lightAttack(): boolean {
    return this._lightAttack;
  }

  get heavyAttack(): boolean {
    return this._heavyAttack;
  }

  get special(): boolean {
    return this._special;
  }
}
