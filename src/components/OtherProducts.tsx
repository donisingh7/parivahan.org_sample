const BASE = "https://parivahan.gov.in";

const smallCards = [
  {
    img: `${BASE}/sites/default/files/images/pucc.jpg`,
    alt: "Pollution Check",
    title: "PUCC",
    desc: "MoRTH's endeavor to Limit vehicular emissions",
    href: "https://puc.parivahan.gov.in/puc/",
  },
  {
    img: `${BASE}/sites/default/files/images/e-cs.jpg`,
    alt: "echallan System",
    title: "eChallan System",
    desc: "A paperless trail for managing Traffic Enforcement Online.",
    href: "https://echallan.parivahan.gov.in/",
  },
  {
    img: `${BASE}/sites/default/files/images/vgs.jpg`,
    alt: "Vahan green Sewa",
    title: "Vahan Green Sewa",
    desc: "Take the Eco-Friendly way with new automotive fuels",
    href: "https://vahan.parivahan.gov.in/vahangreensewa/vahan/welcome.xhtml",
  },
];

export default function OtherProducts() {
  return (
    <section className="animation-section-area section-padding30" style={{ marginTop: "20px", padding: "30px 16px" }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="ops-section-w">
              <div className="row" style={{ marginBottom: "20px" }}>
                <div className="col-md-5" style={{ display: "flex", alignItems: "center" }}>
                  <h2 style={{ color: "#fff", fontSize: "28px", fontWeight: 700, lineHeight: 1.3 }}>
                    Other <br /> Products &amp; <br /> Services
                  </h2>
                </div>
                <div className="col-md-7">
                  <div className="animation-inner-section">
                    <div className="ani-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${BASE}/sites/default/files/images/ops-banner.jpg`}
                        alt="mParivahan"
                        className="img-fluid"
                      />
                    </div>
                    <div className="text-caption-top">
                      <div className="text-caption-content-grand">
                        <h3>mParivahan</h3>
                        <div className="ani-contain-section">
                          <p>The wallet weight of documents brought to half</p>
                        </div>
                        <div className="aniread-w">
                          <a href="https://mparivahan.parivahan.gov.in/" target="_blank" rel="noopener noreferrer">
                            Read More
                          </a>
                          <div className="ani-read-icon">
                            <i className="fa-solid fa-arrow-right" style={{ color: "#fff" }}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: "12px" }}>
                {smallCards.map((card, i) => (
                  <div key={i} className="col-md-4" style={{ marginBottom: "12px" }}>
                    <div className="animation-inner-section">
                      <div className="ani-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={card.img} alt={card.alt} className="img-fluid" />
                      </div>
                      <div className="text-caption">
                        <div className="text-caption-content">
                          <h3>{card.title}</h3>
                          <div className="ani-contain-section">
                            <p>{card.desc}</p>
                          </div>
                          <div className="aniread-w">
                            <a href={card.href} target="_blank" rel="noopener noreferrer">
                              Read More
                            </a>
                            <div className="ani-read-icon">
                              <i className="fa-solid fa-arrow-right" style={{ color: "#fff" }}></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
