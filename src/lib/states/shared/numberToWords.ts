/**
 * Indian-numbering "rupees in words" converter — shared by every state's
 * buildReceiptData. The PDF generator (generateReceipt.js) ships its own copy
 * so it stays a self-contained module that runs in pdfkit's call site without
 * pulling in the whole src/lib graph.
 */

const ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
  "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];
const TENS = [
  "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY",
];

export function numberToWords(n: number): string {
  const num = Math.round(Math.abs(n));
  if (num === 0) return "ZERO";
  let r = num;
  let s = "";
  if (r >= 100000) { s += numberToWords(Math.floor(r / 100000)) + " LAKH "; r %= 100000; }
  if (r >= 1000)   { s += numberToWords(Math.floor(r / 1000))   + " THOUSAND "; r %= 1000; }
  if (r >= 100)    { s += ONES[Math.floor(r / 100)] + " HUNDRED "; r %= 100; if (r) s += "AND "; }
  if (r >= 20)     { s += TENS[Math.floor(r / 10)] + " "; r %= 10; }
  if (r > 0)       { s += ONES[r] + " "; }
  return s.trim();
}
