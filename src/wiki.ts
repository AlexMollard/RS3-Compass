export const wikiHref = (page: string) =>
  "https://runescape.wiki/w/" + encodeURIComponent(page.replaceAll(" ", "_"));

export const wikiImage = (filename: string) =>
  "https://runescape.wiki/images/" +
  encodeURIComponent(filename.replaceAll(" ", "_"));
