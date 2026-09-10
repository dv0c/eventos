"use client";

import { HomeCapabilities } from "@/components/marketing/home/capability-grid";
import { HomeFaq } from "@/components/marketing/home/faq";
import { HomeHero } from "@/components/marketing/home/hero";
import { HomeHowItWorks } from "@/components/marketing/home/how-it-works";
import { HomeMidCta } from "@/components/marketing/home/mid-cta";
import { HomeStatement } from "@/components/marketing/home/mini-steps";
import { HomeOccasions } from "@/components/marketing/home/occasions";
import { HomeTestimonials } from "@/components/marketing/home/testimonials";
import { HomeValueProp } from "@/components/marketing/home/value-prop";

export default function MarketingHomePage() {
  return (
    <div className="relative">
      <HomeHero />
      <HomeStatement />
      <HomeValueProp />
      <HomeHowItWorks />
      <HomeOccasions />
      <HomeCapabilities />
      <HomeTestimonials />
      <HomeMidCta />
      <HomeFaq />
    </div>
  );
}
