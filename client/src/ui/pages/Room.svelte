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
    router.navigate("lobby");
  }

  /** DEV ONLY: skip to game without server */
  function devStartGame() {
    gameStore.phase = "playing";
    router.navigate("game");
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-6">
  <div class="flex items-center gap-4">
    <h2 class="text-2xl font-bold">Room</h2>
    {#if lobby.room}
      <span class="bg-gray-700 px-3 py-1 rounded font-mono text-sm">
        {lobby.room.joinCode}
      </span>
    {/if}
  </div>

  <!-- Player list -->
  <div class="bg-gray-800 rounded-lg p-4 w-96">
    <h3 class="text-sm text-gray-400 mb-2">Players</h3>
    {#if lobby.players.length === 0}
      <p class="text-gray-500 text-sm">Waiting for players...</p>
    {:else}
      {#each lobby.players as player}
        <div class="flex justify-between py-1">
          <span>{player.name}</span>
          <span class={player.ready ? "text-green-400" : "text-gray-500"}>
            {player.ready ? "Ready" : "Not ready"}
          </span>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Chat -->
  <div class="bg-gray-800 rounded-lg p-4 w-96 h-40 flex flex-col">
    <div class="flex-1 overflow-y-auto text-sm space-y-1 mb-2">
      {#each lobby.chatMessages as msg}
        <p><span class="text-blue-400">{msg.name}:</span> {msg.message}</p>
      {/each}
    </div>
    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Type a message..."
        bind:value={chatInput}
        class="bg-gray-700 rounded px-3 py-1 flex-1 text-sm focus:outline-none"
        onkeydown={(e: KeyboardEvent) => e.key === "Enter" && sendChat()}
      />
      <button
        class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
        onclick={sendChat}
      >
        Send
      </button>
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
      class={`font-bold py-2 px-6 rounded-lg transition-colors ${
        isReady
          ? "bg-yellow-600 hover:bg-yellow-500"
          : "bg-green-600 hover:bg-green-500"
      } text-white`}
      onclick={toggleReady}
    >
      {isReady ? "Cancel Ready" : "Ready"}
    </button>
  </div>

  <!-- DEV shortcut -->
  {#if import.meta.env.DEV}
    <button
      class="text-xs text-gray-500 hover:text-yellow-400 mt-4"
      onclick={devStartGame}
    >
      [DEV] Start game locally
    </button>
  {/if}
</div>
