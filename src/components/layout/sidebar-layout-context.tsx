"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "loteria-sidebar-collapsed";

interface SidebarLayoutContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(
  null
);

export function SidebarLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsedState(localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <SidebarLayoutContext.Provider
      value={{ collapsed: hydrated ? collapsed : false, toggle, setCollapsed }}
    >
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) {
    throw new Error("useSidebarLayout must be used within SidebarLayoutProvider");
  }
  return ctx;
}
