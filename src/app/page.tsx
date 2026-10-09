import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Allies from "@/components/home/Allies";
import ImpactStats from "@/components/home/ImpactStats";
import Testimonials from "@/components/home/Testimonials";
import Campaigns from "@/components/home/Campaigns";
import Contact from "@/components/home/Contact";

/** Las cifras publicadas se refrescan solas cada 5 minutos (y al instante cuando se publican). */
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <About />
      <Allies />
      <ImpactStats />
      <Campaigns />
      <Testimonials />
      <Contact />
      <Footer />
    </>
  );
}
