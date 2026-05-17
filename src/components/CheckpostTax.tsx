"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { listSupportedStates } from "@/lib/states/registry";

// Drop-in replacement that pulls the state list from the per-state registry.
// Only the 10 states with full implementation under src/lib/states/ are shown
// — selecting any other state isn't possible because they never enter the
// dropdown to begin with.
const states = listSupportedStates().map((c) => ({ value: c.code, label: c.label }));

// Re-export so existing call sites that did `import { states } from
// "@/components/CheckpostTax"` keep compiling. New code should import from
// `@/lib/states/registry` instead.
export { states };

export default function CheckpostTax() {
  const [selectedState, setSelectedState] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedState(val);
    if (val) {
      setLoading(true);
      // Show overlay briefly then redirect — mimics original "please wait" behaviour
      setTimeout(() => {
        router.push(`/checkpost?state=${val}`);
      }, 1200);
    }
  };

  return (
    <div className="clearfix text-formatted field field--name-body">
      <div className="states-conatiner states-conatiner-min-height" style={{ position: "relative" }}>
        <select
          className="select-css select-css-check-post-services"
          value={selectedState}
          onChange={handleStateChange}
          aria-label="Select State Name"
          disabled={loading}
        >
          <option value=""> --- Select State Name --- </option>
          {states.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Loading overlay — "Please wait" shown before redirect */}
        {loading && (
          <div className="overlay overlay-style" id="check_post_load">
            <h2 className="overlay-heading">
              <span className="overlay-spinner"></span>
              Please wait, web page is being loaded...
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
