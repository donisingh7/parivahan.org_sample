/**
 * Client-safe state registry.
 *
 * This file is imported from both server and client components, so it MUST
 * NOT pull in Mongoose, the PDF generator, or anything else server-only.
 * Server-side state modules (model + buildReceiptData + generateReceipt)
 * live in registry.server.ts.
 */

import type { StateCode, StateConfig } from "./types";
import { rajasthanConfig }       from "./rajasthan/config";
import { biharConfig }           from "./bihar/config";
import { andhraPradeshConfig }   from "./andhrapradesh/config";
import { maharashtraConfig }     from "./maharashtra/config";
import { jharkhandConfig }       from "./jharkhand/config";
import { punjabConfig }          from "./punjab/config";
import { uttarPradeshConfig }    from "./uttarpradesh/config";
import { uttarakhandConfig }     from "./uttarakhand/config";
import { haryanaConfig }         from "./haryana/config";
import { himachalPradeshConfig } from "./himachalpradesh/config";

export const STATE_CONFIGS: Record<StateCode, StateConfig> = {
  RJ: rajasthanConfig,
  BR: biharConfig,
  AP: andhraPradeshConfig,
  MH: maharashtraConfig,
  JH: jharkhandConfig,
  PB: punjabConfig,
  UP: uttarPradeshConfig,
  UK: uttarakhandConfig,
  HR: haryanaConfig,
  HP: himachalPradeshConfig,
};

/**
 * Fixed iteration order for the dropdown — Rajasthan first (the original
 * state) then alphabetical so newly added states slot in predictably.
 */
const ORDER: StateCode[] = ["RJ", "AP", "BR", "HR", "HP", "JH", "MH", "PB", "UP", "UK"];

export function listSupportedStates(): StateConfig[] {
  return ORDER.map((c) => STATE_CONFIGS[c]);
}

export function isSupportedState(code: string | null | undefined): code is StateCode {
  return !!code && code in STATE_CONFIGS;
}

export function getStateConfig(code: StateCode): StateConfig {
  return STATE_CONFIGS[code];
}

export function stateLabel(code: string | null | undefined): string {
  if (!code || !isSupportedState(code)) return code ?? "";
  return STATE_CONFIGS[code].label;
}
