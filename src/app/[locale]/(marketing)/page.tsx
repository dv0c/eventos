"use client";

import { HomeCapabilityGrid } from "@/components/marketing/home/capability-grid";
import { HomeComparison } from "@/components/marketing/home/comparison";
import { HomeFaq } from "@/components/marketing/home/faq";
import { HomeHero } from "@/components/marketing/home/hero";
import { HomeHowItWorks } from "@/components/marketing/home/how-it-works";
import { HomeMidCta } from "@/components/marketing/home/mid-cta";
import { HomeMiniSteps } from "@/components/marketing/home/mini-steps";
import { HomeOccasions } from "@/components/marketing/home/occasions";
import { HomeTestimonials } from "@/components/marketing/home/testimonials";
import { HomeValueProp } from "@/components/marketing/home/value-prop";

export default function MarketingHomePage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 top-32 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <HomeHero />
      <HomeMiniSteps />
      <HomeValueProp />
      <HomeHowItWorks />
      <HomeCapabilityGrid />
      <HomeOccasions />
      <HomeMidCta />
      <HomeTestimonials />
      <HomeComparison />
      <HomeFaq />
    </div>
  );
}
