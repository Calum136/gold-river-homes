// Photo coverage report. Run with: npm run assets:report
//
// Reads lib/visual-assets.json and the option ids in lib/defaults.ts, checks
// every manifest entry, and writes docs/visualization/asset-coverage.md: per
// model, per option and per lot, what has an approved photo, where it came
// from, and every gap the owner still needs a photo for.
//
// lib/defaults.ts is imported directly through Node's built-in TypeScript type
// stripping (Node 22.18+ or 23.6+), so there are no dependencies and no
// generated id list to keep in sync. That works while defaults.ts has no
// imports of its own; if it gains one, give it an explicit ".ts" extension.
//
// Exits with code 1 when an entry is malformed or points at a missing file.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "lib", "visual-assets.json");
const outPath = join(root, "docs", "visualization", "asset-coverage.md");

let data;
try {
  data = await import("../lib/defaults.ts");
} catch (err) {
  console.error(
    "Could not import lib/defaults.ts. This needs Node 22.18+ (TypeScript type stripping), " +
      "and any import inside defaults.ts must use an explicit .ts extension.\n" +
      err.message
  );
  process.exit(1);
}

const {
  homeModels,
  exteriorGroups,
  interiorGroups,
  sidingColors,
  metalRoofColors,
  foundationCosts,
  waterCosts,
  sewerCosts,
  lotOptions,
} = data;

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const KINDS = new Set(["photo", "render"]);
const TIERS = new Set(["this-model", "other-supreme-home", "example"]);
const ROOMS = [
  { id: "kitchen", label: "Kitchen" },
  { id: "living", label: "Living room" },
  { id: "bath", label: "Bathroom" },
  { id: "bedroom", label: "Bedroom" },
];
const TERRAINS = [
  { id: "wooded", label: "Wooded" },
  { id: "meadow", label: "Meadow" },
  { id: "coastal", label: "Coastal" },
  { id: "town", label: "Town" },
];
// Photos narrower than this look soft on a large desktop stage.
const SHARP_WIDTH = 1200;

// ---------- Expected ids, in the order the buyer meets them ----------

const groupOptions = (groups, id) => groups.find((g) => g.id === id)?.options ?? [];
const costOptions = (costs) => Object.entries(costs).map(([id, cost]) => ({ id, label: cost.label }));

const optionSections = [
  { title: "Siding style", groupId: "sidingStyle", options: groupOptions(exteriorGroups, "sidingStyle") },
  { title: "Siding colour", groupId: "sidingColor", options: sidingColors },
  { title: "Roofing", groupId: "roofType", options: groupOptions(exteriorGroups, "roofType") },
  { title: "Metal roof colour", groupId: "metalRoofColor", options: metalRoofColors },
  {
    title: "Front porch",
    groupId: "porch",
    options: [
      { id: "without", label: "No porch" },
      { id: "with", label: "Covered front porch" },
    ],
  },
  { title: "Window and door trim", groupId: "exteriorTrim", options: groupOptions(exteriorGroups, "exteriorTrim") },
  ...interiorGroups.map((g) => ({ title: g.label, groupId: g.id, options: g.options })),
  {
    title: "Fireplace",
    groupId: "fireplace",
    options: [
      { id: "without", label: "No fireplace" },
      { id: "with", label: "Electric fireplace insert" },
    ],
  },
  { title: "Foundation", groupId: "foundation", options: costOptions(foundationCosts) },
  { title: "Water", groupId: "water", options: costOptions(waterCosts) },
  { title: "Sewer", groupId: "sewer", options: costOptions(sewerCosts) },
];

// ---------- Validation ----------

const problems = [];
const warnings = [];

function checkAsset(where, asset) {
  if (!asset || typeof asset !== "object") {
    problems.push(`${where}: not an object`);
    return;
  }
  for (const field of ["src", "caption", "alt", "credit", "licence", "sourceUrl"]) {
    if (typeof asset[field] !== "string" || asset[field].trim() === "") problems.push(`${where}: missing "${field}"`);
  }
  if (!Number.isInteger(asset.width) || asset.width <= 0 || !Number.isInteger(asset.height) || asset.height <= 0) {
    problems.push(`${where}: width and height must be positive integers`);
  }
  if (!KINDS.has(asset.kind)) problems.push(`${where}: unknown kind "${asset.kind}"`);
  if (!TIERS.has(asset.tier)) problems.push(`${where}: unknown tier "${asset.tier}"`);
  if (typeof asset.src === "string") {
    if (!asset.src.startsWith("/")) problems.push(`${where}: src must start with "/"`);
    else if (!existsSync(join(root, "public", asset.src))) problems.push(`${where}: file not found, public${asset.src}`);
  }
}

