/** Persisted key in Profile.packed for one supply line of a task. Stored format: never change. */
export const packKey = (task: string, line: string): string => task + "::" + line;
