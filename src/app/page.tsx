"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import StatStrip from "@/components/home/StatStrip";
import About from "@/components/home/About";
import TeamPreview from "@/components/home/TeamPreview";
import Programs from "@/components/home/Programs";
import BootcampBanner from "@/components/home/BootcampBanner";
import Initiatives from "@/components/home/Initiatives";
import Opportunities from "@/components/home/Opportunities";
import ImpactStats from "@/components/home/ImpactStats";
import Testimonials from "@/components/home/Testimonials";
import Allies from "@/components/home/Allies";
import Involved from "@/components/home/Involved";
import BecasModal from "@/components/becas/BecasModal";

export default function HomePage() {
  const [becasModalOpen, setBecasModalOpen] = useState(false);

  return (
    <>
      <Header onOpenBecas={() => setBecasModalOpen(true)} />
      <Hero />
      <StatStrip />
      <About />
      <TeamPreview />
      <Programs />
      <BootcampBanner />
      <Initiatives />
      <Opportunities onOpenBecas={() => setBecasModalOpen(true)} />
      <ImpactStats />
      <Testimonials />
      <Allies />
      <Involved />
      <Footer onOpenBecas={() => setBecasModalOpen(true)} />
      <BecasModal open={becasModalOpen} onClose={() => setBecasModalOpen(false)} />
    </>
  );
}
