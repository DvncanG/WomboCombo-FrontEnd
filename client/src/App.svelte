<script lang="ts">
  import Landing from "./ui/pages/Landing.svelte";
  import Login from "./ui/pages/Login.svelte";
  import Register from "./ui/pages/Register.svelte";
  import Lobby from "./ui/pages/Lobby.svelte";
  import Room from "./ui/pages/Room.svelte";
  import GamePage from "./ui/pages/Game.svelte";
  import Results from "./ui/pages/Results.svelte";
  import Settings from "./ui/pages/Settings.svelte";
  import { router, type Page } from "./lib/stores/router.svelte";

  const pages: Record<Page, typeof Landing> = {
    landing: Landing,
    login: Login,
    register: Register,
    lobby: Lobby,
    room: Room,
    game: GamePage,
    results: Results,
    settings: Settings,
  };

  let CurrentPage = $derived(pages[router.page]);
</script>

<CurrentPage />
