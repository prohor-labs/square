import { CoursesPricingSection } from "@/components/courses-pricing-section";
import { HeroSlider } from "@/components/hero-slider";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import { ServicesGridSection } from "@/components/services-grid-section";
import { getHeroSliders } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function LandingHomePage() {
  const slides = await getHeroSliders();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-black selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1">
        <div className="animate-tab-content">
          {/* Hero Slider */}
          <HeroSlider slides={slides} />

          {/* All Services Grid */}
          <ServicesGridSection />

          {/* Courses Pricing Section */}
          <CoursesPricingSection />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
