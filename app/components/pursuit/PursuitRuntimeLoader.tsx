"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PursuitRuntimeLoader() {
  const pathname = usePathname();

  useEffect(() => {
    const boot = () => {
      window.setTimeout(() => {
        (window as typeof window & { __storelabPursuitBoot?: () => void }).__storelabPursuitBoot?.();
      }, 0);
    };

    if ((window as typeof window & { __storelabPursuitRuntime?: boolean }).__storelabPursuitRuntime) {
      boot();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-storelab-pursuit-runtime="true"]');

    if (!script) {
      script = document.createElement("script");
      script.src = "/pursuit-runtime.js";
      script.async = true;
      script.dataset.storelabPursuitRuntime = "true";
      script.addEventListener("load", boot, { once: true });
      document.body.appendChild(script);
      return;
    }

    script.addEventListener("load", boot, { once: true });
  }, [pathname]);

  return null;
}
