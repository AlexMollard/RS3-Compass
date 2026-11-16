export const wikiHref = (page: string) =>
  "https://runescape.wiki/w/" + encodeURIComponent(page.replaceAll(" ", "_"));

/** The page title a RuneScape Wiki URL points at ("https://runescape.wiki/w/Slayer_training" → "Slayer training"). */
export const wikiTitle = (url: string) =>
  decodeURIComponent(url.replace(/^https:\/\/runescape\.wiki\/w\//, "")).replaceAll("_", " ");

export const wikiImage =(filename: string) =>
  "https://runescape.wiki/images/" +
  encodeURIComponent(filename.replaceAll(" ", "_"));

export const wikiThumbnail = (filename: string) => {
  const image = encodeURIComponent(filename.replaceAll(" ", "_"));
  return "https://runescape.wiki/images/thumb/" + image + "/300px-" + image;
};
