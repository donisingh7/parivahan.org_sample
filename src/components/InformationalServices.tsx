"use client";
import { useState } from "react";

const BASE = "https://parivahan.gov.in";

const items = [
  {
    title: "License & Registration Details",
    desc: "Identify basic details with License and Registration Details",
    href: "#",
    img: `${BASE}/sites/default/files/images/informa.png`,
    imgAlt: "Driving License & Registration Details",
  },
  {
    title: "Citizen Guide",
    desc: "A guide to acquaint you to the most frequently used services.",
    href: "#",
    img: `${BASE}/sites/default/files/images/cg.png`,
    imgAlt: "Citizen Guide",
  },
  {
    title: "Notifications & Advisories",
    desc: "Latest updates from MoRTH, Meity and other related Govt. authorities",
    href: "https://morth.nic.in/Motor-Vehicle-Legislation",
    img: `${BASE}/sites/default/files/images/noti.png`,
    imgAlt: "Notification & Advisories",
  },
  {
    title: "Frequently Asked Questions",
    desc: "Find answers to the most common and frequent questions here",
    href: "#",
    img: `${BASE}/sites/default/files/images/faq.png`,
    imgAlt: "Frequently Asked Questions",
  },
];

export default function InformationalServices() {
  const [active, setActive] = useState(0);

  return (
    <section className="section-padding30" style={{ marginTop: "20px", padding: "30px 16px" }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="mrs-section-w">
              <h2>Informational Services</h2>
              <p>Easy access to all the necessary information for various transport services.</p>

              <div className="row" style={{ marginTop: "30px" }}>
                <div className="col-md-4">
                  {items.map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none", display: "block", marginBottom: "4px" }}
                      onMouseEnter={() => setActive(i)}
                    >
                      <div className={`mrs-box${active === i ? " active" : ""}`}>
                        <h4>{item.title}</h4>
                        <div>{item.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="col-md-8">
                  <div className="mrs-image-panel">
                    {items.map((item, i) => (
                      <div
                        key={i}
                        style={{ display: active === i ? "block" : "none" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.img} alt={item.imgAlt} className="img-fluid" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
