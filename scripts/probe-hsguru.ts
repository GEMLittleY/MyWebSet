async function main() {
  const url = "https://www.hsguru.com/decks?format=2&period=past_week&rank=top_legend&min_games=800&order_by=winrate";
  const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  console.log("Bytes:", html.length);

  // Find archetype anchors
  const archMatches = [
    ...html.matchAll(
      /<h3[^>]*>\s*<a[^>]+href="(\/deck\/\d+)"[^>]*>([^<]+)<\/a>\s*<\/h3>/g,
    ),
  ];
  console.log("Archetype matches:", archMatches.length);
  archMatches.slice(0, 3).forEach((m) => console.log("  ", m[2], "→", m[1]));

  // Look at one card around its h3
  const idx = archMatches[0]?.index ?? 0;
  console.log("\n=== block 0 (chars 0-2500 after h3) ===");
  console.log(html.slice(idx, idx + 2500));
}

main();
