const BASE = "https://parivahan.gov.in";

export default function Footer() {
  return (
    <>
      <footer className="footer-parivahan" role="contentinfo">
        <div className="container-fluid" style={{ padding: "0 24px" }}>
          <div className="row">
            {/* Terms and Policies */}
            <div className="col-md-3" style={{ marginBottom: "20px" }}>
              <h3>Terms and Policies</h3>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Hyperlink Policy</a></li>
                <li><a href="#">Website Policies</a></li>
                <li><a href="#">Content Policies</a></li>
                <li><a href="#">Contingency Plan</a></li>
                <li><a href="#">Data Sharing Policy</a></li>
                <li><a href="#">Archival Retention Policy</a></li>
              </ul>
            </div>

            {/* About */}
            <div className="col-md-3" style={{ marginBottom: "20px" }}>
              <h3>About</h3>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Sitemap</a></li>
                <li><a href="#">Terms of Use</a></li>
                <li><a href="https://morth.nic.in/" target="_blank" rel="noopener noreferrer">MoRTH</a></li>
                <li><a href="https://morth.nic.in/en/central-motor-vehicles-rules-1989" target="_blank" rel="noopener noreferrer">CMVR 1989</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">CMVR 1989 Ebook</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="col-md-3" style={{ marginBottom: "20px" }}>
              <h3>Resources</h3>
              <ul>
                <li><a href="#">Fees and User Charges</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">Act, Rules and Policies</a></li>
                <li><a href="#">Permit Fees and Period</a></li>
                <li><a href="#">Manual</a></li>
                <li><a href="https://vahan.parivahan.gov.in/makermodel/vahan/welcome.xhtml" target="_blank" rel="noopener noreferrer">Homologation</a></li>
              </ul>
            </div>

            {/* Need Help + Logos */}
            <div className="col-md-3" style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "20px" }}>
                <h3>Need Help</h3>
                <ul>
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="#">Frequently Asked Questions</a></li>
                  <li><a href="#">Web Information Manager</a></li>
                  <li><a href="#">Calendar</a></li>
                </ul>
              </div>

              {/* Digital India & NIC logos */}
              <div style={{ marginBottom: "12px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BASE}/sites/default/files/images/digital-india-logo-revise.png`}
                  alt="Digital India"
                  style={{ maxWidth: "140px", marginBottom: "8px", display: "block" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BASE}/sites/default/files/images/nic-logo-revise.png`}
                  alt="National Informatics Center"
                  style={{ maxWidth: "120px", display: "block" }}
                />
              </div>

              <div className="copy-right">
                This Website belongs to Ministry of Road Transport &amp; Highways (MoRTH) Government of India.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Footer bottom bar */}
      <div className="footer-bottom">
        <span>Last updated on: November 27, 2025</span>
        <span>Total Visitors: 296,835,596</span>
      </div>
    </>
  );
}
