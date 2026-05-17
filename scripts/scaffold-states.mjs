/**
 * scaffold-states.mjs — generates the 9 expansion-state folders by copying
 * Rajasthan's per-state files and doing token replacements.
 *
 * After every state's design is finalised the user will customise each state's
 * files independently; this script is only re-run when adding a brand new
 * state or rebuilding from scratch.
 *
 *   node scripts/scaffold-states.mjs            # idempotent — overwrites
 *   node scripts/scaffold-states.mjs --check    # dry run, prints what would change
 */

import fs from "node:fs";
import path from "node:path";

const argv = new Set(process.argv.slice(2));
const DRY_RUN = argv.has("--check");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\//, ""), "..");

// ── Source files (Rajasthan templates) ──────────────────────────────────────
const SRC_LIB  = path.join(REPO, "src", "lib",        "states", "rajasthan");
const SRC_COMP = path.join(REPO, "src", "components", "states", "rajasthan");

const SOURCE_FILES = [
  { from: path.join(SRC_LIB,  "config.ts"),            to: "lib/config.ts"            },
  { from: path.join(SRC_LIB,  "model.ts"),             to: "lib/model.ts"             },
  { from: path.join(SRC_LIB,  "buildReceiptData.ts"),  to: "lib/buildReceiptData.ts"  },
  { from: path.join(SRC_LIB,  "generateReceipt.js"),   to: "lib/generateReceipt.js"   },
  { from: path.join(SRC_LIB,  "ReceiptTemplate.tsx"),  to: "lib/ReceiptTemplate.tsx"  },
  { from: path.join(SRC_COMP, "TaxCollectionForm.tsx"),to: "comp/TaxCollectionForm.tsx" },
];

// ── Target states ───────────────────────────────────────────────────────────
const STATES = [
  { code: "BR", dir: "bihar",            name: "Bihar",            label: "BIHAR",            modelName: "BiharTransaction",           collection: "bihar_transactions",            funcName: "BiharReceiptTemplate",            buildFnName: "buildBiharReceiptData",            getModelFnName: "getBiharTransactionModel",            configName: "biharConfig",            themeColor: "#0e7c43" },
  { code: "AP", dir: "andhrapradesh",    name: "Andhra Pradesh",   label: "ANDHRA PRADESH",   modelName: "AndhraPradeshTransaction",   collection: "andhra_pradesh_transactions",   funcName: "AndhraPradeshReceiptTemplate",   buildFnName: "buildAndhraPradeshReceiptData",   getModelFnName: "getAndhraPradeshTransactionModel",   configName: "andhraPradeshConfig",   themeColor: "#0d4f8c" },
  { code: "MH", dir: "maharashtra",      name: "Maharashtra",      label: "MAHARASHTRA",      modelName: "MaharashtraTransaction",     collection: "maharashtra_transactions",      funcName: "MaharashtraReceiptTemplate",     buildFnName: "buildMaharashtraReceiptData",     getModelFnName: "getMaharashtraTransactionModel",     configName: "maharashtraConfig",     themeColor: "#a83232" },
  { code: "JH", dir: "jharkhand",        name: "Jharkhand",        label: "JHARKHAND",        modelName: "JharkhandTransaction",       collection: "jharkhand_transactions",        funcName: "JharkhandReceiptTemplate",       buildFnName: "buildJharkhandReceiptData",       getModelFnName: "getJharkhandTransactionModel",       configName: "jharkhandConfig",       themeColor: "#1a6b3a" },
  { code: "PB", dir: "punjab",           name: "Punjab",           label: "PUNJAB",           modelName: "PunjabTransaction",          collection: "punjab_transactions",           funcName: "PunjabReceiptTemplate",          buildFnName: "buildPunjabReceiptData",          getModelFnName: "getPunjabTransactionModel",          configName: "punjabConfig",          themeColor: "#b8860b" },
  { code: "UP", dir: "uttarpradesh",     name: "Uttar Pradesh",    label: "UTTAR PRADESH",    modelName: "UttarPradeshTransaction",    collection: "uttar_pradesh_transactions",    funcName: "UttarPradeshReceiptTemplate",    buildFnName: "buildUttarPradeshReceiptData",    getModelFnName: "getUttarPradeshTransactionModel",    configName: "uttarPradeshConfig",    themeColor: "#5d3a8e" },
  { code: "UK", dir: "uttarakhand",      name: "Uttarakhand",      label: "UTTARAKHAND",      modelName: "UttarakhandTransaction",     collection: "uttarakhand_transactions",      funcName: "UttarakhandReceiptTemplate",     buildFnName: "buildUttarakhandReceiptData",     getModelFnName: "getUttarakhandTransactionModel",     configName: "uttarakhandConfig",     themeColor: "#3a5fa1" },
  { code: "HR", dir: "haryana",          name: "Haryana",          label: "HARYANA",          modelName: "HaryanaTransaction",         collection: "haryana_transactions",          funcName: "HaryanaReceiptTemplate",         buildFnName: "buildHaryanaReceiptData",         getModelFnName: "getHaryanaTransactionModel",         configName: "haryanaConfig",         themeColor: "#c93a64" },
  { code: "HP", dir: "himachalpradesh",  name: "Himachal Pradesh", label: "HIMACHAL PRADESH", modelName: "HimachalPradeshTransaction", collection: "himachal_pradesh_transactions", funcName: "HimachalPradeshReceiptTemplate", buildFnName: "buildHimachalPradeshReceiptData", getModelFnName: "getHimachalPradeshTransactionModel", configName: "himachalPradeshConfig", themeColor: "#5e8a47" },
];

