import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Allies from "@/components/home/Allies";
import ImpactStats from "@/components/home/ImpactStats";
import Testimonials from "@/components/home/Testimonials";
import Contact from "@/components/home/Contact";

export default function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <About />
      <Allies />
      <ImpactStats />
      <Testimonials />
      <Contact />
      <Footer />
    </>
  );
}
