"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const BASE = "https://parivahan.gov.in";

const slides = [
  { src: `${BASE}/sites/default/files/FANCY.png`, alt: "FANCY", href: "#" },
  { src: `${BASE}/sites/default/files/Group%201982%402x.png`, alt: "VLTD", href: "https://vahan.parivahan.gov.in/vltdmaker/vahan/welcome.xhtml" },
  { src: `${BASE}/sites/default/files/Group%201981_3.png`, alt: "National Permit", href: "https://vahan.parivahan.gov.in/npermit/" },
  { src: `${BASE}/sites/default/files/Group%201982%402x_0.png`, alt: "mParivahan App", href: "https://play.google.com/store/apps/details?id=com.nic.mparivahan" },
  { src: `${BASE}/sites/default/files/Group%201981_1.png`, alt: "Fancy Number", href: "https://fancy.parivahan.gov.in/fancy/faces/public/login.xhtml" },
  { src: `${BASE}/sites/default/files/Group%201982%402x_1.png`, alt: "Amrit Mahotsav", href: "https://amritmahotsav.nic.in/" },
  { src: `${BASE}/sites/default/files/Group%201981.png`, alt: "Parivahan", href: "#" },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="hero-slider" style={{ aspectRatio: "16/7", maxHeight: "420px" }}>
      {slides.map((slide, i) => (
        <a
          key={i}
          href={slide.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            position: "absolute",
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: "opacity 0.8s ease",
            zIndex: i === current ? 2 : 1,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.alt}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </a>
      ))}

      <button className="slider-arrow prev" onClick={prev} aria-label="Previous">&#8249;</button>
      <button className="slider-arrow next" onClick={next} aria-label="Next">&#8250;</button>

      <div className="slider-dots">
        {slides.map((_, i) => (
          <span
            key={i}
            className={i === current ? "active" : ""}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
}
