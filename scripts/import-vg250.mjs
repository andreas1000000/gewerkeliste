import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";

const SOURCE_URL = "https://daten.gdz.bkg.bund.de/produkte/vg/vg250_ebenen_0101/aktuell/vg250_01-01.utm32s.shape.ebenen.zip";
const DATA_AS_OF = "2025-01-01";
const EXPECTED_SOURCE_SHA256 = "b16b97d8f2ae0ce59ae6139617b60bb550f652f4b6db1a0c74417b2105bab33e";
const LICENSE_URL = "https://www.govdata.de/dl-de/by-2-0";
const DATA_SOURCES_URL = "https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf";
// Mapshaper is an import-only tool and intentionally stays outside the app install tree.
// Set MAPSHAPER_BIN to a locally reviewed binary when running the importer offline.
const MAPSHAPER_VERSION = "0.7.47";
const PILOT_COUNTIES = [
  { code: "09163", name: "Rosenheim", kind: "Kreisfreie Stadt" },
  { code: "09175", name: "Ebersberg", kind: "Landkreis" },
  { code: "09182", name: "Miesbach", kind: "Landkreis" },
  { code: "09183", name: "Mühldorf a.Inn", kind: "Landkreis" },
  { code: "09184", name: "München", kind: "Landkreis" },
  { code: "09187", name: "Rosenheim", kind: "Landkreis" },
  { code: "09189", name: "Traunstein", kind: "Landkreis" },
];

const args = parseArgs(process.argv.slice(2));
const source = args.source ? resolve(args.source) : null;
const outputRoot = resolve(args["out-dir"] || process.cwd());
const expectedSourceHash = String(args["expected-source-sha256"] || EXPECTED_SOURCE_SHA256).toLowerCase();
const seedMigrationPath = resolve(
  outputRoot,
  args["seed-migration"] || "supabase/migrations/20260712150100_municipality_catalog_seed.sql",
);

if (!source) {
  throw new Error(
    "Verwendung: node scripts/import-vg250.mjs --source /path/to/vg250.zip [--out-dir repository]; für Offline-Import zusätzlich MAPSHAPER_BIN setzen.",
  );
}

const sourceHash = sha256File(source);
if (!/^[a-f0-9]{64}$/.test(expectedSourceHash)) {
  throw new Error("--expected-source-sha256 muss eine 64-stellige SHA-256-Checksumme sein.");
}
if (sourceHash !== expectedSourceHash) {
  throw new Error(
    `Unerwartete VG250-Quelle: ${sourceHash}. Erwartet wird ${expectedSourceHash}; bei einem bewusst neuen Stand --expected-source-sha256 explizit angeben.`,
  );
}
const tempRoot = mkdtempSync(join(tmpdir(), "gewerkeliste-vg250-"));

