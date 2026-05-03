const newsItems = [
  { date: "05/07/2024 - 15:34", text: "Jhansi News: Four teams of Transport Department will record…", href: "#" },
  { date: "05/07/2024 - 15:42", text: "Transport Department honored for getting second prize in Rajasthan…", href: "#" },
  { date: "05/07/2024 - 15:44", text: "Rajasthan: Now high security number plate is necessary even on old…", href: "#" },
  { date: "05/07/2024 - 15:45", text: "Himachal Pradesh To Cancel Registration Of 15-Year-Old Government…", href: "#" },
];

export default function NewsSection() {
  return (
    <section style={{ padding: "30px 16px" }}>
      <div className="row" style={{ gap: "0" }}>
        {/* What's New */}
        <div className="col-md-6" style={{ paddingRight: "12px" }}>
          <div className="news-section-w move-up" style={{ height: "100%" }}>
            <div className="card-header-bg news-card-border">
              <i className="fa-solid fa-bell" style={{ marginRight: "8px" }}></i>
              What&apos;s New / Notification
            </div>
            <div style={{ padding: "8px 14px", background: "#fff" }}>
              <div className="tickerv-wrap">
                <ul>
                  {newsItems.map((item, i) => (
                    <li key={i}>
                      <div style={{ color: "#c0392b", fontSize: "11px", fontWeight: 600 }}>{item.date}</div>
                      <div style={{ fontSize: "13px", marginTop: "3px" }}>
                        {item.text}{" "}
                        <a href={item.href} className="views-more-link">Read More</a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Advisory / Achievements */}
        <div className="col-md-6" style={{ paddingLeft: "12px" }}>
          <div className="news-section-w move-up" style={{ height: "100%" }}>
            <div className="card-header-bg news-card-border">
              <i className="fa-solid fa-trophy" style={{ marginRight: "8px" }}></i>
              Advisory / Achievements
            </div>
            <div style={{ padding: "8px 14px", background: "#fff" }}>
              <div className="tickerv-wrap">
                <ul>
                  {newsItems.map((item, i) => (
                    <li key={i}>
                      <div style={{ color: "#c0392b", fontSize: "11px", fontWeight: 600 }}>
                        {item.date.split(" - ")[0]}
                      </div>
                      <div style={{ fontSize: "13px", marginTop: "3px" }}>
                        {item.text}{" "}
                        <a href={item.href} className="views-more-link">Read More</a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
