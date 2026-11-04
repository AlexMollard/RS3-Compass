import { wikiImage, wikiThumbnail } from "./wiki";
import "./GameArt.css";

export default function GameArt({
  file,
  alt = "",
  size = 24,
  thumbnail = false,
  className,
}: {
  file: string;
  alt?: string;
  size?: number;
  thumbnail?: boolean;
  className?: string;
}) {
  return (
    <img
      className={["game-art", className].filter(Boolean).join(" ")}
      src={thumbnail ? wikiThumbnail(file) : wikiImage(file)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
