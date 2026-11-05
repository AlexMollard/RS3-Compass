export function availableQuests(titles, overrides = {}) {
  return {
    status: "available",
    name: "Real Player",
    questPoints: 7,
    maxQuestPoints: 500,
    records: titles.map((title, index) => ({
      id: String(index + 1),
      title,
      status: "COMPLETED",
      eligible: true,
      members: false,
      difficulty: 0,
      questPoints: 1,
    })),
    ...overrides,
  };
}

export function platformPlayer(overrides = {}) {
  return {
    name: "Real Player",
    levels: { Mining: 55, Smithing: 40 },
    statistics: { overall: {}, skills: {}, activities: [] },
    fetchedAt: 1234,
    quests: { status: "unavailable", reason: "private-or-unavailable" },
    events: { status: "unavailable", reason: "service-unavailable" },
    ...overrides,
  };
}
