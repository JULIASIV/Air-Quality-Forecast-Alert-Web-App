import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import Features from "@/components/Features";
import MapPreview from "@/components/MapPreview";
import HealthRecommendations from "@/components/HealthRecommendations";
import DataSources from "@/components/DataSources";
import StakeholderCTA from "@/components/StakeholderCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <div id="dashboard">
        <Dashboard />
      </div>
      <div id="features">
        <Features />
      </div>
      <MapPreview />
      <HealthRecommendations />
      <DataSources />
      <StakeholderCTA />
      <Footer />
    </main>
  );
};

export default Index;