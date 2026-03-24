<script lang="ts">
  import { gameStore } from "../../lib/stores/game.svelte";
  import { FIGHTERS } from "../../game/config/fighters";

  let timerDisplay = $derived(Math.max(0, Math.ceil(gameStore.timer)));
  let timerMinutes = $derived(Math.floor(timerDisplay / 60));
  let timerSeconds = $derived(timerDisplay % 60);

  // Damage color: white at 0%, yellow at 80%, orange at 130%, red at 180%+
  function damageColor(dmg: number): string {
    if (dmg < 50) return "#ffffff";
    if (dmg < 100) return "#ffee44";
    if (dmg < 150) return "#ff8800";
    return "#ff2222";
  }

  function damageGlow(dmg: number): string {
    if (dmg < 50) return "none";
    if (dmg < 100) return "0 0 12px rgba(255,238,68,0.4)";
    if (dmg < 150) return "0 0 16px rgba(255,136,0,0.5)";
    return "0 0 20px rgba(255,34,34,0.6)";
  }

  let p1FighterName = $derived(FIGHTERS[gameStore.p1Character]?.name ?? "P1");
  let p2FighterName = $derived(FIGHTERS[gameStore.p2Character]?.name ?? "P2");

  function colorHex(charId: string): string {
    const c = FIGHTERS[charId]?.color ?? 0x888888;
    return `#${c.toString(16).padStart(6, "0")}`;
  }
</script>

{#if gameStore.phase === "playing" || gameStore.phase === "game_over" || gameStore.phase === "ko" || gameStore.phase === "respawn"}

<!-- Top: Timer only -->
<div class="absolute top-0 left-0 right-0 pointer-events-none flex justify-center pt-2">
  <div class="bg-black/60 rounded-lg px-4 py-1.5 border border-gray-700/50">
    <span class="text-2xl font-bold font-mono leading-none"
          class:text-red-400={timerDisplay <= 30}
          class:text-yellow-400={timerDisplay > 30 && timerDisplay <= 60}>
      {timerMinutes}:{timerSeconds.toString().padStart(2, "0")}
    </span>
  </div>
</div>

<!-- Bottom: Smash-style damage panels -->
<div class="absolute bottom-0 left-0 right-0 pointer-events-none">
  <div class="flex justify-center gap-8 pb-3 px-4">

    <!-- P1 Panel -->
    <div class="relative flex flex-col items-center">
      <!-- Character name -->
      <div class="text-xs font-bold tracking-wider uppercase mb-1"
           style="color: {colorHex(gameStore.p1Character)}">
        {p1FighterName}
      </div>

      <!-- Damage panel -->
      <div class="relative bg-gradient-to-b from-gray-900/90 to-black/95 rounded-xl px-8 py-3 border-2 min-w-[160px] text-center"
           style="border-color: {colorHex(gameStore.p1Character)}40;">

        <!-- Player label -->
        <div class="absolute -top-2.5 left-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          P1
        </div>

        <!-- Damage percentage -->
        <div class="text-4xl font-black font-mono leading-none tracking-tight transition-all duration-75"
             style="color: {damageColor(gameStore.p1Damage)}; text-shadow: {damageGlow(gameStore.p1Damage)};">
          {gameStore.p1Damage}<span class="text-2xl">%</span>
        </div>

        <!-- Stock icons -->
        <div class="flex justify-center gap-1.5 mt-2">
          {#each Array(gameStore.totalStocks) as _, i}
            <div class="w-3.5 h-3.5 rounded-full transition-all duration-200"
                 style="background: {i < gameStore.p1Stocks ? colorHex(gameStore.p1Character) : 'rgba(255,255,255,0.1)'};
                        box-shadow: {i < gameStore.p1Stocks ? `0 0 6px ${colorHex(gameStore.p1Character)}88` : 'none'};">
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- VS divider -->
    <div class="flex items-center">
      <span class="text-gray-600 text-lg font-bold">VS</span>
    </div>

    <!-- P2 Panel -->
    <div class="relative flex flex-col items-center">
      <!-- Character name -->
      <div class="text-xs font-bold tracking-wider uppercase mb-1"
           style="color: {colorHex(gameStore.p2Character)}">
        {p2FighterName}
      </div>

      <!-- Damage panel -->
      <div class="relative bg-gradient-to-b from-gray-900/90 to-black/95 rounded-xl px-8 py-3 border-2 min-w-[160px] text-center"
           style="border-color: {colorHex(gameStore.p2Character)}40;">

        <!-- Player label -->
        <div class="absolute -top-2.5 right-3 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
             style="background: {gameStore.isCPU ? '#888' : '#ef4444'};">
          {gameStore.isCPU ? "CPU" : "P2"}
        </div>

        <!-- Damage percentage -->
        <div class="text-4xl font-black font-mono leading-none tracking-tight transition-all duration-75"
             style="color: {damageColor(gameStore.p2Damage)}; text-shadow: {damageGlow(gameStore.p2Damage)};">
          {gameStore.p2Damage}<span class="text-2xl">%</span>
        </div>

        <!-- Stock icons -->
        <div class="flex justify-center gap-1.5 mt-2">
          {#each Array(gameStore.totalStocks) as _, i}
            <div class="w-3.5 h-3.5 rounded-full transition-all duration-200"
                 style="background: {i < gameStore.p2Stocks ? colorHex(gameStore.p2Character) : 'rgba(255,255,255,0.1)'};
                        box-shadow: {i < gameStore.p2Stocks ? `0 0 6px ${colorHex(gameStore.p2Character)}88` : 'none'};">
            </div>
          {/each}
        </div>
      </div>
    </div>

  </div>
</div>

{/if}
