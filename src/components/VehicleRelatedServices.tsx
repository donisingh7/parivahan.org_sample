const BASE = "https://parivahan.gov.in";

const vrItems = [
  {
    img: `${BASE}/sites/default/files/images/Vehicle-Registration.png`,
    alt: "Vehicle Registration",
    title: "Vehicle Registration",
    desc: "One click for all the vehicle related citizen services",
    href: "#",
  },
  {
    img: `${BASE}/sites/default/files/images/Fancy-Number-Allocation.png`,
    alt: "Fancy Number Allocation",
    title: "Fancy Number Allocation",
    desc: "Your favorite number for your favorite vehicle",
    href: "https://vahan.parivahan.gov.in/fancy/",
  },
  {
    img: `${BASE}/sites/default/files/images/National-Permit.png`,
    alt: "National Permit",
    title: "National Permit",
    desc: "Seamless online way for vehicle permits",
    href: "https://vahan.parivahan.gov.in/npermit/",
  },
  {
    img: `${BASE}/sites/default/files/images/Other-Services.png`,
    alt: "Other Services",
    title: "Other Services",
    desc: "Explore the services related to your vehicle here",
    href: "#",
  },
];

export default function VehicleRelatedServices() {
  return (
    <section className="section-padding30" style={{ marginTop: "20px" }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="vrs-section-w">
              <div className="row" style={{ marginBottom: "20px" }}>
                <div className="col-md-12">
                  <h2>Vehicle Related Services</h2>
                  <p>
                    Various services related to registration of vehicle/already registered vehicle
                    like Appointment Booking, Application Status, Duplicate Registration, Change of
                    Address, Transfer of Ownership, Hypothecation, etc.
                  </p>
                </div>
              </div>

              <div className="row">
                {vrItems.map((item, i) => (
                  <div key={i} className="col-md-3 service-section-ss">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.img} alt={item.alt} style={{ width: "60px", height: "60px", objectFit: "contain", marginBottom: "10px" }} />
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
                      {item.title}
                    </h3>
                    <div className="text-contain-section">
                      <p>{item.desc}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: "#ffd700", textDecoration: "none", fontSize: "13px" }}>
                        Read More
                      </a>
                      <div className="circle-more">
                        <i className="fa-solid fa-arrow-right animate-arrow" style={{ color: "#fff" }}></i>
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
