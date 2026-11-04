<script lang="ts">
  import SectionHeading from "./SectionHeading.svelte";
  let {
    value,
    onChange,
  }: { value: string; onChange: (value: string) => void } = $props();
  const id = $props.id();
</script>

<section class="panel notes-card">
  <SectionHeading title="Notes" />
  <label class="sr-only" for={id}>Activity notes</label>
  <textarea
    {id}
    placeholder="Where you stopped, what to gather next…"
    {value}
    maxlength="4000"
    oninput={(event) => onChange(event.currentTarget.value)}></textarea>
  <span class="note-count">{value.length}/4,000</span>
</section>
