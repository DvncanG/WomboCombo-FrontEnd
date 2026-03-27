<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { lobby } from "../../lib/stores/lobby.svelte";
  import { auth } from "../../lib/stores/auth.svelte";
  import { api } from "../../lib/api/client";
  import { gameStore } from "../../lib/stores/game.svelte";

  interface RoomResponse {
    room: { id: number; code: string; name: string; host_id: number; max_players: number; status: string };
  }
  interface RoomListResponse {
    rooms: Array<{ id: number; code: string; name: string; host_name: string; player_count: number; max_players: number }>;
  }

  let joinCode = $state("");
  let roomName = $state("Fight Room");
  let error = $state("");
  let loading = $state(false);
  let publicRooms = $state<RoomListResponse["rooms"]>([]);

  loadRooms();

  async function loadRooms() {
    try {
      const res = await api.get<RoomListResponse>("/rooms");
      publicRooms = res.rooms ?? [];
    } catch { /* ignore */ }
  }

  async function createRoom() {
    error = "";
    loading = true;
    try {
      const res = await api.post<RoomResponse>("/rooms", { name: roomName || "Fight Room" });
      lobby.setRoom({ roomId: String(res.room.id), joinCode: res.room.code });
      gameStore.isCPU = false;
      gameStore.p1Name = auth.user?.display_name ?? auth.user?.username ?? "Player";
      router.navigate("room");
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to create room";
    } finally {
      loading = false;
    }
  }

  async function joinRoom(code?: string) {
    const roomCode = (code ?? joinCode).trim().toUpperCase();
    if (!roomCode) { error = "Enter a room code"; return; }
    error = "";
    loading = true;
    try {
      const res = await api.post<RoomResponse>(`/rooms/${roomCode}/join`, {});
      lobby.setRoom({ roomId: String(res.room.id), joinCode: res.room.code });
      gameStore.isCPU = false;
      gameStore.p1Name = auth.user?.display_name ?? auth.user?.username ?? "Player";
      router.navigate("room");
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to join room";
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-8">
  <h2 class="text-3xl font-bold">Online Multiplayer</h2>
  <p class="text-gray-400 text-sm">Logged in as <span class="text-white font-medium">{auth.user?.username}</span></p>

  {#if error}
    <p class="text-red-400 text-sm">{error}</p>
  {/if}

  <div class="flex flex-col gap-4 w-96">
    <!-- Create room -->
    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Room name"
        bind:value={roomName}
        class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 flex-1 focus:outline-none focus:border-green-500"
      />
      <button
        class="bg-green-600 hover:bg-green-500 text-white font-bold px-6 rounded-lg transition-colors"
        onclick={createRoom}
        disabled={loading}
      >
        Create
      </button>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex-1 border-t border-gray-700"></div>
      <span class="text-gray-500 text-sm">or join</span>
      <div class="flex-1 border-t border-gray-700"></div>
    </div>

    <!-- Join by code -->
    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Room code"
        bind:value={joinCode}
        maxlength="8"
        class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 flex-1 uppercase tracking-widest focus:outline-none focus:border-blue-500"
      />
      <button
        class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-lg transition-colors"
        onclick={() => joinRoom()}
        disabled={loading}
      >
        Join
      </button>
    </div>

    <!-- Public rooms list -->
    {#if publicRooms.length > 0}
      <div class="bg-gray-800 rounded-xl p-4 mt-2">
        <h3 class="text-sm text-gray-400 mb-3">Public Rooms</h3>
        {#each publicRooms as room}
          <div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
            <div>
              <span class="font-medium">{room.name}</span>
              <span class="text-gray-500 text-xs ml-2">by {room.host_name}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-400 text-sm">{room.player_count}/{room.max_players}</span>
              <button
                class="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded transition-colors"
                onclick={() => joinRoom(room.code)}
              >
                Join
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <button
    class="text-gray-500 hover:text-gray-300 text-sm"
    onclick={() => { auth.clear(); router.navigate("landing"); }}
  >
    Logout
  </button>
</div>
