/**
 * Server-only state registry.
 *
 * Imports per-state Mongoose models and PDF generators so it must NEVER be
 * imported from a client component. The client-safe surface (configs + state
 * list) is in registry.ts; this file extends that with the heavy modules.
 *
 * generateReceipt.js is plain CommonJS and is required (not imported) so
 * webpack bundles it via static analysis. Each per-state file is required
 * separately so the bundler traces all of them.
 */

import type { Model } from "mongoose";
import type {
  GenerateReceiptInput,
  ReceiptData,
  StateCode,
  TransactionDoc,
  TxnLike,
} from "./types";
import { STATE_CONFIGS, isSupportedState } from "./registry";

import { getRajasthanTransactionModel }      from "./rajasthan/model";
import { getBiharTransactionModel }          from "./bihar/model";
import { getAndhraPradeshTransactionModel }  from "./andhrapradesh/model";
import { getMaharashtraTransactionModel }    from "./maharashtra/model";
import { getGujaratTransactionModel }        from "./gujarat/model";
import { getJharkhandTransactionModel }      from "./jharkhand/model";
import { getPunjabTransactionModel }         from "./punjab/model";
import { getUttarPradeshTransactionModel }   from "./uttarpradesh/model";
import { getUttarakhandTransactionModel }    from "./uttarakhand/model";
import { getHaryanaTransactionModel }        from "./haryana/model";
import { getHimachalPradeshTransactionModel } from "./himachalpradesh/model";

import { buildRajasthanReceiptData }      from "./rajasthan/buildReceiptData";
import { buildBiharReceiptData }          from "./bihar/buildReceiptData";
import { buildAndhraPradeshReceiptData }  from "./andhrapradesh/buildReceiptData";
import { buildMaharashtraReceiptData }    from "./maharashtra/buildReceiptData";
import { buildGujaratReceiptData }        from "./gujarat/buildReceiptData";
import { buildJharkhandReceiptData }      from "./jharkhand/buildReceiptData";
import { buildPunjabReceiptData }         from "./punjab/buildReceiptData";
import { buildUttarPradeshReceiptData }   from "./uttarpradesh/buildReceiptData";
import { buildUttarakhandReceiptData }    from "./uttarakhand/buildReceiptData";
import { buildHaryanaReceiptData }        from "./haryana/buildReceiptData";
import { buildHimachalPradeshReceiptData } from "./himachalpradesh/buildReceiptData";

// Static relative requires so webpack bundles every per-state generator and
// nft automatically traces pdfkit / sharp / qrcode / moment into the function
// bundle for /api/payment, /api/receipt and /api/r.
/* eslint-disable @typescript-eslint/no-require-imports */
const generateRJ = require("./rajasthan/generateReceipt")        as { generateReceipt: GenerateReceiptFn };
const generateBR = require("./bihar/generateReceipt")            as { generateReceipt: GenerateReceiptFn };
const generateAP = require("./andhrapradesh/generateReceipt")    as { generateReceipt: GenerateReceiptFn };
const generateMH = require("./maharashtra/generateReceipt")      as { generateReceipt: GenerateReceiptFn };
const generateGJ = require("./gujarat/generateReceipt")          as { generateReceipt: GenerateReceiptFn };
const generateJH = require("./jharkhand/generateReceipt")        as { generateReceipt: GenerateReceiptFn };
const generatePB = require("./punjab/generateReceipt")           as { generateReceipt: GenerateReceiptFn };
const generateUP = require("./uttarpradesh/generateReceipt")     as { generateReceipt: GenerateReceiptFn };
const generateUK = require("./uttarakhand/generateReceipt")      as { generateReceipt: GenerateReceiptFn };
const generateHR = require("./haryana/generateReceipt")          as { generateReceipt: GenerateReceiptFn };
const generateHP = require("./himachalpradesh/generateReceipt")  as { generateReceipt: GenerateReceiptFn };
/* eslint-enable @typescript-eslint/no-require-imports */

