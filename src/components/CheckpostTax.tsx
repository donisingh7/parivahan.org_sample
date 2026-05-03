"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const states = [
  { value: "AP", label: "ANDHRA PRADESH" },
  { value: "AS", label: "ASSAM" },
  { value: "BR", label: "BIHAR" },
  { value: "CG", label: "CHHATTISGARH" },
  { value: "GA", label: "GOA" },
  { value: "GJ", label: "GUJARAT" },
  { value: "HR", label: "HARYANA" },
  { value: "HP", label: "HIMACHAL PRADESH" },
  { value: "JH", label: "JHARKHAND" },
  { value: "JK", label: "JAMMU & KASHMIR" },
  { value: "KA", label: "KARNATAKA" },
  { value: "KL", label: "KERALA" },
  { value: "MH", label: "MAHARASHTRA" },
  { value: "MP", label: "MADHYA PRADESH" },
  { value: "MZ", label: "MIZORAM" },
  { value: "OR", label: "ODISHA" },
  { value: "PB", label: "PUNJAB" },
  { value: "PY", label: "PONDICHERRY" },
  { value: "RJ", label: "RAJASTHAN" },
  { value: "SK", label: "SIKKIM" },
  { value: "TN", label: "TAMIL NADU" },
  { value: "TR", label: "TRIPURA" },
  { value: "TG", label: "TELANGANA" },
  { value: "DD", label: "UNION TERRITORY OF DADRA AND NAGAR HAVELI AND DAMAN AND DIU" },
  { value: "UK", label: "UTTRAKHAND" },
  { value: "UP", label: "UTTAR PRADESH" },
  { value: "WB", label: "WEST BENGAL" },
];

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
