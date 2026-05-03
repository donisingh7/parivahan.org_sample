"use client";
import { useState } from "react";

export default function TopHeader() {
  const [fontSize, setFontSize] = useState(14);

  const changeFontSize = (delta: number) => {
    const next = Math.min(20, Math.max(10, fontSize + delta));
    setFontSize(next);
    document.documentElement.style.fontSize = next + "px";
  };

  const resetFont = () => {
    setFontSize(14);
    document.documentElement.style.fontSize = "14px";
  };

  return (
    <div className="my_top_header">
      <ul className="header-top-list">
        <li>
          <a href="/" title="Home" aria-label="Home">
            <i className="fa fa-home" aria-hidden="true"></i> Home
          </a>
        </li>
        <li>
          <a href="#main-list" title="Skip to navigation">
            <i className="fa fa-arrow-down" aria-hidden="true"></i> Skip to navigation
          </a>
        </li>
        <li>
          <a href="#" title="Screen Reader Access">
            <i className="fa fa-arrow-down" aria-hidden="true"></i> Screen Reader Access
          </a>
        </li>
        <li>
          <a title="Font Size Decrease" onClick={() => changeFontSize(-2)} style={{ cursor: "pointer" }}>
            <span className="font-decrease" style={{ color: "#fff" }}>A<sup>-</sup></span>
          </a>
        </li>
        <li>
          <a title="Normal Font" onClick={resetFont} style={{ cursor: "pointer" }}>
            <span style={{ color: "#fff", fontSize: "14px" }}>A</span>
          </a>
        </li>
        <li>
          <a title="Font Size Increase" onClick={() => changeFontSize(2)} style={{ cursor: "pointer" }}>
            <span className="font-increase" style={{ color: "#fff" }}>A<sup>+</sup></span>
          </a>
        </li>
        <li>
          <a href="#" className="normal-contrast" title="Normal Contrast">A</a>
        </li>
        <li>
          <a href="#" className="dark-contrast" title="High Contrast">A</a>
        </li>
        <li>
          <a href="#" style={{ color: "#fff", fontSize: "12px", padding: "4px 8px" }}>हिन्दी</a>
        </li>
        <li>
          <form className="search-form-width" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Search" maxLength={20} />
            <button type="submit" className="s-btn">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
