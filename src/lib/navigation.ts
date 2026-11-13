export const questPath = (id: string) => `/quests/${encodeURIComponent(id)}`;
export const skillPath = (name: string) =>
  `/skills/${encodeURIComponent(name)}`;
export const bossPath = (id: string) => `/bossing/${encodeURIComponent(id)}`;

export type RouteId =
  | "home"
  | "quests"
  | "skills"
  | "bossing"
  | "players"
  | "groups"
  | "compare"
  | "activity"
  | "levels";

const SECTIONS: RouteId[] = [
  "quests",
  "skills",
  "bossing",
  "players",
  "groups",
  "compare",
  "activity",
  "levels",
];

/** Maps a pathname to its shell route by first segment; unknown paths are home. */
export function routeFor(pathname: string): RouteId {
  const segment = pathname.split("/")[1] ?? "";
  return SECTIONS.find((id) => id === segment) ?? "home";
}

export const NAV_GROUPS: {
  label: "Plan" | "People";
  items: { id: RouteId; label: string; href: string; image: string }[];
}[] = [
  {
    label: "Plan",
    items: [
      { id: "home", label: "Home", href: "/", image: "Quest_map_icon.png" },
      { id: "quests", label: "Quests", href: "/quests", image: "Quest.png" },
      {
        id: "skills",
        label: "Skills",
        href: "/skills",
        image: "Skills_icon.png",
      },
      {
        id: "bossing",
        label: "Bossing",
        href: "/bossing",
        image: "Attack.png",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        id: "players",
        label: "Players",
        href: "/players",
        image: "Friends_List_icon.png",
      },
      {
        id: "groups",
        label: "Group Ironman",
        href: "/groups",
        image: "Group_Ironman_badge.png",
      },
      {
        id: "compare",
        label: "Compare",
        href: "/compare",
        image: "Scales.png",
      },
      {
        id: "activity",
        label: "Activity",
        href: "/activity",
        image: "Quest_map_icon.png",
      },
    ],
  },
];

export const PHONE_TABS: {
  id: RouteId;
  label: "Home" | "Quests" | "Skills" | "People";
  href: string;
  image: string;
  matches: RouteId[];
}[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    image: "Quest_map_icon.png",
    matches: ["home"],
  },
  {
    id: "quests",
    label: "Quests",
    href: "/quests",
    image: "Quest.png",
    matches: ["quests"],
  },
  {
    id: "skills",
    label: "Skills",
    href: "/skills",
    image: "Skills_icon.png",
    matches: ["skills"],
  },
  {
    id: "players",
    label: "People",
    href: "/players",
    image: "Friends_List_icon.png",
    matches: ["players", "groups", "compare", "activity"],
  },
];
