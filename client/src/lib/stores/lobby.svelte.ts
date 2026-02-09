export interface LobbyPlayer {
  id: string;
  name: string;
  ready: boolean;
}

export interface RoomInfo {
  roomId: string;
  joinCode: string;
}

class LobbyStore {
  players = $state<LobbyPlayer[]>([]);
  room = $state<RoomInfo | null>(null);
  chatMessages = $state<Array<{ playerId: string; name: string; message: string }>>([]);
  isInRoom = $derived(this.room !== null);

  setRoom(room: RoomInfo) {
    this.room = room;
    this.players = [];
    this.chatMessages = [];
  }

  addPlayer(player: LobbyPlayer) {
    this.players = [...this.players, player];
  }

  removePlayer(playerId: string) {
    this.players = this.players.filter((p) => p.id !== playerId);
  }

  setPlayerReady(playerId: string, ready: boolean) {
    this.players = this.players.map((p) =>
      p.id === playerId ? { ...p, ready } : p
    );
  }

  addChat(playerId: string, name: string, message: string) {
    this.chatMessages = [...this.chatMessages, { playerId, name, message }];
  }

  clear() {
    this.players = [];
    this.room = null;
    this.chatMessages = [];
  }
}

export const lobby = new LobbyStore();
