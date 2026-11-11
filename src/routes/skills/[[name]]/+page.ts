import { error, redirect } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";
import { skillPath } from "../../../lib/navigation.ts";
import { canonicalSkillName } from "../../../skillNames.ts";

// A typed or shared link in another case opens the skill's own address; an
// unknown name is a 404 rather than another skill's guide.
export const load: Load = ({ params }) => {
  if (!params.name) return;
  const name = canonicalSkillName(params.name);
  if (!name) error(404, "No skill has that name.");
  if (name !== params.name) redirect(308, skillPath(name));
};
