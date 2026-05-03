"use client";
import { useState } from "react";

const informationalSubmenus = {
  "About Registration": [
    { label: "Change Of Address", href: "/en/content/address-change" },
    { label: "Diplomatic Vehicle", href: "/en/content/diplomatic-vehicle" },
    { label: "Duplicate RC", href: "/en/content/duplicate-rc" },
    { label: "HP Endorsement", href: "/en/content/hp-endorsement" },
    { label: "HP Termination", href: "/en/content/hp-termination" },
    { label: "No Objection Certificate", href: "/en/content/no-objection-certificate" },
    { label: "Permanent Registration", href: "/en/content/permanent-registration" },
    { label: "Renewal Of RC", href: "/en/content/renewal-of-rc" },
    { label: "Transfer Of Ownership", href: "/en/content/ownership-transfer" },
  ],
  "Notification & Advisories": [
    { label: "Advisory", href: "#" },
    { label: "Draft Notification", href: "#" },
    { label: "Final Notification", href: "https://morth.nic.in/Motor-Vehicle-Legislation" },
  ],
  "About Driving License": [
    { label: "Addition Of Class", href: "#" },
    { label: "Duplicate Licence", href: "#" },
    { label: "International Driving Permit", href: "#" },
    { label: "Learner's License", href: "#" },
    { label: "Permanent License", href: "#" },
    { label: "Renewal", href: "#" },
  ],
  "Know your Vehicle Details": [],
  "Know your License Details": [],
  "Fees & User Charges": [],
  "Act, Rules & Policies": [],
  "FAQ": [],
};

