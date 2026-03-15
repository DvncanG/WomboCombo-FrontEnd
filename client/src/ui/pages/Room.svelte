<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { lobby } from "../../lib/stores/lobby.svelte";
  import { socket } from "../../lib/network/socket";
  import { gameStore } from "../../lib/stores/game.svelte";

  let chatInput = $state("");
  let isReady = $state(false);

  function toggleReady() {
    isReady = !isReady;
    socket.send({ type: "player_ready", ready: isReady });
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    socket.send({ type: "chat_message", message: chatInput.trim() });
    chatInput = "";
  }

  function leaveRoom() {
    socket.disconnect();
    lobby.clear();
    isReady = false;
    router.navigate("lobby");
  }

  // Watch for game start (all players ready → server sends game_start)
  $effect(() => {
    if (gameStore.phase === "character_select") {
      router.navigate("character_select");
    }
  });

  let allReady = $derived(
    lobby.players.length >= 2 && lobby.players.every(p => p.ready)
  );

  function copyCode() {
    if (lobby.room?.joinCode) {
      navigator.clipboard.writeText(lobby.room.joinCode);
    }
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-6">
  <!-- Room code (shareable) -->
  <div class="text-center">
    <h2 class="text-2xl font-bold mb-2">Room</h2>
    {#if lobby.room}
      <div class="flex items-center gap-2 justify-center">
        <span class="bg-gray-700 px-5 py-2 rounded-lg font-mono text-2xl tracking-widest text-yellow-300">
          {lobby.room.joinCode}
        </span>
        <button
          class="text-gray-400 hover:text-white text-sm bg-gray-700 px-3 py-2 rounded-lg"
          onclick={copyCode}
          title="Copy code"
        >
          Copy
        </button>
      </div>
      <p class="text-gray-500 text-xs mt-1">Share this code with your opponent</p>
    {/if}
  </div>

  <!-- Player list -->
  <div class="bg-gray-800 rounded-xl p-4 w-96">
    <h3 class="text-sm text-gray-400 mb-3">Players ({lobby.players.length}/2)</h3>
    {#if lobby.players.length === 0}
      <p class="text-gray-500 text-sm italic">Waiting for players to connect...</p>
    {:else}
      {#each lobby.players as player}
        <div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
          <span class="font-medium">{player.name}</span>
          <span class={`text-sm font-bold ${player.ready ? "text-green-400" : "text-gray-500"}`}>
            {player.ready ? "READY" : "Not ready"}
          </span>
        </div>
      {/each}
    {/if}

    {#if allReady}
      <div class="mt-3 text-center text-green-400 text-sm animate-pulse font-bold">
        Both players ready! Starting...
      </div>
    {/if}
  </div>

  <!-- Chat -->
  <div class="bg-gray-800 rounded-xl p-3 w-96 h-36 flex flex-col">
    <div class="flex-1 overflow-y-auto text-sm space-y-1 mb-2 pr-1">
      {#each lobby.chatMessages as msg}
        <p><span class="text-blue-400 font-medium">{msg.name}:</span> {msg.message}</p>
      {/each}
    </div>
    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Chat..."
        bind:value={chatInput}
        class="bg-gray-700 rounded px-3 py-1 flex-1 text-sm focus:outline-none"
        onkeydown={(e: KeyboardEvent) => e.key === "Enter" && sendChat()}
      />
      <button
        class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
        onclick={sendChat}
      >Send</button>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex gap-3">
    <button
      class="bg-gray-600 hover:bg-gray-500 text-white py-2 px-6 rounded-lg transition-colors"
      onclick={leaveRoom}
    >
      Leave
    </button>
    <button
      class={`font-bold py-2 px-8 rounded-lg transition-colors ${
        isReady
          ? "bg-yellow-600 hover:bg-yellow-500"
          : "bg-green-600 hover:bg-green-500"
      } text-white`}
      onclick={toggleReady}
    >
      {isReady ? "Cancel" : "READY!"}
    </button>
  </div>
</div>