// ── Replacement ─────────────────────────────────────────────────────────────
// Order matters — replace longest tokens first so e.g. "rajasthanConfig"
// becomes "<configName>" before bare "rajasthan" is rewritten to <dir>.
function replaceTokens(text, st) {
  let out = text;

  // Function/binding names
  out = out.replace(/RajasthanReceiptTemplate/g,    st.funcName);
  out = out.replace(/buildRajasthanReceiptData/g,   st.buildFnName);
  out = out.replace(/getRajasthanTransactionModel/g,st.getModelFnName);
  out = out.replace(/RajasthanTransaction/g,        st.modelName);
  out = out.replace(/rajasthanConfig/g,             st.configName);

  // Collection name
  out = out.replace(/rajasthan_transactions/g,      st.collection);

  // Display strings — but FIRST guard the watermark image filename + the JS
  // generator's STATE_WATERMARK_FILE constant so they keep pointing at the
  // existing Rajasthan asset (per user instruction: every state reuses the
  // Rajasthan watermark as a placeholder until real assets are dropped in).
  const WM_IMG_PATH = "/Images/Rajasthan-Transport-Department.png";
  const WM_IMG_FILE = "Rajasthan-Transport-Department.png";
  const WM_TOKEN_PATH = "__WM_KEEP_PATH__";
  const WM_TOKEN_FILE = "__WM_KEEP_FILE__";

  out = out.replace(WM_IMG_PATH, WM_TOKEN_PATH);
  out = out.replace(WM_IMG_FILE, WM_TOKEN_FILE);

  out = out.replace(/GOVERNMENT OF RAJASTHAN/g,     `GOVERNMENT OF ${st.label}`);
  out = out.replace(/RAJASTHAN/g,                   st.label);
  out = out.replace(/Rajasthan/g,                   st.name);

  out = out.replace(WM_TOKEN_PATH, WM_IMG_PATH);
  out = out.replace(WM_TOKEN_FILE, WM_IMG_FILE);

  // State code (vehicle-no placeholder + code field)
  out = out.replace(/code:\s*"RJ"/g,                `code: "${st.code}"`);
  out = out.replace(/STATE_CODE\s*=\s*"RJ"/g,       `STATE_CODE = "${st.code}"`);
  out = out.replace(/e\.g\.\s*RJ14AB1234/g,         `e.g. ${st.code}14AB1234`);

  // Theme colour
  out = out.replace(/#154281/g,                     st.themeColor);

  // Folder name in import paths
  out = out.replace(/states\/rajasthan/g,           `states/${st.dir}`);
  out = out.replace(/rajasthan-receipt/g,           `${st.dir}-receipt`); // CSS id

  return out;
}

// ── Main ────────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (DRY_RUN) return;
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(target, contents) {
  if (DRY_RUN) {
    const exists = fs.existsSync(target);
    console.log(`  [dry] ${exists ? "OVERWRITE" : "CREATE   "} ${path.relative(REPO, target)}`);
    return;
  }
  fs.writeFileSync(target, contents);
  console.log(`  ✓ ${path.relative(REPO, target)}`);
}

function main() {
  // Load source contents once.
  const sources = SOURCE_FILES.map((f) => ({
    ...f,
    contents: fs.readFileSync(f.from, "utf8"),
  }));

  for (const st of STATES) {
    console.log(`\n→ ${st.name} (${st.code})`);
    const libDir  = path.join(REPO, "src", "lib",        "states", st.dir);
    const compDir = path.join(REPO, "src", "components", "states", st.dir);
    ensureDir(libDir);
    ensureDir(compDir);

    for (const src of sources) {
      const target = src.to.startsWith("lib/")
        ? path.join(libDir,  src.to.replace(/^lib\//,  ""))
        : path.join(compDir, src.to.replace(/^comp\//, ""));
      writeFile(target, replaceTokens(src.contents, st));
    }
  }

  console.log(`\nDone — ${STATES.length} states scaffolded.`);
}

main();
