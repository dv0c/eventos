"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
  const t = useTranslations("pages.contact");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <Card className="surface-elevated">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("emailLabel")}</p>
                <p className="text-sm text-muted-foreground">hello@eventos.gr</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("phoneLabel")}</p>
                <p className="text-sm text-muted-foreground">+30 210 123 4567</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("addressLabel")}</p>
                <p className="text-sm text-muted-foreground">{t("address")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("formName")}</Label>
              <Input id="name" placeholder={t("formNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("formEmail")}</Label>
              <Input id="email" type="email" placeholder={t("formEmailPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t("formMessage")}</Label>
              <textarea
                id="message"
                rows={4}
                placeholder={t("formMessagePlaceholder")}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button variant="gold" className="w-full">{t("formSubmit")}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
