import { MarketingHeader } from "@/components/layout/marketing-header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AiAdvantages } from "@/components/landing/ai-advantages";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";

export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <AiAdvantages />
        <Stats />
        <Testimonials />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
