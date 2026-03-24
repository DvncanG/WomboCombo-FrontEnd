<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { gameStore } from "../../lib/stores/game.svelte";
  import { setSceneData } from "../../game/PhaserGame";
  import { FIGHTERS } from "../../game/config/fighters";

  let winnerName = $derived(gameStore.winner ?? "Draw");
  let winnerChar = $derived(
    gameStore.winner === gameStore.p1Name ? gameStore.p1Character : gameStore.p2Character
  );
  let winnerColor = $derived(
    FIGHTERS[winnerChar]?.color
      ? `#${FIGHTERS[winnerChar].color.toString(16).padStart(6, "0")}`
      : "#ffcc00"
  );

  let p1FighterName = $derived(FIGHTERS[gameStore.p1Character]?.name ?? "P1");
  let p2FighterName = $derived(FIGHTERS[gameStore.p2Character]?.name ?? "P2");

  function colorHex(charId: string): string {
    const c = FIGHTERS[charId]?.color ?? 0x888888;
    return `#${c.toString(16).padStart(6, "0")}`;
  }

  function rematch() {
    const p1 = gameStore.p1Character;
    const p2 = gameStore.p2Character;
    const cpu = gameStore.isCPU;
    const stage = gameStore.selectedStage;
    gameStore.reset();
    gameStore.selectedStage = stage;
    setSceneData({ p1Character: p1, p2Character: p2, isCPU: cpu });
    router.navigate("game");
  }

  function characterSelect() {
    gameStore.reset();
    router.navigate("character_select");
  }

  function mainMenu() {
    gameStore.reset();
    router.navigate("landing");
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-6">
  <!-- Winner announcement -->
  <div class="text-center">
    <div class="text-lg text-gray-400 uppercase tracking-widest mb-2">Victory</div>
    <h2 class="text-5xl font-black" style="color: {winnerColor}; text-shadow: 0 0 30px {winnerColor}66;">
      {winnerName} WINS!
    </h2>
  </div>

  <!-- Match stats -->
  <div class="bg-gray-900/90 rounded-xl p-6 w-[420px] space-y-4 border border-gray-800">
    <!-- P1 stats -->
    <div class="flex items-center justify-between py-3 border-b border-gray-800">
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-blue-400 bg-blue-400/20 px-2 py-0.5 rounded">P1</span>
        <div>
          <div class="font-bold" style="color: {colorHex(gameStore.p1Character)}">{p1FighterName}</div>
          <div class="text-xs text-gray-500">{gameStore.p1Name}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-black font-mono">{gameStore.p1Damage}<span class="text-sm text-gray-500">%</span></div>
        <div class="flex gap-1 justify-end mt-1">
          {#each Array(gameStore.totalStocks) as _, i}
            <div class="w-2.5 h-2.5 rounded-full"
                 style="background: {i < gameStore.p1Stocks ? colorHex(gameStore.p1Character) : 'rgba(255,255,255,0.15)'};">
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- P2 stats -->
    <div class="flex items-center justify-between py-3">
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold px-2 py-0.5 rounded"
              style="color: white; background: {gameStore.isCPU ? '#666' : '#ef4444'};">
          {gameStore.isCPU ? "CPU" : "P2"}
        </span>
        <div>
          <div class="font-bold" style="color: {colorHex(gameStore.p2Character)}">{p2FighterName}</div>
          <div class="text-xs text-gray-500">{gameStore.p2Name}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-black font-mono">{gameStore.p2Damage}<span class="text-sm text-gray-500">%</span></div>
        <div class="flex gap-1 justify-end mt-1">
          {#each Array(gameStore.totalStocks) as _, i}
            <div class="w-2.5 h-2.5 rounded-full"
                 style="background: {i < gameStore.p2Stocks ? colorHex(gameStore.p2Character) : 'rgba(255,255,255,0.15)'};">
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex flex-col gap-3 w-64">
    <button
      class="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
      onclick={rematch}
    >
      REMATCH
    </button>
    <button
      class="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
      onclick={characterSelect}
    >
      Character Select
    </button>
    <button
      class="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-6 rounded-lg transition-colors"
      onclick={mainMenu}
    >
      Main Menu
    </button>
  </div>
</div>