if (manifest.version !== 1) problems.push(`version is ${manifest.version}, expected 1`);

const modelIds = new Set(homeModels.map((m) => m.id));
for (const [modelId, entry] of Object.entries(manifest.models ?? {})) {
  if (!modelIds.has(modelId)) warnings.push(`models.${modelId} is not a model in lib/defaults.ts`);
  (entry.exterior ?? []).forEach((asset, i) => checkAsset(`models.${modelId}.exterior[${i}]`, asset));
  for (const [room, asset] of Object.entries(entry.rooms ?? {})) {
    if (!ROOMS.some((r) => r.id === room)) warnings.push(`models.${modelId}.rooms.${room} is not a known room`);
    checkAsset(`models.${modelId}.rooms.${room}`, asset);
  }
}
for (const model of homeModels) {
  if (!manifest.models?.[model.id]?.exterior?.length) problems.push(`${model.name} (${model.id}) has no exterior photo`);
}
for (const [room, asset] of Object.entries(manifest.showHome?.rooms ?? {})) {
  if (!ROOMS.some((r) => r.id === room)) warnings.push(`showHome.rooms.${room} is not a known room`);
  checkAsset(`showHome.rooms.${room}`, asset);
}

const expectedOptionKeys = new Set(optionSections.flatMap((s) => s.options.map((o) => `${s.groupId}:${o.id}`)));
for (const [key, asset] of Object.entries(manifest.options ?? {})) {
  if (!expectedOptionKeys.has(key)) warnings.push(`options["${key}"] is not a choice in lib/defaults.ts`);
  checkAsset(`options["${key}"]`, asset);
  if (asset?.model && !modelIds.has(asset.model)) warnings.push(`options["${key}"].model "${asset.model}" is not a model`);
}
for (const [terrain, asset] of Object.entries(manifest.lots ?? {})) {
  if (!TERRAINS.some((t) => t.id === terrain)) warnings.push(`lots.${terrain} is not a known terrain`);
  checkAsset(`lots.${terrain}`, asset);
}

// ---------- Gaps ----------

const optionGaps = [...expectedOptionKeys].filter((key) => !manifest.options?.[key]);
const lotGaps = TERRAINS.filter((t) => !manifest.lots?.[t.id]).map((t) => `lots:${t.id}`);
const computedGaps = [...optionGaps, ...lotGaps];
const listedGaps = new Set(manifest.gaps ?? []);
const unlistedGaps = computedGaps.filter((key) => !listedGaps.has(key));
const coveredButListed = [...listedGaps].filter((key) => !computedGaps.includes(key));

// ---------- Report ----------

const cell = (text) => String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const describeKinds = (assets) => {
  const photos = assets.filter((a) => a.kind === "photo").length;
  const renders = assets.length - photos;
  return [photos && plural(photos, "photo"), renders && plural(renders, "rendering")].filter(Boolean).join(", ");
};
const size = (asset) => `${asset.width}×${asset.height}`;

const lines = [];
const out = (line = "") => lines.push(line);

out("# Photo coverage report");
out();
out(
  `Generated by \`npm run assets:report\` from \`lib/visual-assets.json\` (manifest dated ${manifest.generated}). ` +
    "Don't edit by hand: change the manifest, then rerun the script."
);
out();
out("How the configurator uses these photos is described in `lib/stage.ts` and the Sep 2026 amendments in");
out("[00-master-plan.md](./00-master-plan.md). Tiers: **this-model** is the model's own photo;");
out("**other-supreme-home** is a different or unidentified Supreme home; **example** is a free-licence stock");
out("photo of the option on another home.");
out();

