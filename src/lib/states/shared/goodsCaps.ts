/**
 * Shared goods-vehicle capacity toggle.
 *
 * Every state's receipt shows two "capacity" slots that mean different things
 * for goods vs passenger vehicles (e.g. goods → weight pair, passenger →
 * seating/sleeper pair). The detect-"GOODS"-then-pick-a-pair logic was
 * duplicated in every buildReceiptData; this is the single source of truth.
 *
 * The two slots are intentionally neutral (slot1 / slot2) rather than
 * gross/unladen — states differ (Chhattisgarh's slots are Unladen/Laden,
 * Tamil Nadu's are Gross/Unladen), so each caller passes its own label +
 * value pair for both the goods and passenger case.
 */

export type CapValue = number | string;

export interface CapPair {
  label1: string;
  label2: string;
  value1: CapValue | null | undefined;
  value2: CapValue | null | undefined;
}

export interface GoodsCaps {
  isGoods:   boolean;
  cap1Label: string;
  cap2Label: string;
  cap1Value: CapValue;
  cap2Value: CapValue;
}

/** True when the vehicle type/category names a goods vehicle. */
export function isGoodsVehicle(vehicleType: string | null | undefined): boolean {
  return String(vehicleType || "").toUpperCase().includes("GOODS");
}

/**
 * Pick the goods or passenger label/value pair for a receipt's two capacity
 * slots. Values pass through as given (string weights like "2625 KG." stay
 * strings; numeric caps stay numbers) so each generator renders exactly what
 * the form captured.
 */
export function buildGoodsCaps(
  vehicleType: string | null | undefined,
  goods: CapPair,
  passenger: CapPair
): GoodsCaps {
  const pair = isGoodsVehicle(vehicleType) ? goods : passenger;
  return {
    isGoods:   isGoodsVehicle(vehicleType),
    cap1Label: pair.label1,
    cap2Label: pair.label2,
    cap1Value: pair.value1 ?? (typeof pair.value1 === "number" ? 0 : ""),
    cap2Value: pair.value2 ?? (typeof pair.value2 === "number" ? 0 : ""),
  };
}
