"use client";
const BASE = "https://parivahan.gov.in";

const partners = [
  { src: `${BASE}/sites/default/files/slider-datagovin.png`, alt: "data.gov.in", href: "https://data.gov.in/" },
  { src: `${BASE}/sites/default/files/slider-digital-india.png`, alt: "Digital India", href: "https://digitalindia.gov.in/" },
  { src: `${BASE}/sites/default/files/slider-gem.png`, alt: "GeM", href: "https://gem.gov.in/" },
  { src: `${BASE}/sites/default/files/slider-india-gov-in.png`, alt: "India.gov.in", href: "https://www.india.gov.in/" },
  { src: `${BASE}/sites/default/files/slider-meity-logo.png`, alt: "MeitY", href: "https://www.meity.gov.in/" },
  { src: `${BASE}/sites/default/files/slider-morth.png`, alt: "MoRTH", href: "https://morth.nic.in/" },
  { src: `${BASE}/sites/default/files/slider-mygov-logo.png`, alt: "MyGov", href: "https://www.mygov.in/" },
  { src: `${BASE}/sites/default/files/slider-nic-logo%20%281%29.png`, alt: "NIC", href: "https://www.nic.in/" },
];

// Duplicate for seamless loop
const allPartners = [...partners, ...partners];

export default function PartnerCarousel() {
  return (
    <section className="partner-carousel" style={{ padding: "20px 0", background: "#f5f7fb", overflow: "hidden" }}>
      <div className="partner-track">
        {allPartners.map((p, i) => (
          <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: "0 16px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={p.alt}
              style={{ height: "60px", objectFit: "contain", filter: "grayscale(20%)", transition: "filter 0.3s" }}
              onMouseOver={(e) => (e.currentTarget.style.filter = "grayscale(0)")}
              onMouseOut={(e) => (e.currentTarget.style.filter = "grayscale(20%)")}
            />
          </a>
        ))}
      </div>
    </section>
  );
}
