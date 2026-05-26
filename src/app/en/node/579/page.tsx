import { redirect } from "next/navigation";

// This URL was the original Parivahan Checkpost entry point.
// The portal now lives at /checkpost — redirect permanently.
export default function CheckpostTaxPage() {
  redirect("/checkpost");
}

