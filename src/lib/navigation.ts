export const questPath = (id: string) => `/quests/${encodeURIComponent(id)}`;
export const skillPath = (name: string) =>
  `/skills/${encodeURIComponent(name)}`;
