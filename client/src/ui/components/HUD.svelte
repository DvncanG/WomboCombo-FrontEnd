<script lang="ts">
  import { gameStore } from "../../lib/stores/game.svelte";
  import { FIGHTERS } from "../../game/config/fighters";

  const MAX_HP = 100;
  const ROUNDS_TO_WIN = 2;

  let timerDisplay = $derived(Math.max(0, Math.ceil(gameStore.timer)));

  let p1Pct = $derived(Math.max(0, (gameStore.p1Health / MAX_HP) * 100));
  let p2Pct = $derived(Math.max(0, (gameStore.p2Health / MAX_HP) * 100));

  let p1BarColor = $derived(
    p1Pct > 50 ? "#22c55e" : p1Pct > 25 ? "#eab308" : "#ef4444"
  );
  let p2BarColor = $derived(
    p2Pct > 50 ? "#22c55e" : p2Pct > 25 ? "#eab308" : "#ef4444"
  );

  let p1FighterName = $derived(FIGHTERS[gameStore.p1Character]?.name ?? "P1");
  let p2FighterName = $derived(FIGHTERS[gameStore.p2Character]?.name ?? "P2");

  function colorHex(charId: string): string {
    const c = FIGHTERS[charId]?.color ?? 0x888888;
    return `#${c.toString(16).padStart(6, "0")}`;
  }
</script>

{#if gameStore.phase === "playing" || gameStore.phase === "game_over" || gameStore.phase === "ko"}
<div class="absolute top-0 left-0 right-0 pointer-events-none px-4 pt-3">
  <div class="flex items-start gap-3">

    <!-- ── P1 block ── -->
    <div class="flex flex-col gap-1 flex-1">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-bold tracking-widest uppercase"
              style="color: {colorHex(gameStore.p1Character)}">
          {p1FighterName}
        </span>
        <span class="text-xs text-blue-400 font-bold">P1</span>
      </div>
      <!-- Health bar — fills L→R -->
      <div class="h-5 bg-black/70 rounded border border-gray-700 overflow-hidden">
        <div
          class="h-full rounded transition-all duration-100"
          style="width: {p1Pct}%; background: {p1BarColor};
                 box-shadow: 0 0 6px {p1BarColor}88;"
        ></div>
      </div>
      <!-- Round wins -->
      <div class="flex gap-1.5 mt-0.5">
        {#each Array(ROUNDS_TO_WIN) as _, i}
          <div class="w-3 h-3 rounded-full border"
               style="border-color: {colorHex(gameStore.p1Character)};
                      background-color: {i < gameStore.p1Rounds ? colorHex(gameStore.p1Character) : 'transparent'}">
          </div>
        {/each}
      </div>
    </div>

    <!-- ── Center: Timer ── -->
    <div class="flex flex-col items-center pt-1 min-w-[56px]">
      <div class="text-2xl font-bold font-mono leading-none"
           class:text-red-400={timerDisplay <= 10}
           class:text-yellow-400={timerDisplay > 10 && timerDisplay <= 30}>
        {timerDisplay}
      </div>
    </div>

    <!-- ── P2 block ── -->
    <div class="flex flex-col gap-1 flex-1">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs text-red-400 font-bold">{gameStore.isCPU ? "CPU" : "P2"}</span>
        <span class="text-xs font-bold tracking-widest uppercase"
              style="color: {colorHex(gameStore.p2Character)}">
          {p2FighterName}
        </span>
      </div>
      <!-- Health bar — fills R→L (flex row-reverse) -->
      <div class="h-5 bg-black/70 rounded border border-gray-700 overflow-hidden flex flex-row-reverse">
        <div
          class="h-full rounded transition-all duration-100"
          style="width: {p2Pct}%; background: {p2BarColor};
                 box-shadow: 0 0 6px {p2BarColor}88;"
        ></div>
      </div>
      <!-- Round wins (right-aligned) -->
      <div class="flex gap-1.5 mt-0.5 justify-end">
        {#each Array(ROUNDS_TO_WIN) as _, i}
          <div class="w-3 h-3 rounded-full border"
               style="border-color: {colorHex(gameStore.p2Character)};
                      background-color: {i < gameStore.p2Rounds ? colorHex(gameStore.p2Character) : 'transparent'}">
          </div>
        {/each}
      </div>
    </div>

  </div>
</div>
{/if}
