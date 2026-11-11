import { error } from "@sveltejs/kit";
import { QUESTS } from "../../../data.ts";
import type { PageLoad } from "./$types";

// An unknown quest id is a 404, never another quest (which would also save it as the active task).
export const load: PageLoad = ({ params }) => {
  if (params.id && !QUESTS.some((quest) => quest.id === params.id)) error(404, "Quest not found");
};
