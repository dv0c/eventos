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
