import TopHeader from "@/components/TopHeader";
import HeroSlider from "@/components/HeroSlider";
import Navbar from "@/components/Navbar";
import DrivingLicenseServices from "@/components/DrivingLicenseServices";
import VehicleRelatedServices from "@/components/VehicleRelatedServices";
import ManufacturerServices from "@/components/ManufacturerServices";
import OtherProducts from "@/components/OtherProducts";
import DashboardReports from "@/components/DashboardReports";
import PublicMedia from "@/components/PublicMedia";
import InformationalServices from "@/components/InformationalServices";
import NewsSection from "@/components/NewsSection";
import PartnerCarousel from "@/components/PartnerCarousel";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <TopHeader />
      <div style={{ position: "relative" }}>
        <HeroSlider />
      </div>
      <Navbar />
      <main>
        <DrivingLicenseServices />
        <VehicleRelatedServices />
        <ManufacturerServices />
        <OtherProducts />
        <DashboardReports />
        <PublicMedia />
        <InformationalServices />
        <NewsSection />
      </main>
      <PartnerCarousel />
      <Footer />
    </>
  );
}