// Summary
const modelsWithAllRooms = homeModels.filter((m) => ROOMS.every((r) => manifest.models?.[m.id]?.rooms?.[r.id])).length;
const optionTotal = expectedOptionKeys.size;
out("## Summary");
out();
out("| | Covered | Gaps |");
out("|---|---|---|");
out(`| Models with an exterior photo | ${homeModels.length - homeModels.filter((m) => !manifest.models?.[m.id]?.exterior?.length).length} of ${homeModels.length} | ${homeModels.filter((m) => !manifest.models?.[m.id]?.exterior?.length).length} |`);
out(`| Models with all four room photos of their own | ${modelsWithAllRooms} of ${homeModels.length} | ${homeModels.length - modelsWithAllRooms} |`);
out(`| Show home rooms | ${ROOMS.filter((r) => manifest.showHome?.rooms?.[r.id]).length} of ${ROOMS.length} | ${ROOMS.filter((r) => !manifest.showHome?.rooms?.[r.id]).length} |`);
out(`| Option choices with a photo | ${optionTotal - optionGaps.length} of ${optionTotal} | ${optionGaps.length} |`);
out(`| Lot terrains with a photo | ${TERRAINS.length - lotGaps.length} of ${TERRAINS.length} | ${lotGaps.length} |`);
out();

// Models
out("## Models");
out();
out("Room cells: **own** = this model's photo; **show home** = the stage falls back to the Supreme show home's");
out("photo of that room (a different model, and captioned that way); **none** = no photo at any tier.");
out();
out(`| Model | Exterior | ${ROOMS.map((r) => r.label).join(" | ")} |`);
out(`|---|---|${ROOMS.map(() => "---").join("|")}|`);
for (const model of homeModels) {
  const entry = manifest.models?.[model.id];
  const exterior = entry?.exterior ?? [];
  const rooms = ROOMS.map((r) => (entry?.rooms?.[r.id] ? "own" : manifest.showHome?.rooms?.[r.id] ? "show home" : "none"));
  out(`| ${cell(model.name)} | ${exterior.length ? describeKinds(exterior) : "**none**"} | ${rooms.join(" | ")} |`);
}
out();
for (const model of homeModels) {
  const entry = manifest.models?.[model.id];
  if (!entry) continue;
  out(`### ${model.name}`);
  out();
  out("| Photo | Kind | Size | Caption | Source |");
  out("|---|---|---|---|---|");
  entry.exterior.forEach((asset, i) => {
    out(`| ${i === 0 ? "Exterior (hero)" : `Exterior ${i + 1}`} | ${asset.kind} | ${size(asset)} | ${cell(asset.caption)} | ${cell(asset.credit)} |`);
  });
  for (const room of ROOMS) {
    const asset = entry.rooms?.[room.id];
    if (asset) out(`| ${room.label} | ${asset.kind} | ${size(asset)} | ${cell(asset.caption)} | ${cell(asset.credit)} |`);
  }
  out();
}

// Show home
out("## Show home rooms");
out();
out("Used on interior screens for any model without its own photo of that room.");
out();
out("| Room | Size | Caption | Source |");
out("|---|---|---|---|");
for (const room of ROOMS) {
  const asset = manifest.showHome?.rooms?.[room.id];
  out(asset ? `| ${room.label} | ${size(asset)} | ${cell(asset.caption)} | ${cell(asset.credit)} |` : `| ${room.label} | | **gap** | |`);
}
out();

// Options
out("## Options");
out();
for (const section of optionSections) {
  out(`### ${section.title}`);
  out();
  out("| Choice | Key | Photo | Tier | Caption | Source |");
  out("|---|---|---|---|---|---|");
  for (const option of section.options) {
    const key = `${section.groupId}:${option.id}`;
    const asset = manifest.options?.[key];
    out(
      asset
        ? `| ${cell(option.label)} | \`${key}\` | ${size(asset)} | ${asset.tier} | ${cell(asset.caption)} | ${cell(asset.credit)} |`
        : `| ${cell(option.label)} | \`${key}\` | **gap** | | | |`
    );
  }
  out();
}