type GenerateReceiptFn = (data: GenerateReceiptInput) => Promise<Buffer>;
type BuildReceiptDataFn = (txn: TxnLike) => ReceiptData;
type GetModelFn = () => Model<TransactionDoc>;

interface StateServerModule {
  code:             StateCode;
  getModel:         GetModelFn;
  buildReceiptData: BuildReceiptDataFn;
  generateReceipt:  GenerateReceiptFn;
}

export const STATE_SERVER: Record<StateCode, StateServerModule> = {
  RJ: { code: "RJ", getModel: getRajasthanTransactionModel,      buildReceiptData: buildRajasthanReceiptData,      generateReceipt: generateRJ.generateReceipt },
  BR: { code: "BR", getModel: getBiharTransactionModel,          buildReceiptData: buildBiharReceiptData,          generateReceipt: generateBR.generateReceipt },
  AP: { code: "AP", getModel: getAndhraPradeshTransactionModel,  buildReceiptData: buildAndhraPradeshReceiptData,  generateReceipt: generateAP.generateReceipt },
  MH: { code: "MH", getModel: getMaharashtraTransactionModel,    buildReceiptData: buildMaharashtraReceiptData,    generateReceipt: generateMH.generateReceipt },
  GJ: { code: "GJ", getModel: getGujaratTransactionModel,        buildReceiptData: buildGujaratReceiptData,        generateReceipt: generateGJ.generateReceipt },
  JH: { code: "JH", getModel: getJharkhandTransactionModel,      buildReceiptData: buildJharkhandReceiptData,      generateReceipt: generateJH.generateReceipt },
  PB: { code: "PB", getModel: getPunjabTransactionModel,         buildReceiptData: buildPunjabReceiptData,         generateReceipt: generatePB.generateReceipt },
  UP: { code: "UP", getModel: getUttarPradeshTransactionModel,   buildReceiptData: buildUttarPradeshReceiptData,   generateReceipt: generateUP.generateReceipt },
  UK: { code: "UK", getModel: getUttarakhandTransactionModel,    buildReceiptData: buildUttarakhandReceiptData,    generateReceipt: generateUK.generateReceipt },
  HR: { code: "HR", getModel: getHaryanaTransactionModel,        buildReceiptData: buildHaryanaReceiptData,        generateReceipt: generateHR.generateReceipt },
  HP: { code: "HP", getModel: getHimachalPradeshTransactionModel,buildReceiptData: buildHimachalPradeshReceiptData,generateReceipt: generateHP.generateReceipt },
};

export function getStateServer(code: StateCode): StateServerModule {
  return STATE_SERVER[code];
}

export function getStateServerSafe(
  code: string | null | undefined
): StateServerModule | null {
  if (!isSupportedState(code)) return null;
  return STATE_SERVER[code];
}

/**
 * Resolve a transaction by ID across every state collection in parallel.
 * Returns the document plus the state it lived in so callers can pick the
 * matching buildReceiptData / generateReceipt without hard-coding a state.
 *
 * Intentional fallback for legacy URLs that don't carry a ?state= hint and
 * for the public receipt API where the JWT might be malformed. Production
 * callers should pass the state directly when known to avoid the fan-out.
 */
export async function findTransactionAcrossStates(
  transactionId: string
): Promise<{ doc: TransactionDoc; state: StateCode } | null> {
  const entries = Object.entries(STATE_SERVER) as [StateCode, StateServerModule][];
  const results = await Promise.all(
    entries.map(async ([code, entry]) => {
      const doc = await entry.getModel().findOne({ transactionId }).lean<TransactionDoc>();
      return { code, doc };
    })
  );
  const hit = results.find((r) => r.doc !== null && r.doc !== undefined);
  if (!hit || !hit.doc) return null;
  return { doc: hit.doc, state: hit.code };
}

/** Fetch transactions across every state collection (used by admin aggregations). */
export function getAllStateServers(): StateServerModule[] {
  return Object.values(STATE_SERVER);
}

// Re-export configs alongside server modules so callers don't have to import
// from two places when both are needed.
export { STATE_CONFIGS };
