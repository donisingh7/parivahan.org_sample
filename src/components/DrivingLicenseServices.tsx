const BASE = "https://parivahan.gov.in";

const dlCards = [
  {
    img: `${BASE}/sites/default/files/images/lic1.png`,
    alt: "Online Test/ Appointment",
    title: "Online Test/ Appointment",
    desc: "Book/ Modify Online test appointments.",
    href: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
  },
  {
    img: `${BASE}/sites/default/files/images/lic2.png`,
    alt: "Drivers/ Learners License",
    title: "Drivers/ Learners License",
    desc: "License registration on your fingertips",
    href: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
  },
  {
    img: `${BASE}/sites/default/files/images/lic3.png`,
    alt: "Driving School",
    title: "Driving School",
    desc: "One place for application of Driving School License.",
    href: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
  },
  {
    img: `${BASE}/sites/default/files/images/other-services.png`,
    alt: "Other Services",
    title: "Other Services",
    desc: "Explore the plethora of services related to Driving License.",
    href: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
  },
];

export default function DrivingLicenseServices() {
  return (
    <section style={{ padding: "40px 16px" }}>
      <div className="row justify-content-center">
        <div className="col-md-10 text-center" style={{ marginBottom: "24px" }}>
          <h2 style={{ color: "#1a3060", fontSize: "26px", fontWeight: 700, marginBottom: "10px" }}>
            Driving License Related Services
          </h2>
          <p style={{ color: "#555", fontSize: "14px" }}>
            Various services related to new/old driving licence or learner&apos;s licence like
            Appointment Booking, Duplicate driving licence, Application Status, Online test for
            learner&apos;s licence, etc.
          </p>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row">
          {dlCards.map((card, i) => (
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
