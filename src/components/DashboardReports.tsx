const BASE = "https://parivahan.gov.in";

const dashCards = [
  {
    img: `${BASE}/sites/default/files/images/dash1.png`,
    alt: "Vahan Dashboard",
    title: "Vahan Dashboard",
    desc: "National visibility of vehicle registration and related Services.",
    href: "https://vahan.parivahan.gov.in/vahan4dashboard/",
  },
  {
    img: `${BASE}/sites/default/files/images/dash3.png`,
    alt: "Sarathi Dashboard",
    title: "Sarathi Dashboard",
    desc: "License registration on your fingertips.",
    href: "https://sarathi.parivahan.gov.in/SarathiReport/sarathiHomePublic.do",
  },
  {
    img: `${BASE}/sites/default/files/images/dash3.png`,
    alt: "VLTD Dashboard",
    title: "VLTD Dashboard",
    desc: "VLTS ecosystem of vehicles for National Tracking.",
    href: "https://vahan.parivahan.gov.in/vltdmaker/vahan/dashboard.xhtml",
  },
  {
    img: `${BASE}/sites/default/files/images/dash4.png`,
    alt: "Homologation Dashboard",
    title: "Homologation Dashboard",
    desc: "Displaying number of vehicle records nationally.",
    href: "https://vahan.parivahan.gov.in/makermodel/vahan/dashboard.xhtml",
  },
];

export default function DashboardReports() {
  return (
    <section style={{ padding: "40px 16px" }}>
      <div className="row justify-content-center">
        <div className="col-md-10 text-center" style={{ marginBottom: "24px" }}>
          <h2 style={{ color: "#1a3060", fontSize: "26px", fontWeight: 700, marginBottom: "10px" }}>
            Dashboard and Reports
          </h2>
          <p style={{ color: "#555", fontSize: "14px" }}>
            State of the Art Dashboard services for depiction of the progress and data specific to
            a state and across the country.
          </p>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row">
          {dashCards.map((card, i) => (
            <div key={i} className="col-lg-3 col-md-3" style={{ marginBottom: "16px" }}>
              <div className="single-team text-center">
                <div className="team-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.img} alt={card.alt} style={{ width: "100%", height: "220px", objectFit: "cover" }} />
                  <div className="team-caption">
                    <div className="team-caption-content">
                      <h3>
                        <a href={card.href} target="_blank" rel="noopener noreferrer">
                          {card.title}
                        </a>
                      </h3>
                      <div className="text-contain-section">
                        <p>{card.desc}</p>
                      </div>
                      <div className="top-readmore">
                        <a href={card.href} target="_blank" rel="noopener noreferrer">
                          Read More
                        </a>
                        <div className="circle-more">
                          <i className="fa-solid fa-arrow-right animate-arrow" style={{ color: "#fff" }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
