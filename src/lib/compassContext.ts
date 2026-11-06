import { createContext } from "svelte";
import type { Writable } from "svelte/store";
import type { Profile } from "../data";
import type { PlayerLookup } from "./playerTypes";
import type { GroupLookup } from "./groupTypes";

export interface PlayerSyncStatus {
  state: "queued" | "refreshing" | "idle" | "error";
  attemptedAt?: number;
  nextRefreshAt?: number;
  message?: string;
}

export interface SavedState {
  version: 1;
  activeId: string;
  profiles: Profile[];
  groups?: GroupLookup[];
  /** False only on a brand-new device until a player is chosen; missing means true. */
  welcomed?: boolean;
}

export interface CompassController {
  state: Writable<SavedState>;
  storageError: Writable<boolean>;
  ready: Writable<boolean>;
  compact: Writable<boolean>;
  notice: Writable<string>;
  notify(message: string): void;
  syncState: Writable<Record<string, PlayerSyncStatus>>;
  refreshPlayers(
    ids?: readonly string[],
    options?: { staleOnly?: boolean; scope?: string },
  ): Promise<void>;
  cancelRefreshScope(scope: string): void;
  importGroupMembers(id: number): Promise<void>;
  saveGroup(group: GroupLookup): void;
  removeGroup(id: number): void;
  updatePlayer(id: string, settings: Pick<Profile, "kind" | "mode">): void;
  initialize(): void;
  destroy(): void;
  updateProfile(update: (profile: Profile) => Profile): void;
  welcome(): void;
  selectProfile(id: string): void;
  addPlayer(
    player: PlayerLookup,
    kind: Profile["kind"],
    mode: Profile["mode"],
    options?: { select?: boolean },
  ): void;
  removePlayer(id: string): void;
  exportProgress(): void;
}

export const [getCompass, setCompass] = createContext<CompassController>();

export const [getPlayerActions, setPlayerActions] = createContext<{
  lookup(name?: string): void;
}>();
