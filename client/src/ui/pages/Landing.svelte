<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
</script>

<div class="flex flex-col items-center justify-center h-full gap-8">
  <div class="text-center">
    <h1 class="text-7xl font-black tracking-tight">
      WONBO
      <span class="text-red-500">KOMBO</span>
    </h1>
    <p class="text-gray-400 text-lg mt-2 tracking-wide">Platform Fighter</p>
    <div class="flex gap-2 justify-center mt-3">
      <span class="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded">3 STOCKS</span>
      <span class="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded">SMASH ATTACKS</span>
      <span class="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">SHIELD + DODGE</span>
    </div>
  </div>

  <div class="flex flex-col gap-3 w-72">
    <button
      class="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-lg transition-colors text-xl"
      onclick={() => router.navigate("character_select")}
    >
      FIGHT! <span class="text-sm font-normal opacity-70">(local)</span>
    </button>

    <button
      class="bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      onclick={() => router.navigate("login")}
    >
      Online Multiplayer
    </button>

    <button
      class="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
      onclick={() => router.navigate("settings")}
    >
      Settings
    </button>
  </div>

  <div class="text-gray-500 text-xs mt-4 text-center space-y-1 max-w-md">
    <p class="text-gray-400 font-bold mb-1.5">CONTROLS</p>
    <div class="grid grid-cols-2 gap-x-6 gap-y-0.5">
      <p><span class="text-gray-300">P1 Move</span> &mdash; WASD</p>
      <p><span class="text-gray-300">P2 Move</span> &mdash; Arrows</p>
      <p><span class="text-gray-300">P1 Attack</span> &mdash; F / G / R</p>
      <p><span class="text-gray-300">P2 Attack</span> &mdash; J / K / L</p>
      <p><span class="text-gray-300">P1 Shield</span> &mdash; E</p>
      <p><span class="text-gray-300">P2 Shield</span> &mdash; I</p>
      <p><span class="text-gray-300">P1 Up Atk</span> &mdash; W+F</p>
      <p><span class="text-gray-300">P2 Up Atk</span> &mdash; Up+J</p>
    </div>
    <p class="text-gray-600 mt-2">Shield + direction = dodge roll | Air shield = air dodge</p>
    <p class="text-gray-600">Hold G/K to charge smash attack | S/Down in air = fast fall</p>
  </div>
</div>
