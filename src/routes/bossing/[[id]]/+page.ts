import { error } from "@sveltejs/kit";
import { bossById } from "../../../bosses.ts";
import type { PageLoad } from "./$types";

// An unknown boss id is a 404, never another boss.
export const load: PageLoad = ({ params }) => {
  if (params.id && !bossById(params.id)) error(404, "Boss not found");
};
