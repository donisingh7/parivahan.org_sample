const BASE = "https://parivahan.gov.in";

export default function PageHeader() {
  return (
    <div className="container-fluid" style={{ borderBottom: "3px solid #f57c20" }}>
      <div className="heading-top-container">
        <div className="parivahan-logo-margin" style={{ padding: "8px 16px" }}>
          <div className="inner-page-logo-row">
            {/* State Emblem */}
            <div className="logo-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}/sites/default/files/Logo/India_State_Emblem_2.png`}
                alt="State Emblem of India"
                className="logo-emblem"
              />
            </div>

            {/* Parivahan logo */}
            <div className="logo-item logo-parivahan-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}/sites/default/files/Logo/parivahan_logo.png`}
                alt="Parivahan Logo"
                className="logo-parivahan"
              />
            </div>

            {/* Text branding */}
            <div className="logo-brand-text">
              <div className="brand-hindi">PARIVAHANSEWA सड़क परिवहन और राजमार्ग मंत्रालय</div>
              <div className="brand-eng">Ministry of Road Transport &amp; Highways</div>
            </div>

            {/* MoRTH Logo */}
            <div className="logo-item logo-morth-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}/sites/default/files/Logo/morth-logo.png`}
                alt="MoRTH Logo"
                className="logo-morth"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
