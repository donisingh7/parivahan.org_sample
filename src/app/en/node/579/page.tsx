import TopHeader from "@/components/TopHeader";
import PageHeader from "@/components/PageHeader";
import Navbar from "@/components/Navbar";
import CheckpostTax from "@/components/CheckpostTax";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Checkpost Tax | Parivahansewa",
  description: "Checkpost Tax information for various states - Parivahan Sewa",
};

export default function CheckpostTaxPage() {
  return (
    <>
      {/* Top accessibility bar */}
      <TopHeader />

      {/* Inner page logo/branding header */}
      <PageHeader />

      {/* Navigation */}
      <Navbar />

      {/* Page content */}
      <section className="title-block-down">
        <div className="container-fluid content-region-pad content-top printable-content">
          <div id="main" className="container">
            <div className="row row-offcanvas row-offcanvas-left clearfix">
              <main className="main-content col order-last" id="content" role="main">
                <section className="section">
                  <a href="#main-content" id="main-content" tabIndex={-1}></a>

                  {/* Page title */}
                  <div
                    id="block-parivahan-theme-page-title"
                    className="block block-core block-page-title-block clearfix"
                  >
                    <h1 className="title">
                      <span className="field field--name-title">Checkpost Tax</span>
                    </h1>
                  </div>

                  {/* Breadcrumb */}
                  <div className="breadcrumb-wrap">
                    <a href="/">Home</a>
                    <span>›</span>
                    <a href="/en">Online Services</a>
                    <span>›</span>
                    <span>Checkpost Tax</span>
                  </div>

                  {/* Main article */}
                  <article
                    data-history-node-id="579"
                    className="node node--type-page node--view-mode-full clearfix"
                  >
                    <div className="node__content clearfix">
                      {/* The state select + dynamic load */}
                      <CheckpostTax />

                      {/* View PDF link */}
                      <div className="print__wrapper print__wrapper--pdf">
                        <a
                          href="https://parivahan.gov.in/en/print/pdf/node/579"
                          className="print__link print__link--pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View PDF
                        </a>
                      </div>
                    </div>
                  </article>
                </section>
              </main>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