// Lots
out("## Lots");
out();
out("Lot cards show the example photo for their terrain. These are never photos of the listed lots.");
out();
out("| Terrain | Used by | Photo | Caption | Source |");
out("|---|---|---|---|---|");
for (const terrain of TERRAINS) {
  const asset = manifest.lots?.[terrain.id];
  const usedBy = lotOptions.filter((l) => l.terrain === terrain.id).map((l) => l.name).join(", ") || "no lot";
  out(
    asset
      ? `| ${terrain.label} | ${cell(usedBy)} | ${size(asset)} | ${cell(asset.caption)} | ${cell(asset.credit)} |`
      : `| ${terrain.label} | ${cell(usedBy)} | **gap** | | |`
  );
}
out();

// Requests
out("## Photos to request");
out();
const roomRequests = homeModels
  .map((m) => ({ model: m, missing: ROOMS.filter((r) => !manifest.models?.[m.id]?.rooms?.[r.id]) }))
  .filter((r) => r.missing.length > 0);
out("### Room photos of these models");
out();
if (roomRequests.length === 0) out("None. Every model has all four rooms.");
for (const { model, missing } of roomRequests) {
  out(`- ${model.name}: ${missing.map((r) => r.label.toLowerCase()).join(", ")}`);
}
out();
out("### Option photos");
out();
if (optionGaps.length === 0) out("None. Every choice has a photo.");
for (const section of optionSections) {
  const missing = section.options.filter((o) => optionGaps.includes(`${section.groupId}:${o.id}`));
  if (missing.length) out(`- ${section.title}: ${missing.map((o) => o.label).join(", ")}`);
}
out();
out("### Lot photos");
out();
if (lotGaps.length === 0) out("None. Every terrain has a photo.");
for (const terrain of TERRAINS.filter((t) => lotGaps.includes(`lots:${t.id}`))) {
  const usedBy = lotOptions.filter((l) => l.terrain === terrain.id).map((l) => l.name);
  out(`- ${terrain.label} land${usedBy.length ? ` (used by ${usedBy.join(", ")})` : ""}`);
}
out();
const soft = homeModels.flatMap((m) => {
  const entry = manifest.models?.[m.id];
  if (!entry) return [];
  const assets = [
    ...entry.exterior.map((a, i) => ({ what: i === 0 ? "exterior (hero)" : `exterior ${i + 1}`, a })),
    ...ROOMS.flatMap((r) => (entry.rooms?.[r.id] ? [{ what: r.label.toLowerCase(), a: entry.rooms[r.id] }] : [])),
  ];
  return assets.filter(({ a }) => a.width < SHARP_WIDTH).map(({ what, a }) => `- ${m.name} ${what}: ${size(a)}`);
});
out(`### Sharper photos wanted (under ${SHARP_WIDTH} px wide)`);
out();
out("These fill the stage and look soft on a large screen.");
out();
if (soft.length === 0) out("None.");
soft.forEach((line) => out(line));
out();

// Checks
out("## Manifest checks");
out();
out(problems.length ? `**${plural(problems.length, "problem")}:**` : "- Every entry is well formed and its file exists.");
problems.forEach((p) => out(`- ${p}`));
if (warnings.length) {
  out(`- ${plural(warnings.length, "warning")}:`);
  warnings.forEach((w) => out(`  - ${w}`));
} else {
  out("- Every manifest key matches a model, choice, room or terrain in the data.");
}
if (unlistedGaps.length === 0 && coveredButListed.length === 0) {
  out("- The manifest's `gaps` list matches the gaps found here.");
} else {
  if (unlistedGaps.length) out(`- Missing from the manifest's \`gaps\` list: ${unlistedGaps.map((k) => `\`${k}\``).join(", ")}`);
  if (coveredButListed.length) out(`- Listed in \`gaps\` but not a gap: ${coveredButListed.map((k) => `\`${k}\``).join(", ")}`);
}
out();

writeFileSync(outPath, lines.join("\n"));

console.log(`Wrote ${outPath}`);
console.log(
  `Options ${optionTotal - optionGaps.length}/${optionTotal}, lots ${TERRAINS.length - lotGaps.length}/${TERRAINS.length}, ` +
    `${plural(problems.length, "problem")}, ${plural(warnings.length, "warning")}.`
);
if (problems.length) {
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
