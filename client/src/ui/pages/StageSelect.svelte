<script lang="ts">
  import { onMount } from "svelte";
  import { router } from "../../lib/stores/router.svelte";
  import { gameStore } from "../../lib/stores/game.svelte";

  const stages = [
    { key: "bg_city1", name: "Callejón",   img: "/assets/backgrounds/city1.png" },
    { key: "bg_city2", name: "Almacén",    img: "/assets/backgrounds/city2.png" },
    { key: "bg_city3", name: "Estación",   img: "/assets/backgrounds/city3.png" },
    { key: "bg_city4", name: "Azotea",     img: "/assets/backgrounds/city4.png" },
  ];

  let selected = $state(0);

  onMount(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        selected = (selected - 1 + stages.length) % stages.length;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        selected = (selected + 1) % stages.length;
      } else if (e.key === "Enter" || e.key === "f" || e.key === "F") {
        confirm();
      } else if (e.key === "Escape") {
        router.navigate("character_select");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function confirm() {
    gameStore.selectedStage = stages[selected].key;
    router.navigate("game");
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8 landscape-compact landscape-scroll">
  <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
    SELECCIONA el <span class="text-yellow-400">ESCENARIO</span>
  </h1>

  <p class="text-xs sm:text-sm text-gray-500">
    ← → para navegar &nbsp;|&nbsp; <span class="text-gray-300">F / Enter</span> para confirmar
  </p>

  <!-- Stage cards -->
  <div class="flex gap-3 sm:gap-4 md:gap-5 justify-center flex-wrap mt-1 sm:mt-2">
    {#each stages as stage, idx}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 w-40 sm:w-52 md:w-[260px]"
        style="
          border: 3px solid {idx === selected ? '#facc15' : 'transparent'};
          transform: scale({idx === selected ? 1.06 : 1});
          box-shadow: {idx === selected ? '0 0 20px rgba(250,204,21,0.4)' : 'none'};
        "
        onclick={() => { selected = idx; }}
        ondblclick={confirm}
      >
        <!-- Background preview -->
        <img
          src={stage.img}
          alt={stage.name}
          class="w-full object-cover"
          style="height: 80px; image-rendering: pixelated;"
        />

        <!-- Name bar -->
        <div
          class="py-1.5 sm:py-2 text-center font-bold text-xs sm:text-sm md:text-base tracking-wide"
          style="background: {idx === selected ? 'rgba(250,204,21,0.15)' : 'rgba(0,0,0,0.6)'}; color: {idx === selected ? '#facc15' : '#ccc'};"
        >
          {stage.name}
        </div>

        <!-- Selected indicator -->
        {#if idx === selected}
          <div class="absolute top-1 sm:top-2 right-1 sm:right-2 bg-yellow-400 text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded">
            SELECCIONADO
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Confirm button -->
  <button
    class="mt-2 sm:mt-4 px-6 sm:px-10 py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-lg text-black transition-all"
    style="background: #facc15;"
    onclick={confirm}
  >
    ¡A PELEAR!
  </button>

  <button
    class="text-gray-600 hover:text-gray-400 text-xs sm:text-sm"
    onclick={() => router.navigate("character_select")}
  >
    Volver a personajes
  </button>
</div>
