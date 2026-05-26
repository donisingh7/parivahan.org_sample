import { redirect } from "next/navigation";
import { isSupportedState } from "@/lib/states/registry";

import RajasthanForm       from "@/components/states/rajasthan/TaxCollectionForm";
import BiharForm           from "@/components/states/bihar/TaxCollectionForm";
import AndhraPradeshForm   from "@/components/states/andhrapradesh/TaxCollectionForm";
import MaharashtraForm     from "@/components/states/maharashtra/TaxCollectionForm";
import JharkhandForm       from "@/components/states/jharkhand/TaxCollectionForm";
import PunjabForm          from "@/components/states/punjab/TaxCollectionForm";
import UttarPradeshForm    from "@/components/states/uttarpradesh/TaxCollectionForm";
import UttarakhandForm     from "@/components/states/uttarakhand/TaxCollectionForm";
import HaryanaForm         from "@/components/states/haryana/TaxCollectionForm";
import HimachalPradeshForm from "@/components/states/himachalpradesh/TaxCollectionForm";

import type { StateCode } from "@/lib/states/types";
import type { ComponentType } from "react";

export const metadata = {
  title: "Tax Payment Details | Checkpost Parivahan",
};

// Static map of per-state form components. Each entry is a thin wrapper
// import — Next.js code-splits the route bundle per-page so loading the
// /checkpost/payment route only ships the forms that ship with the bundle
// (all of them today; we accept that since the form is the primary content
// of this route).
const FORM_COMPONENTS: Record<StateCode, ComponentType> = {
  RJ: RajasthanForm,
  BR: BiharForm,
  AP: AndhraPradeshForm,
  MH: MaharashtraForm,
  JH: JharkhandForm,
  PB: PunjabForm,
  UP: UttarPradeshForm,
  UK: UttarakhandForm,
  HR: HaryanaForm,
  HP: HimachalPradeshForm,
};

export default async function TaxPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  // No state, or an unsupported one, sends the user back to the state picker
  // (/en/node/579) where the dropdown only offers the 10 supported states.
  if (!isSupportedState(state)) {
    redirect("/checkpost");
  }
  const Form = FORM_COMPONENTS[state];
  return <Form />;
}
