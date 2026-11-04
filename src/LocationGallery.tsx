import { ExternalLink } from "lucide-react";
import type { Profile } from "./data";
import GameText from "./GameText";
import { LOCATIONS } from "./locations";
import { wikiHref, wikiThumbnail } from "./wiki";

export default function LocationGallery({
  locations,
  profile,
  compact = false,
}: {
  locations: readonly string[];
  profile: Profile;
  compact?: boolean;
}) {
  return (
    <div
      className={
        "location-gallery" + (compact ? " location-gallery-compact" : "")
      }
    >
      {locations.map((id) => {
        const location = LOCATIONS[id];
        return (
          <article className="location-card" key={id}>
            <a
              className="location-photo"
              href={wikiHref(location.wiki)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={location.name + " on RuneScape Wiki"}
            >
              <img
                src={wikiThumbnail(location.image)}
                alt={location.name}
                loading="lazy"
                width={300}
                height={170}
              />
            </a>
            <div className="location-caption">
              <a
                href={wikiHref(location.wiki)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{location.name}</span>
                <ExternalLink size={16} aria-hidden="true" />
              </a>
              {!compact && (
                <p>
                  <GameText text={location.summary} />
                </p>
              )}
              {location.members && (
                <p className="location-access">
                  {profile.mode === "f2p"
                    ? "Members access required."
                    : "Members location."}
                </p>
              )}
              {!compact && location.access && (
                <p className="location-access">
                  <GameText text={location.access} />
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
