<script lang="ts">
  import { ArrowRight, CheckCircle2 } from "@lucide/svelte";
  import { skillByName, type Profile, type QuestRecord } from "../../data";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import Button from "./Button.svelte";
  import "../../QuestLevels.css";

  let {
    profile,
    quest,
    onSkill,
  }: { profile: Profile; quest: QuestRecord; onSkill: (name: string) => void } =
    $props();
  let required = $derived(
    quest.requirements.filter((level) => !level.recommended),
  );
  let recommended = $derived(
    quest.requirements.filter((level) => level.recommended),
  );
  let groups = $derived(
    [
      { title: "Required levels", levels: required },
      { title: "Optional targets", levels: recommended },
    ].filter((group) => group.levels.length),
  );
</script>

<div class="quest-level-checks">
  {#if !required.length}
    <p class="level-check-empty">No required skill levels.</p>
  {/if}
  {#each groups as group (group.title)}
    <section class="level-check-group" aria-label={group.title}>
      <h4>{group.title}</h4>
      <div class="level-check-list">
        {#each group.levels as requirement (requirement.skill + ":" + requirement.level)}
          {@const current = profile.levels[requirement.skill]}
          {@const known = current != null}
          {@const met = known && current >= requirement.level}
          <div class:is-met={met} class="level-check-row">
            <div class="level-check-skill">
              <GameArt file={requirement.skill + "-icon.png"} />
              <div>
                <strong><GameText text={requirement.skill} /></strong>
                {#if requirement.recommended}<small class="level-check-purpose"
                    >{requirement.purpose || "Self-supply"}</small
                  >{/if}
              </div>
            </div>
            <dl class="level-check-values">
              <div>
                <dt>Recorded</dt>
                <dd>{known ? current : "—"}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{requirement.level}</dd>
              </div>
            </dl>
            <span class="level-check-status" class:below={!met && known}
              >{#if met}<CheckCircle2 size={16} />{/if}{!known
                ? "Not recorded"
                : met
                  ? "Met"
                  : "Below target"}</span
            >
            {#if skillByName(requirement.skill)}
              <Button
                variant="quiet"
                className="level-check-train"
                aria-label={"Open training for " + requirement.skill}
                onclick={() => onSkill(requirement.skill)}
                >Train <ArrowRight size={16} /></Button
              >
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>
