import { Hero } from '@/components/marketing/hero';
import { SocialProof } from '@/components/marketing/social-proof';
import { Features } from '@/components/marketing/features';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { CTASection } from '@/components/marketing/cta-section';
import { Footer } from '@/components/marketing/footer';

export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <CTASection />
      <Footer />
    </>
  );
}