try {
  const sourceFiles = await prepareSource(source, tempRoot);
  const dataAsOf = sourceFiles.dataAsOf || DATA_AS_OF;
  const dbfRecords = {
    counties: readDbf(sourceFiles.counties),
    states: readDbf(sourceFiles.states),
  };
  const rawGeoJsonPath = join(tempRoot, "pilot-raw.geojson");
  runMapshaper(sourceFiles.municipalities, rawGeoJsonPath);
  const rawGeoJson = JSON.parse(readFileSync(rawGeoJsonPath, "utf8"));
  const { counties, municipalities, features } = normalizePilotData(rawGeoJson.features, dbfRecords);
  const manifest = {
    schemaVersion: 1,
    dataAsOf,
    generatedBy: "scripts/import-vg250.mjs",
    source: {
      dataset: "Verwaltungsgebiete 1:250 000 (VG250), Stand 01.01.",
      url: SOURCE_URL,
      sourceFileSha256: sourceHash,
      license: "Datenlizenz Deutschland – Namensnennung 2.0",
      licenseUrl: LICENSE_URL,
      dataSourcesUrl: DATA_SOURCES_URL,
      attribution: `© BKG (${dataAsOf.slice(0, 4)}) dl-de/by-2-0 (Daten verändert), Datenquellen: ${DATA_SOURCES_URL}`,
      transformation: `VG250_GEM aus UTM32s nach WGS84 projiziert, auf die Pilot-Kreis-Allowlist und BEZ Gemeinde/Stadt gefiltert und mit mapshaper ${MAPSHAPER_VERSION} weighted Visvalingam 10% keep-shapes topologieschonend vereinfacht; Attribute auf die Anwendungsschnittstelle reduziert.`,
    },
    toolchain: { mapshaper: MAPSHAPER_VERSION },
    pilotCounties: counties,
    municipalities,
  };

  const geoJson = {
    type: "FeatureCollection",
    name: "gewerkeliste-municipality-pilot",
    metadata: {
      dataAsOf,
      source: "BKG VG250",
      sourceUrl: SOURCE_URL,
      license: "Datenlizenz Deutschland – Namensnennung 2.0",
      changedData: true,
    },
    features,
  };

  const geoJsonText = `${JSON.stringify(geoJson)}\n`;
  const geoJsonHash = sha256Text(geoJsonText);
  manifest.geometry = {
    path: "/geo/municipality-pilot.geojson",
    sha256: geoJsonHash,
    projection: "EPSG:4326 / WGS84",
    simplification: "weighted Visvalingam 10% keep-shapes",
  };

  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  await mkdir(join(outputRoot, "data"), { recursive: true });
  await mkdir(join(outputRoot, "public", "geo"), { recursive: true });
  await mkdir(dirname(seedMigrationPath), { recursive: true });
  await writeFile(join(outputRoot, "data", "municipality-pilot.json"), manifestText);
  await writeFile(join(outputRoot, "public", "geo", "municipality-pilot.geojson"), geoJsonText);
  await writeSeedMigration(seedMigrationPath, renderSeedMigration(municipalities, dataAsOf, sourceHash, geoJsonHash));

  console.log(`Pilot-Gemeinden: ${municipalities.length}`);
  console.log(`Pilot-Kreise: ${counties.length}`);
  console.log(`Quell-Checksumme: ${sourceHash}`);
  console.log(`Web-Geometrie-Checksumme: ${geoJsonHash}`);
  console.log(`Ausgabe: ${join(outputRoot, "data", "municipality-pilot.json")}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

function parseArgs(tokens) {
  const result = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) continue;
    result[token.slice(2)] = tokens[index + 1] && !tokens[index + 1].startsWith("--") ? tokens[++index] : true;
  }
  return result;
}

async function prepareSource(input, tempRootPath) {
  if (extname(input).toLowerCase() !== ".zip") {
    return locateSourceFiles(dirname(input));
  }

  const extractionPath = join(tempRootPath, "source");
  mkdirSync(extractionPath);
  execFileSync("unzip", ["-q", input, "-d", extractionPath], { stdio: "inherit" });
  return { ...locateSourceFiles(extractionPath), dataAsOf: readDataAsOf(extractionPath) };
}

function locateSourceFiles(rootPath) {
  const files = walkFiles(rootPath);
  const municipalities = files.find((file) => basename(file).toUpperCase() === "VG250_GEM.SHP");
  const counties = files.find((file) => basename(file).toUpperCase() === "VG250_KRS.DBF");
  const states = files.find((file) => basename(file).toUpperCase() === "VG_LKZ.DBF");
  if (!municipalities || !counties || !states) {
    throw new Error("VG250-Quelle muss VG250_GEM.shp, VG250_KRS.dbf und VG_LKZ.dbf enthalten.");
  }
  return { municipalities, counties, states };
}

function walkFiles(rootPath) {
  const result = [];
  for (const entry of readDirSync(rootPath)) {
    const path = join(rootPath, entry);
    if (statSync(path).isDirectory()) result.push(...walkFiles(path));
    else result.push(path);
  }
  return result;
}

function runMapshaper(sourcePath, outputPath) {
  const configuredMapshaper = process.env.MAPSHAPER_BIN;
  const mapshaper = configuredMapshaper ? resolve(configuredMapshaper) : "npx";
  const mapshaperPrefixArgs = configuredMapshaper ? [] : ["--yes", `mapshaper@${MAPSHAPER_VERSION}`];
  const countyCodes = JSON.stringify(PILOT_COUNTIES.map((county) => county.code));
  const municipalityKinds = JSON.stringify(["Gemeinde", "Stadt"]);
  execFileSync(
    mapshaper,
    [
      ...mapshaperPrefixArgs,
      sourcePath,
      "-filter",
      `${countyCodes}.indexOf(ARS.substr(0, 5)) >= 0 && ${municipalityKinds}.indexOf(BEZ) >= 0`,
      "-proj",
      "wgs84",
      "-simplify",
      "10%",
      "weighted",
      "keep-shapes",
      "-o",
      "format=geojson",
      outputPath,
    ],
    { stdio: "inherit" },
  );
}

function readDbf(path) {
  const data = readFileSync(path);
  const recordCount = data.readUInt32LE(4);
  const headerLength = data.readUInt16LE(8);
  const recordLength = data.readUInt16LE(10);
  const fields = [];
  for (let offset = 32; data[offset] !== 0x0d; offset += 32) {
    fields.push({
      name: data.subarray(offset, offset + 11).toString("ascii").replace(/\0.*$/, "").trim(),
      length: data[offset + 16],
    });
  }

  const rows = [];
  for (let index = 0; index < recordCount; index += 1) {
    const start = headerLength + index * recordLength;
    if (data[start] === 0x2a) continue;
    const row = {};
    let cursor = start + 1;
    for (const field of fields) {
      row[field.name] = data.subarray(cursor, cursor + field.length).toString("utf8").trim();
      cursor += field.length;
    }
    rows.push(row);
  }
  return rows;
}

function normalizePilotData(rawFeatures, dbfRecords) {
  const countyRows = new Map(dbfRecords.counties.map((row) => [String(row.AGS).padStart(5, "0"), row]));
  const stateRows = new Map(dbfRecords.states.map((row) => [row.LKZ, row]));
  const pilotCodes = new Set(PILOT_COUNTIES.map((county) => county.code));
  const counties = new Map();
  const municipalities = [];
  const features = [];

  for (const feature of rawFeatures) {
    const properties = feature.properties || {};
    const ags = String(properties.AGS || "").padStart(8, "0");
    const countyCode = String(properties.ARS || "").slice(0, 5);
    if (!ags || ags.length !== 8 || !pilotCodes.has(countyCode)) throw new Error(`Unerwartete VG250-Gemeinde: ${ags}`);
    const county = countyRows.get(countyCode);
    const state = stateRows.get(String(properties.LKZ || ""));
    if (!county || !state) throw new Error(`VG250-Zuordnung fehlt für ${ags} (${countyCode}).`);
    const name = String(properties.GEN || "").trim();
    const slug = `${slugify(name)}-${ags}`;
    const normalized = {
      ags,
      name,
      slug,
      countyCode,
      countyName: String(county.GEN || "").trim(),
      countyKind: String(county.BEZ || "").trim(),
      stateCode: String(properties.SN_L || "").padStart(2, "0"),
      stateName: String(state.GEN || "").trim(),
      geometryRef: ags,
      selectionEnabled: true,
      center: geometryCenter(feature.geometry),
    };
    municipalities.push(normalized);
    counties.set(countyCode, {
      code: countyCode,
      name: normalized.countyName,
      kind: normalized.countyKind,
      stateCode: normalized.stateCode,
      stateName: normalized.stateName,
    });
    features.push({
      type: "Feature",
      id: ags,
      properties: {
        ags,
        name,
        slug,
        countyCode,
        countyName: normalized.countyName,
        stateCode: normalized.stateCode,
      },
      geometry: feature.geometry,
    });
  }

  municipalities.sort(sortMunicipalities);
  features.sort((a, b) => String(a.properties.ags).localeCompare(String(b.properties.ags)));
  return {
    counties: Array.from(counties.values()).sort((a, b) => a.name.localeCompare(b.name, "de")),
    municipalities,
    features,
  };
}

function renderSeedMigration(municipalities, dataAsOf, sourceHash, geoJsonHash) {
  const values = municipalities.map((municipality) => `(${sql(municipality.ags)}, ${sql(municipality.name)}, ${sql(municipality.countyCode)}, ${sql(municipality.countyName)}, ${sql(municipality.stateCode)}, ${sql(municipality.stateName)}, ${sql(municipality.slug)}, ${sql(municipality.geometryRef)}, true, ${sql("BKG VG250")}, ${sql(dataAsOf)})`);
  return `-- Generated by scripts/import-vg250.mjs from VG250, dataAsOf ${dataAsOf}.\n-- Source URL: ${SOURCE_URL}\n-- Source SHA256: ${sourceHash}\n-- GeoJSON SHA256: ${geoJsonHash}\n-- License: Datenlizenz Deutschland – Namensnennung 2.0 (${LICENSE_URL})\n-- Do not edit manually; regenerate with the pinned source checksum or a new --seed-migration path.\ninsert into municipalities (ags, name, county_code, county_name, state_code, state_name, slug, geometry_ref, selection_enabled, data_source, data_as_of)\nvalues\n  ${values.join(",\n  ")}\non conflict (ags) do update set\n  name = excluded.name,\n  county_code = excluded.county_code,\n  county_name = excluded.county_name,\n  state_code = excluded.state_code,\n  state_name = excluded.state_name,\n  slug = excluded.slug,\n  geometry_ref = excluded.geometry_ref,\n  selection_enabled = excluded.selection_enabled,\n  data_source = excluded.data_source,\n  data_as_of = excluded.data_as_of;\n`;
}

async function writeSeedMigration(path, content) {
  try {
    const existing = readFileSync(path, "utf8");
    const existingSourceHash = existing.match(/Source SHA256:\s*([a-f0-9]{64})/i)?.[1]?.toLowerCase();
    if (existingSourceHash && existingSourceHash !== expectedSourceHash) {
      throw new Error(
        `Seed-Migration ${path} gehört bereits zu einer anderen Quelle (${existingSourceHash}); für einen neuen Datenstand --seed-migration auf einen neuen Migrationspfad setzen.`,
      );
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(path, content);
}

function readDataAsOf(rootPath) {
  const freshnessFile = walkFiles(rootPath).find((file) => basename(file).toLowerCase() === "aktualitaet.txt");
  const value = freshnessFile ? readFileSync(freshnessFile, "utf8").trim().split(/\s+/)[0] : "";
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) throw new Error("VG250-Quelle enthält keinen auswertbaren Aktualitätsstand.");
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function geometryCenter(geometry) {
  const coordinates = [];
  collectCoordinates(geometry?.coordinates, coordinates);
  if (!coordinates.length) throw new Error("Geometrie ohne Koordinaten.");
  const bounds = coordinates.reduce(
    (result, [longitude, latitude]) => ({
      minLongitude: Math.min(result.minLongitude, longitude),
      maxLongitude: Math.max(result.maxLongitude, longitude),
      minLatitude: Math.min(result.minLatitude, latitude),
      maxLatitude: Math.max(result.maxLatitude, latitude),
    }),
    { minLongitude: Infinity, maxLongitude: -Infinity, minLatitude: Infinity, maxLatitude: -Infinity },
  );
  return [Number(((bounds.minLongitude + bounds.maxLongitude) / 2).toFixed(6)), Number(((bounds.minLatitude + bounds.maxLatitude) / 2).toFixed(6))];
}

function collectCoordinates(value, output) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    output.push(value);
    return;
  }
  for (const child of value) collectCoordinates(child, output);
}

function sortMunicipalities(a, b) {
  return a.countyName.localeCompare(b.countyName, "de") || a.name.localeCompare(b.name, "de") || a.ags.localeCompare(b.ags);
}

function slugify(value) {
  return value
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .toLowerCase();
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readDirSync(path) {
  return readdirSync(path);
}
