export type Page =
  | "landing"
  | "login"
  | "register"
  | "lobby"
  | "room"
  | "character_select"
  | "stage_select"
  | "game"
  | "results"
  | "settings";

class Router {
  page = $state<Page>("landing");
  params = $state<Record<string, string>>({});

  navigate(page: Page, params: Record<string, string> = {}) {
    this.page = page;
    this.params = params;
  }
}

export const router = new Router();
