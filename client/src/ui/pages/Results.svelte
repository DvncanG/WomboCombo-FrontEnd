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

  function rematch() {
    const p1 = gameStore.p1Character;
    const p2 = gameStore.p2Character;
    const cpu = gameStore.isCPU;
    const stage = gameStore.selectedStage;
    gameStore.reset();
    gameStore.selectedStage = stage;   // preserve chosen stage
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
  <h2 class="text-5xl font-bold" style="color: {winnerColor}">
    {winnerName} WINS!
  </h2>

  <div class="bg-gray-800/80 rounded-xl p-6 w-96 space-y-3">
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">{gameStore.p1Name}</span>
      <span class="font-bold">
        {gameStore.p1Rounds} rounds won &nbsp;|&nbsp; {gameStore.p1Health} HP
      </span>
    </div>
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">{gameStore.p2Name}</span>
      <span class="font-bold">
        {gameStore.p2Rounds} rounds won &nbsp;|&nbsp; {gameStore.p2Health} HP
      </span>
    </div>
  </div>

  <div class="flex flex-col gap-3 w-64">
    <button
      class="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
