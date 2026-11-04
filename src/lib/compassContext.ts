import { createContext } from "svelte";
import type { Writable } from "svelte/store";
import type { Profile } from "../data";
import type { PlayerLookup } from "./playerTypes";

export interface SavedState {
  version: 1;
  activeId: string;
  profiles: Profile[];
}

export interface CompassController {
  state: Writable<SavedState>;
  storageError: Writable<boolean>;
  ready: Writable<boolean>;
  compact: Writable<boolean>;
  notice: Writable<string>;
  notify(message: string): void;
  initialize(): void;
  destroy(): void;
  updateProfile(update: (profile: Profile) => Profile): void;
  selectProfile(id: string): void;
  addPlayer(
    player: PlayerLookup,
    kind: Profile["kind"],
    mode: Profile["mode"],
  ): void;
  removePlayer(id: string): void;
  exportProgress(): void;
}

export const [getCompass, setCompass] = createContext<CompassController>();
