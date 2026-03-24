<script lang="ts">
  import { onMount } from "svelte";
  import { router } from "../../lib/stores/router.svelte";
  import { gameStore } from "../../lib/stores/game.svelte";
  import { setSceneData } from "../../game/PhaserGame";
  import { FIGHTER_IDS, FIGHTERS, type FighterConfig } from "../../game/config/fighters";
  import { settings } from "../../lib/stores/settings.svelte";

  let p1Selection = $state(0);
  let p2Selection = $state(1);
  let p1Ready = $state(false);
  let p2Ready = $state(false);
  let countdown = $state(-1);
  // Online mode: isCPU=false was set by lobby flow; local mode defaults to CPU
  let isCPU = $state(gameStore.isCPU !== false);

  let fighterList = FIGHTER_IDS;

  function getConfig(index: number): FighterConfig {
    return FIGHTERS[fighterList[index]];
  }

  function colorHex(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  function statBar(value: number, max: number): number {
    return Math.round((value / max) * 100);
  }

  /** CSS style to clip the first frame of an idle spritesheet at 96×96 display */
  function spriteStyle(config: FighterConfig): string {
    // Frame is 128×128px. We show it at 96px → scale = 0.75
    const displayH = 96;
    const displayW = 96;
    const scaleFactor = displayH / 128;
    const totalW = config.idleFrames * 128 * scaleFactor;
    return [
      `width: ${displayW}px`,
      `height: ${displayH}px`,
      `background-image: url('/${config.previewSprite}')`,
      `background-size: ${totalW}px ${displayH}px`,
      `background-position: 0 0`,
      `background-repeat: no-repeat`,
      `image-rendering: pixelated`,
    ].join("; ");
  }

  onMount(() => {
    gameStore.phase = "character_select";

    function handleKey(e: KeyboardEvent) {
      // P1 controls: A/D to navigate, F to confirm
      if (!p1Ready) {
        if (e.key === "a" || e.key === "A") {
          p1Selection = (p1Selection - 1 + fighterList.length) % fighterList.length;
        } else if (e.key === "d" || e.key === "D") {
          p1Selection = (p1Selection + 1) % fighterList.length;
        } else if (e.key === "f" || e.key === "F") {
          p1Ready = true;
          checkBothReady();
        }
      } else if (e.key === "f" || e.key === "F") {
        p1Ready = false;
        countdown = -1;
      }

      // P2 controls: Arrows to navigate, J to confirm (or CPU mode)
      if (!isCPU) {
        if (!p2Ready) {
          if (e.key === "ArrowLeft") {
            p2Selection = (p2Selection - 1 + fighterList.length) % fighterList.length;
          } else if (e.key === "ArrowRight") {
            p2Selection = (p2Selection + 1) % fighterList.length;
          } else if (e.key === "j" || e.key === "J") {
            p2Ready = true;
            checkBothReady();
          }
        } else if (e.key === "j" || e.key === "J") {
          p2Ready = false;
          countdown = -1;
        }
      }

      // Toggle CPU mode with Tab
      if (e.key === "Tab") {
        e.preventDefault();
        isCPU = !isCPU;
        if (isCPU) {
          p2Ready = true;
          checkBothReady();
        } else {
          p2Ready = false;
          countdown = -1;
        }
      }

      // Back with Escape
      if (e.key === "Escape") {
        router.navigate("landing");
      }
    }

    window.addEventListener("keydown", handleKey);
    // Auto-ready CPU
    if (isCPU) {
      p2Ready = true;
    }

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  });

  function checkBothReady() {
    if (p1Ready && (p2Ready || isCPU)) {
      startCountdown();
    }
  }

  function startCountdown() {
    countdown = 3;
    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        startGame();
      }
    }, 700);
  }

  function startGame() {
    const p1Char = fighterList[p1Selection];
    // CPU always picks a random character
    const p2Char = isCPU
      ? fighterList[Math.floor(Math.random() * fighterList.length)]
      : fighterList[p2Selection];

    gameStore.p1Character = p1Char;
    gameStore.p2Character = p2Char;
    gameStore.isCPU = isCPU;
    gameStore.p1Name = settings.playerName || "Player 1";
    gameStore.p2Name = isCPU ? "CPU" : "Player 2";

    setSceneData({
      p1Character: p1Char,
      p2Character: p2Char,
      isCPU: isCPU,
    });

    router.navigate("stage_select");
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-6 p-8">
  <h1 class="text-4xl font-bold tracking-tight">
    SELECT YOUR <span class="text-red-500">FIGHTER</span>
  </h1>

  <div class="text-sm text-gray-500">
    Press <span class="text-gray-300">TAB</span> to toggle {isCPU ? "2P mode" : "CPU mode"}
  </div>

  <!-- Fighter cards -->
  <div class="flex gap-6 justify-center flex-wrap">
    {#each fighterList as fighterId, idx}
      {@const config = FIGHTERS[fighterId]}
      {@const isP1 = idx === p1Selection}
      {@const isP2 = idx === p2Selection}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="relative w-52 rounded-xl p-4 transition-all duration-200 cursor-pointer"
        style="background: {isP1 || isP2 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'};
               border: 3px solid {isP1 ? '#4488ff' : isP2 ? '#ff4444' : 'transparent'};
               transform: scale({isP1 || isP2 ? 1.05 : 1})"
        onclick={() => {
          if (!p1Ready) p1Selection = idx;
        }}
      >
        <!-- Selection indicators -->
        <div class="flex justify-between mb-2">
          {#if isP1}
            <span class="text-xs font-bold text-blue-400 bg-blue-400/20 px-2 py-0.5 rounded">P1</span>
          {:else}
            <span></span>
          {/if}
          {#if isP2}
            <span class="text-xs font-bold text-red-400 bg-red-400/20 px-2 py-0.5 rounded">{isCPU ? "CPU" : "P2"}</span>
          {/if}
        </div>

        <!-- Fighter preview — first frame of idle spritesheet -->
        <div class="flex justify-center mb-3">
          <div style="{spriteStyle(config)}"></div>
        </div>

        <!-- Name -->
        <h3 class="text-xl font-bold text-center" style="color: {colorHex(config.color)}">
          {config.name}
        </h3>
        <p class="text-xs text-gray-500 text-center mt-1 h-8">{config.description}</p>

        <!-- Stats -->
        <div class="mt-3 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-12">SPD</span>
            <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full bg-yellow-500 rounded-full" style="width: {statBar(config.speed, 400)}%"></div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-12">PWR</span>
            <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full bg-red-500 rounded-full" style="width: {statBar(config.attacks.heavy.damage, 28)}%"></div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-12">WGT</span>
            <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full" style="width: {statBar(config.weight, 170)}%"></div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Ready status -->
  <div class="flex gap-12 mt-4">
    <div class="text-center">
      <div class="text-sm text-gray-500 mb-1">{settings.playerName || "Player 1"}</div>
      {#if p1Ready}
        <div class="text-green-400 font-bold text-lg">READY!</div>
      {:else}
        <div class="text-gray-500 text-sm">A/D to select, F to confirm</div>
      {/if}
    </div>
    <div class="text-center">
      <div class="text-sm text-gray-500 mb-1">{isCPU ? "CPU" : "Player 2"}</div>
      {#if p2Ready || isCPU}
        <div class="text-green-400 font-bold text-lg">READY!</div>
      {:else}
        <div class="text-gray-500 text-sm">Arrows to select, J to confirm</div>
      {/if}
    </div>
  </div>

  <!-- Countdown -->
  {#if countdown > 0}
    <div class="text-5xl font-bold text-yellow-400 animate-pulse">
      {countdown}
    </div>
  {/if}

  <button
    class="text-gray-600 hover:text-gray-400 text-sm mt-2"
    onclick={() => router.navigate("landing")}
  >
    Back to Menu
  </button>
</div>
