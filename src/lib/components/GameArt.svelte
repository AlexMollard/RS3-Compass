<script lang="ts">
  import { wikiImage, wikiThumbnail } from "../../wiki";
  import "../../GameArt.css";
  let {
    file,
    alt = "",
    size = 24,
    thumbnail = false,
    className = "",
  }: {
    file: string;
    alt?: string;
    size?: number;
    thumbnail?: boolean;
    className?: string;
  } = $props();
</script>

<img
  class="game-art {className}"
  src={thumbnail ? wikiThumbnail(file) : wikiImage(file)}
  {alt}
  width={size}
  height={size}
  loading="lazy"
  decoding="async"
/>