const onlineServices = [
  { label: "All India Tourist Permit", href: "https://vahan.parivahan.gov.in/aitp/" },
  { label: "CNG Maker", href: "https://vahan.parivahan.gov.in/cngmaker/vahan/welcome.xhtml" },
  { label: "Checkpost Tax", href: "/en/node/579" },
  { label: "Dealer Authorization Certificate", href: "#" },
  { label: "Driving License Related Services", href: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do" },
  { label: "Fancy Number Booking", href: "https://fancy.parivahan.gov.in/fancy/faces/public/login.xhtml" },
  { label: "Homologation", href: "https://vahan.parivahan.gov.in/makermodel/vahan/welcome.xhtml" },
  { label: "NR Services", href: "https://vahan.parivahan.gov.in/nrservices/" },
  { label: "National Permit Authorization", href: "https://vahan.parivahan.gov.in/npermit/" },
  { label: "National Transport Repository", href: "https://services.parivahan.gov.in/ntr/#/" },
  { label: "PUCC", href: "https://puc.parivahan.gov.in/puc/" },
  { label: "Paid NR Services", href: "https://vahan.parivahan.gov.in/paidnrservices/" },
  { label: "Permit Related Services", href: "#" },
  { label: "SLD Maker", href: "https://vahan.parivahan.gov.in/sldmaker/vahan/welcome.xhtml" },
  { label: "Trade Certificate", href: "https://vahan.parivahan.gov.in/vahantc/vahan/ui/welcome.xhtml" },
  { label: "VLDT Maker", href: "https://vahan.parivahan.gov.in/vltdmaker/vahan/welcome.xhtml" },
  { label: "Vahan Green Sewa", href: "https://vahan.parivahan.gov.in/vahangreensewa/vahan/welcome.xhtml" },
  { label: "Vehicle Fitness Testing", href: "https://vahan.parivahan.gov.in/AFMS/#/" },
  { label: "Vehicle Recall", href: "https://vahan.parivahan.gov.in/vehiclerecall/vahan/welcome.xhtml" },
  { label: "Vehicle Related Services", href: "#" },
  { label: "Vehicle Scrapping", href: "https://vscrap.parivahan.gov.in/vehiclescrap/vahan/welcome.xhtml" },
  { label: "eChallan", href: "https://echallan.parivahan.gov.in/" },
];

const dashboardReports = [
  { label: "Analytics", href: "https://analytics.parivahan.gov.in/analytics/" },
  { label: "Homologation Dashboard", href: "https://vahan.parivahan.gov.in/makermodel/vahan/dashboard.xhtml" },
  { label: "PUCC Dashboard", href: "https://puc.parivahan.gov.in/puccdashboard/" },
  { label: "SLD Dashboard", href: "https://vahan.parivahan.gov.in/sldmaker/vahan/dashboard.xhtml" },
  { label: "Sarathi Report", href: "https://sarathi.parivahan.gov.in/SarathiReport/sarathiHomePublic.do" },
  { label: "Sarathi4 Dashboard", href: "https://sarathi.parivahan.gov.in/SarathiReport/DashBoardGr.do" },
  { label: "Trade Certificate Report", href: "#" },
  { label: "VLTD Dashboard", href: "https://vahan.parivahan.gov.in/vltdmaker/vahan/dashboard.xhtml" },
  { label: "Vahan Report", href: "https://vahan.parivahan.gov.in/vahanreport/vahan/login.xhtml" },
  { label: "Vahan4 Dashboard", href: "https://vahan.parivahan.gov.in/vahan4dashboard/" },
  { label: "eChallan Dashboard", href: "https://echallan.parivahan.gov.in/echallanreport/#/" },
];

const externalLinks = [
  { label: "National Informatics Center", href: "https://www.nic.in/" },
  { label: "MoRTH", href: "https://morth.nic.in/" },
  { label: "Delhi Traffic Police (Notice)", href: "https://traffic.delhipolice.gov.in" },
];

const loginLinks = [
  { label: "Dealer Login", href: "https://vahan.parivahan.gov.in/vahan/vahan/ui/login/login.xhtml" },
  { label: "Sarathi Login", href: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do" },
  { label: "Vahan Back Log Login", href: "https://vahan.parivahan.gov.in/vahanbacklog/vahan/ui/login/login.xhtml" },
  { label: "Vahan Login", href: "https://vahan.parivahan.gov.in/vahan/vahan/ui/login/login.xhtml" },
];

function DropdownMenu({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div className="custom-dropdown-menu" style={{ minWidth: "500px" }}>
      <div className="row">
        {items.map((item, i) => (
          <div key={i} className="col-md-3 submenu-level-one-item" style={{ marginBottom: "6px" }}>
            <a href={item.href} className="second-child-menu" target="_blank" rel="noopener noreferrer">
              {item.label}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function InformationalDropdown() {
  return (
    <div className="custom-dropdown-menu" style={{ minWidth: "700px" }}>
      <div className="row">
        {Object.entries(informationalSubmenus).map(([title, subs], i) => (
          <div key={i} className="col-md-3 submenu-level-one-item" style={{ marginBottom: "10px" }}>
            <a href="#" className="second-child-menu" style={{ fontWeight: 700, color: "#1a3060" }}>
              {title}
            </a>
            {subs.length > 0 && (
              <ul className="sub-submenu" style={{ marginTop: "4px" }}>
                {subs.map((sub, j) => (
                  <li key={j}>
                    <a href={sub.href}>{sub.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="parivahan-navbar" id="m-menu">
      <div className="nav-container">
        <ul id="main-list" className="main-list" style={{ flexWrap: "wrap" }}>
          <li>
            <button
              className="icon"
              style={{ background: "none", border: "none", color: "#fff", padding: "12px 14px", cursor: "pointer", display: "none" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <i className="fa fa-bars"></i>
            </button>
          </li>

          <li>
            <a href="#" className="parent-link parent-menu-bold">About Us</a>
          </li>

          <li className="nav-item parent-menu-list-with-submenu">
            <a className="parent-link-with-submenu parent-menu-bold" href="#">
              Informational Services <i className="fa-solid fa-caret-down"></i>
            </a>
            <InformationalDropdown />
          </li>

          <li className="nav-item parent-menu-list-with-submenu">
            <a className="parent-link-with-submenu parent-menu-bold" href="#">
              Online Services <i className="fa-solid fa-caret-down"></i>
            </a>
            <DropdownMenu items={onlineServices} />
          </li>

          <li className="nav-item parent-menu-list-with-submenu">
            <a className="parent-link-with-submenu parent-menu-bold" href="#">
              Dashboard &amp; Reports <i className="fa-solid fa-caret-down"></i>
            </a>
            <DropdownMenu items={dashboardReports} />
          </li>

          <li className="nav-item parent-menu-list-with-submenu">
            <a className="parent-link-with-submenu parent-menu-bold" href="#">
              External Links <i className="fa-solid fa-caret-down"></i>
            </a>
            <DropdownMenu items={externalLinks} />
          </li>

          <li className="nav-item parent-menu-list-with-submenu">
            <a className="parent-link-with-submenu parent-menu-bold" href="#">
              Public Media <i className="fa-solid fa-caret-down"></i>
            </a>
            <DropdownMenu items={[
              { label: "Circulars", href: "https://morth.nic.in/OMs-Circular-Other-Notification" },
              { label: "Next Mile", href: "https://nextmile.gov.in/" },
              { label: "Parivahan Newsletter", href: "#" },
              { label: "Videos", href: "#" },
            ]} />
          </li>

          <li>
            <a href="#" className="parent-link parent-menu-bold">Sitemap</a>
          </li>

          <li>
            <a href="#" className="parent-link parent-menu-bold">Contact Us</a>
          </li>

          <li className="nav-item parent-menu-list-with-submenu">
            <a className="parent-link-with-submenu parent-menu-bold" href="#">
              <i className="fa fa-sign-in" aria-hidden="true" style={{ paddingRight: "5px" }}></i>
              Login <i className="fa-solid fa-caret-down"></i>
            </a>
            <DropdownMenu items={loginLinks} />
          </li>
        </ul>
      </div>
    </nav>
  );
}
