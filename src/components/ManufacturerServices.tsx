"use client";
import { useState } from "react";

const BASE = "https://parivahan.gov.in";

const items = [
  {
    id: "pic1",
    title: "VLTD Maker",
    desc: "Track, Analyze and Optimize Vehicle through location.",
    href: "https://vahan.parivahan.gov.in/vltdmaker/vahan/welcome.xhtml",
    img: `${BASE}/sites/default/files/images/mrs-vltd.png`,
    imgAlt: "VLTD Banner",
  },
  {
    id: "pic2",
    title: "CNG Maker",
    desc: "Make way for cleaner, greener fuel",
    href: "https://vahan.parivahan.gov.in/cngmaker/vahan/welcome.xhtml",
    img: `${BASE}/sites/default/files/images/mrs-banner.jpg`,
    imgAlt: "MRS Banner",
  },
  {
    id: "pic3",
    title: "SLD Maker",
    desc: "Speed Limiting Device Ecosystem.",
    href: "https://vahan.parivahan.gov.in/sldmaker/vahan/welcome.xhtml",
    img: `${BASE}/sites/default/files/images/sld-banner.jpg`,
    imgAlt: "SLD Banner",
  },
  {
    id: "pic4",
    title: "Homologation",
    desc: "Complete Life Cycle of a vehicle.",
    href: "https://vahan.parivahan.gov.in/makermodel/vahan/welcome.xhtml",
    img: `${BASE}/sites/default/files/images/ho-banner.jpg`,
    imgAlt: "Homologation Banner",
  },
];

export default function ManufacturerServices() {
  const [active, setActive] = useState(0);

  return (
    <section className="section-padding30" style={{ marginTop: "20px", padding: "30px 16px" }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="mrs-section-w">
              <h2>Manufacturer Related Services</h2>
              <p>A number of applications/services devoted to vehicle/kit manufacturers for ease of operations and business</p>

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
                        style={{
                          display: active === i ? "block" : "none",
                          transition: "opacity 0.4s",
                        }}
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
