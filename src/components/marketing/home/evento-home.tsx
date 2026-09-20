"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { DEMO } from "./home-compositions";
import { useClearwaveHome } from "./use-clearwave-home";

import "./clearwave-home.css";

const FAQ_KEYS = [
  "noApp",
  "noAccount",
  "tv",
  "moderate",
  "customize",
  "after",
] as const;

const OCCASION_KEYS = [
  "wedding",
  "birthday",
  "party",
  "corporate",
  "conference",
  "baptism",
] as const;

const PHONE_SCREENS = [
  DEMO.hero,
  DEMO.wall,
  DEMO.upload,
  DEMO.tiles[0],
  DEMO.tiles[2],
] as const;

const FEATURE_ROWS = [
  {
    key: "create" as const,
    number: "01",
    reverse: false,
    img: DEMO.upload,
  },
  {
    key: "wall" as const,
    number: "02",
    reverse: true,
    img: DEMO.wall,
  },
  {
    key: "album" as const,
    number: "03",
    reverse: false,
    img: DEMO.hero,
  },
] as const;

const PROOF_KEYS = ["noApp", "noAccounts", "minutes"] as const;

export function EventoHomePage() {
  const t = useTranslations("marketing.evento");
  const tOccasions = useTranslations("marketing.home.occasions");
  const tPricing = useTranslations("marketing.evento.pricingPage");
  const rootRef = useRef<HTMLDivElement>(null);
  useClearwaveHome(rootRef);

  return (
    <div className="clearwave-home" ref={rootRef}>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="cw-container">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-badge reveal">
                <div className="hero-badge-dot">✦</div>
                <span>{t("hero.eyebrow")}</span>
              </div>
              <h1 className="hero-title reveal reveal-delay-1">
                {t("hero.title1")}
                <br />
                <em>{t("hero.title2")}</em>
              </h1>
              <p className="hero-sub reveal reveal-delay-2">{t("hero.subtitle")}</p>
              <div className="hero-actions reveal reveal-delay-3">
                <Link href="/register" className="btn-primary-lg">
                  {t("ctaCreate")}
                  <span className="btn-arrow">→</span>
                </Link>
                <a href="#screens" className="btn-outline-lg">
                  <span>▶</span> {t("ctaSeeHow")}
                </a>
              </div>
              <div className="hero-trust reveal reveal-delay-4">
                <div className="trust-item">{t("hero.trust1")}</div>
                <div className="trust-divider" />
                <div className="trust-item">{t("hero.trust2")}</div>
                <div className="trust-divider" />
                <div className="trust-item">{t("hero.trust3")}</div>
              </div>
            </div>

            <div className="hero-visual reveal reveal-delay-2">
              <div className="hero-dashboard">
                <div className="dashboard-bar">
                  <div className="db-dot" />
                  <div className="db-dot" />
                  <div className="db-dot" />
                </div>
                <div className="dashboard-body">
                  <div className="db-header">
                    <div className="db-title">{t("org.mockTitle")}</div>
                    <div className="db-tag">{t("hero.liveBadge")}</div>
                  </div>
                  <div
                    style={{
                      position: "relative",
                      height: 120,
                      borderRadius: 8,
                      overflow: "hidden",
                      marginBottom: 12,
                    }}
                  >
                    <Image
                      src={DEMO.wall}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  </div>
                  <div className="db-stats">
                    <div className="db-stat">
                      <div className="db-stat-val">
                        248
                        <span style={{ fontSize: ".9rem", color: "var(--accent)" }}>
                          {" "}
                        </span>
                      </div>
                      <div className="db-stat-label">{t("org.statPhotos")}</div>
                    </div>
                    <div className="db-stat">
                      <div className="db-stat-val">86</div>
                      <div className="db-stat-label">{t("org.statGuests")}</div>
                    </div>
                    <div className="db-stat">
                      <div className="db-stat-val">{t("org.statOn")}</div>
                      <div className="db-stat-label">{t("org.statWall")}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero-float-badge">
                <div className="float-badge-icon">✦</div>
                <div className="float-badge-text">
                  <strong>{t("hero.liveBadge")}</strong>
                  <span>{t("hero.liveChip")}</span>
                </div>
              </div>
              <div className="hero-float-badge-2">
                <div className="float-badge-2-val">{t("hero.qrLabel")}</div>
                <div className="float-badge-2-label">{t("qr.body")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OCCASION TICKER ── */}
      <div className="ticker-section">
        <div className="ticker-label">{t("ticker.label")}</div>
        <div className="ticker-track-wrap">
          <div className="ticker-track">
            {[0, 1].map((dup) => (
              <span key={dup} style={{ display: "contents" }}>
                {OCCASION_KEYS.map((key) => (
                  <span key={`${dup}-${key}`} style={{ display: "contents" }}>
                    <div className="ticker-item">
                      <div className="ticker-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      </div>
                      {tOccasions(key)}
                    </div>
                    <div className="ticker-dot" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PHONE CAROUSEL ── */}
      <section className="carousel-section" id="screens">
        <div className="cw-container">
          <div className="carousel-header">
            <div className="section-label reveal">{t("strip.eyebrow")}</div>
            <h2 className="section-title reveal reveal-delay-1">
              {t("strip.title").split("—")[0].trim()}
              <br />
              <em>{t("strip.album.title")}</em>
            </h2>
            <p className="section-sub reveal reveal-delay-2">{t("strip.subtitle")}</p>
          </div>
        </div>

        <div className="carousel-zoom">
          <button type="button" className="zoom-btn" id="zoomOut" aria-label="Zoom out">
            −
          </button>
          <div className="zoom-pips" id="zoomPips" />
          <button type="button" className="zoom-btn" id="zoomIn" aria-label="Zoom in">
            +
          </button>
        </div>

        <div className="carousel-stage" id="carouselStage">
          <div className="carousel-track" id="carouselTrack">
            {PHONE_SCREENS.map((src, i) => {
              const pos =
                i === 0
                  ? "left2"
                  : i === 1
                    ? "left1"
                    : i === 2
                      ? "center"
                      : i === 3
                        ? "right1"
                        : "right2";
              return (
                <div
                  key={src}
                  className="phone-card"
                  data-pos={pos}
                  data-index={i}
                >
                  <div className="phone-shell">
                    <div className="phone-screen">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            width: "100%",
            marginTop: 48,
          }}
        >
          <button type="button" className="carousel-btn" id="carouselPrev" aria-label="Previous">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="carousel-dots" id="carouselDots" />
          <button type="button" className="carousel-btn" id="carouselNext" aria-label="Next">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section" id="features">
        <div className="cw-container">
          <div className="features-header">
            <div className="section-label reveal">{t("how.eyebrow")}</div>
            <h2 className="section-title reveal reveal-delay-1">
              {t("how.title").split(".")[0]}.
              <br />
              <em>{t("how.title").split(".").slice(1).join(".").trim() || t("how.create.title")}</em>
            </h2>
            <p className="section-sub reveal reveal-delay-2">{t("how.subtitle")}</p>
          </div>

          {FEATURE_ROWS.map((row) => (
            <div
              key={row.key}
              className={row.reverse ? "feature-row reverse" : "feature-row"}
            >
              <div className="feature-content reveal">
                <div className="feature-number">
                  {row.number} — {t(`features.${row.key}.eyebrow`)}
                </div>
                <h3 className="feature-title">{t(`features.${row.key}.title`)}</h3>
                <p className="feature-desc">{t(`features.${row.key}.body`)}</p>
                <div className="feature-checklist">
                  {(["c1", "c2", "c3"] as const).map((c) => (
                    <div key={c} className="feature-check">
                      <div className="check-icon">✓</div>
                      <span>{t(`features.${row.key}.${c}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="feature-visual reveal reveal-delay-1">
                <div className="feature-visual-inner" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ position: "relative", aspectRatio: "4/3" }}>
                    <Image
                      src={row.img}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 480px"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HONEST PROOF ── */}
      <section className="stats-section">
        <div className="cw-container">
          <div className="stats-grid">
            {PROOF_KEYS.map((key, i) => (
              <div
                key={key}
                className={`stat-card reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}
              >
                <div className="stat-rule" />
                <div className="stat-value" style={{ fontSize: "1.75rem" }}>
                  {t(`proofStrip.${key}.title`)}
                </div>
                <div className="stat-label">{t(`proofStrip.${key}.desc`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing-section" id="pricing">
        <div className="cw-container">
          <div className="pricing-header">
            <div className="section-label reveal">{t("pricingTeaser.eyebrow")}</div>
            <h2 className="section-title reveal reveal-delay-1">
              {tPricing("title").split(" ").slice(0, 2).join(" ")}{" "}
              <em>{tPricing("title").split(" ").slice(2).join(" ")}</em>
            </h2>
            <p className="section-sub reveal reveal-delay-2">{tPricing("subtitle")}</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card reveal">
              <div className="pricing-tier">{tPricing("freeName")}</div>
              <div className="pricing-price">
                <span className="price-amount" style={{ fontSize: "2.5rem" }}>
                  $0
                </span>
              </div>
              <div className="price-annual-note">&nbsp;</div>
              <p className="pricing-desc">{tPricing("freeDesc")}</p>
              <div className="pricing-divider" />
              <div className="pricing-features">
                {(["freeF1", "freeF2", "freeF3"] as const).map((f) => (
                  <div key={f} className="pricing-feature">
                    <div className="pricing-check">✓</div>
                    <span>{tPricing(f)}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="pricing-cta">
                {t("ctaCreate")}
              </Link>
            </div>

            <div className="pricing-card featured reveal reveal-delay-1">
              <div className="pricing-badge">{t("pricingTeaser.popular")}</div>
              <div className="pricing-tier">{tPricing("proName")}</div>
              <div className="pricing-price">
                <span className="price-amount" style={{ fontSize: "1.5rem" }}>
                  {t("pricingTeaser.proPrice")}
                </span>
              </div>
              <div className="price-annual-note">&nbsp;</div>
              <p className="pricing-desc">{tPricing("proDesc")}</p>
              <div className="pricing-divider" />
              <div className="pricing-features">
                {(["proF1", "proF2", "proF3", "proF4"] as const).map((f) => (
                  <div key={f} className="pricing-feature">
                    <div className="pricing-check">✓</div>
                    <span>{tPricing(f)}</span>
                  </div>
                ))}
              </div>
              <Link href="/pricing" className="pricing-cta">
                {t("pricingTeaser.cta")}
              </Link>
            </div>

            <div className="pricing-card reveal reveal-delay-2">
              <div className="pricing-tier">{tPricing("entName")}</div>
              <div className="pricing-price">
                <span className="price-amount" style={{ fontSize: "1.5rem" }}>
                  {tPricing("contactSales")}
                </span>
              </div>
              <div className="price-annual-note">&nbsp;</div>
              <p className="pricing-desc">{tPricing("entDesc")}</p>
              <div className="pricing-divider" />
              <div className="pricing-features">
                {(["entF1", "entF2", "entF3", "entF4"] as const).map((f) => (
                  <div key={f} className="pricing-feature">
                    <div className="pricing-check">✓</div>
                    <span>{tPricing(f)}</span>
                  </div>
                ))}
              </div>
              <Link href="/pricing" className="pricing-cta">
                {tPricing("contactSales")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section" id="testimonials">
        <div className="cw-container">
          <div className="testimonials-header">
            <div className="section-label reveal">{t("testimonials.eyebrow")}</div>
            <h2 className="section-title reveal reveal-delay-1">
              {t("testimonials.title")}
            </h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card tall reveal">
              <div className="testimonial-stars">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="testimonial-quote">&ldquo;{t("testimonials.featured")}&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar">EK</div>
                <div>
                  <div className="author-name">{t("testimonials.featuredName")}</div>
                  <div className="author-role">{t("testimonials.featuredMeta")}</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card reveal reveal-delay-1">
              <div className="testimonial-stars">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="testimonial-quote">&ldquo;{t("testimonials.t2")}&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar">MT</div>
                <div>
                  <div className="author-name">{t("testimonials.t2Name")}</div>
                  <div className="author-role">{t("testimonials.t2Meta")}</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card reveal reveal-delay-2">
              <div className="testimonial-stars">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="testimonial-quote">&ldquo;{t("testimonials.t3")}&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar">SN</div>
                <div>
                  <div className="author-name">{t("testimonials.t3Name")}</div>
                  <div className="author-role">{t("testimonials.t3Meta")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq-section" id="faq">
        <div className="cw-container">
          <div className="faq-inner">
            <div className="faq-sidebar reveal">
              <div className="section-label">{t("faq.title")}</div>
              <h2 className="section-title">
                {t("faq.title")},
                <br />
                <em>{t("faq.subtitle")}</em>
              </h2>
              <button
                type="button"
                className="faq-toggle-all"
                id="faqToggleAll"
                data-expand-label={t("faq.expandAll")}
                data-collapse-label={t("faq.collapseAll")}
              >
                <span id="faqToggleIcon">+</span>
                <span id="faqToggleLabel"> {t("faq.expandAll")}</span>
              </button>
            </div>
            <div className="faq-list reveal reveal-delay-1" id="faqList">
              {FAQ_KEYS.map((key) => (
                <div key={key} className="faq-item">
                  <div
                    className="faq-question"
                    tabIndex={0}
                    role="button"
                    aria-expanded="false"
                  >
                    {t(`faq.items.${key}.q`)}
                    <div className="faq-icon">+</div>
                  </div>
                  <div className="faq-answer">
                    <div className="faq-answer-inner">{t(`faq.items.${key}.a`)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cw-container">
          <div className="cta-inner reveal">
            <div className="cta-content">
              <div className="cta-label">✦ {t("ctaCreate")}</div>
              <h2 className="cta-title">{t("finalCta.title")}</h2>
              <p className="cta-sub">{t("finalCta.subtitle")}</p>
            </div>
            <div className="cta-actions">
              <Link href="/register" className="btn-cta-primary">
                {t("ctaCreate")}
                <span>→</span>
              </Link>
              <a href="#screens" className="btn-cta-ghost">
                {t("ctaSeeHow")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
