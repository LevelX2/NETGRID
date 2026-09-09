"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Images, Users } from "lucide-react";
import { useTranslations } from "use-intl/react";
import { COLOR_SCHEME_STORAGE_KEY } from "../../lib/storage-keys";
import { resolveMaintenanceServerHttp } from "../maintenance";
import {
  MaintenanceAuthBoundary,
  MaintenanceSecurityControls,
  MaintenanceSessionContext,
  useMaintenanceAuth,
} from "../maintenance-auth-ui";
import "./maintenance.css";
import { MaintenanceBuildStatus } from "./build-status";

export default function MaintenanceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("Maintenance.storage");
  const pathname = usePathname();
  const [serverHttp] = useState(() =>
    resolveMaintenanceServerHttp(
      process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787",
      typeof window === "undefined" ? undefined : window.location.hostname,
    ),
  );
  const auth = useMaintenanceAuth(serverHttp);
  useEffect(() => {
    const applyTheme = () => {
      const theme = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
      document.documentElement.dataset.theme =
        theme === "white" ? "white" : "black";
    };
    applyTheme();
    const onStorage = (event: StorageEvent) => {
      if (event.key === COLOR_SCHEME_STORAGE_KEY || event.key === null)
        applyTheme();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const tabs = [
    {
      href: "/maintenance/status",
      label: t("statusTab"),
      icon: Database,
      active:
        pathname === "/maintenance/status" ||
        pathname === "/maintenance/ai-traces",
    },
    {
      href: "/maintenance/accounts",
      label: t("accountAccess"),
      icon: Users,
      active: pathname === "/maintenance/accounts",
    },
    {
      href: "/maintenance/card-images",
      label: t("m035"),
      icon: Images,
      active: pathname === "/maintenance/card-images",
    },
  ];
  return (
    <div className="maintenanceShell">
      <header className="maintenanceTopbar">
        <Link href="/maintenance" prefetch={false} className="maintenanceBrand">
          <Database size={23} aria-hidden="true" />
          {t("maintenanceTitle")}
        </Link>
        {auth.status === "authenticated" ? (
          <>
            <nav aria-label={t("navigation")} className="maintenanceTabs">
              {tabs.map(({ href, label, icon: Icon, active }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
            <MaintenanceSecurityControls auth={auth} />
          </>
        ) : null}
      </header>
      <MaintenanceBuildStatus serverHttp={serverHttp} />
      <div className="maintenanceContent">
        {auth.status === "authenticated" ? (
          <MaintenanceSessionContext.Provider value={auth}>
            {children}
          </MaintenanceSessionContext.Provider>
        ) : (
          <MaintenanceAuthBoundary auth={auth} title={t("m032")} />
        )}
      </div>
    </div>
  );
}
