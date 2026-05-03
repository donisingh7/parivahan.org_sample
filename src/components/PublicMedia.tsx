const BASE = "https://parivahan.gov.in";

const mediaButtons = [
  { label: "Parivahan Newsletter", href: "#", active: true },
  { label: "Next Mile", href: "http://nextmile.gov.in/" },
  { label: "Circulars", href: "https://morth.nic.in/OMs-Circular-Other-Notification" },
  { label: "Press Coverage 2021", href: "#" },
  { label: "Press Coverage 2020", href: "#" },
  { label: "Press Coverage 2019", href: "#" },
  { label: "Press Coverage 2018", href: "#" },
  { label: "Videos", href: "#" },
];

// Duplicate for seamless loop
const allButtons = [...mediaButtons, ...mediaButtons];

export default function PublicMedia() {
  return (
    <section className="pm-animation-section-area section-padding30" style={{ marginTop: "20px", padding: "30px 16px" }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="pb-section-w">
              <div className="row" style={{ marginBottom: "16px", alignItems: "center" }}>
                <div className="col-md-11" style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
                  <h2 style={{ color: "#1a3060", fontSize: "24px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Public Media
                  </h2>
                  <p style={{ color: "#555", fontSize: "13px" }}>
                    Showcasing our achievements and progress through Content, Media developed internally/externally
                  </p>
                </div>
              </div>

              {/* Scrolling marquee buttons */}
              <div style={{ overflow: "hidden", marginBottom: "24px" }}>
                <div className="marquee-inner-2 marqauto" style={{ display: "flex", gap: "10px", animation: "marquee 22s linear infinite" }}>
                  {allButtons.map((btn, i) => (
                    <a
                      key={i}
                      href={btn.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`pm-btn-outline-light${btn.active ? " active" : ""}`}
                    >
                      {btn.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Main banner */}
              <div className="animation-inner-section-second">
                <div className="ani-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${BASE}/sites/default/files/images/pm-banner.jpg`}
                    alt="mParivahan"
                    className="img-fluid"
                    style={{ width: "100%", maxHeight: "280px", objectFit: "cover" }}
                  />
                </div>
                <div className="text-caption-public">
                  <div className="text-caption-public-content">
                    <h3>mParivahan</h3>
                    <div className="ani-contain-section" style={{ fontSize: "13px", marginBottom: "10px" }}>
                      <p>The wallet weight of documents brought to half</p>
                    </div>
                    <div className="aniread-w" style={{ justifyContent: "center" }}>
                      <a href="https://mparivahan.parivahan.gov.in/" target="_blank" rel="noopener noreferrer" style={{ color: "#ffd700", fontWeight: 600 }}>
                        Read More
                        <div className="ani-read-icon" style={{ display: "inline-flex", marginLeft: "8px" }}>
                          <i className="fa-solid fa-arrow-right" style={{ color: "#fff" }}></i>
                        </div>
                      </a>
                    </div>
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
