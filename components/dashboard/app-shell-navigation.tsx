"use client";

import {
  Battery,
  CarFront,
  Clock,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { UnverifiedDot } from "@/components/dashboard/status-indicators";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FacilityOption = {
  code: string;
  name: string;
};

type ShellProfile = {
  name?: string | null;
  is_admin?: boolean;
  is_technician?: boolean;
  is_verified?: boolean;
};

type AppShellNavigationProps = {
  activeFacility: string;
  activeFacilityName: string;
  activeTab: string;
  facilities: FacilityOption[];
  headerAccessory?: ReactNode;
  isSidebarOpen: boolean;
  profile: ShellProfile;
  goTab: (tab: string) => void;
  logout: () => void;
  setActiveFacility: (facility: string) => void;
  setActiveTab: (tab: string) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
};

const sidebarBaseItems = [
  {
    id: "home",
    label: "Home",
    icon: <CarFront className="size-4" />,
  },
  {
    id: "search",
    label: "Vehicles",
    icon: <Search className="size-4" />,
  },
  {
    id: "bos",
    label: "BOS",
    icon: <Battery className="size-4" />,
  },
  {
    id: "parking",
    label: "Parking Overview",
    icon: <MapPin className="size-4" />,
  },
] as const;

const sidebarFooterItems = [
  {
    id: "driveout-history",
    label: "Drive-Out History",
    icon: <Clock className="size-4" />,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="size-4" />,
  },
] as const;

const bottomNavItems = [
  { id: "home", label: "Home", icon: <CarFront className="size-5" /> },
  {
    id: "search",
    label: "Vehicles",
    icon: <Search className="size-5" />,
  },
  {
    id: "bos",
    label: "BOS",
    icon: <Battery className="size-5" />,
  },
  {
    id: "parking",
    label: "Parking",
    icon: <MapPin className="size-5" />,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="size-5" />,
  },
] as const;

function profileInitials(name?: string | null) {
  return (name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppShellNavigation({
  activeFacility,
  activeFacilityName,
  activeTab,
  facilities,
  headerAccessory,
  isSidebarOpen,
  profile,
  goTab,
  logout,
  setActiveFacility,
  setActiveTab,
  setIsSidebarOpen,
}: AppShellNavigationProps) {
  const sidebarItems = [
    ...sidebarBaseItems,
    // Turret ESC Checklist tab - temporarily disabled.
    // Change `false &&` back to `profile.is_technician` to restore this nav item.
    ...(false && profile.is_technician
      ? [
          {
            id: "turret-esc",
            label: "Turret ESC Checklist",
            icon: <Wrench className="size-4" />,
          },
        ]
      : []),
    ...sidebarFooterItems,
    ...(profile.is_admin
      ? [
          {
            id: "admin",
            label: "Admin",
            icon: <ShieldCheck className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 rounded-lg">
          <button
            type="button"
            onClick={() => goTab("home")}
            className="rounded-lg transition hover:opacity-80 focus:outline-none focus:ring-3 focus:ring-red-600/15"
            aria-label="Go to home page"
          >
            <Image
              src="/icon.png"
              alt="Trackr app logo"
              width={40}
              height={40}
              className="size-10 rounded-md object-cover border border-zinc-200"
              priority
            />
          </button>
          <div>
            <p className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">
              Trackr
            </p>
            {profile.is_admin && facilities.length > 0 ? (
              <select
                value={activeFacility}
                onChange={(e) => setActiveFacility(e.target.value)}
                aria-label="Switch depot"
                className="-ml-1 rounded-md border-none bg-transparent px-1 text-lg font-bold tracking-tight outline-none transition hover:bg-zinc-50 focus:ring-3 focus:ring-red-600/15"
              >
                {facilities.map((facility) => (
                  <option key={facility.code} value={facility.code}>
                    {facility.name}
                  </option>
                ))}
              </select>
            ) : (
              <h1
                onClick={() => goTab("home")}
                className="cursor-pointer text-lg font-bold tracking-tight"
              >
                {activeFacilityName}
              </h1>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerAccessory}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="hover:bg-zinc-100"
          >
            <Menu className="size-5" />
          </Button>
          <div
            onClick={() => goTab("profile")}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-red-100 border border-red-200 font-semibold text-red-700 text-sm hover:bg-red-200 transition"
          >
            {profileInitials(profile.name)}
          </div>
        </div>
      </header>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside
            className="w-72 bg-white h-full border-r border-zinc-200 p-6 flex flex-col justify-between shadow-xl animate-in slide-in-from-left duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Trackr</h2>
                  <p className="text-xs text-zinc-500">
                    {activeFacilityName} Carpark
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-full size-8"
                >
                  <span className="font-bold text-lg">x</span>
                </Button>
              </div>

              <nav className="space-y-1.5">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition",
                      activeTab === item.id
                        ? "bg-red-50 text-red-700"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-red-100 border border-red-200 font-semibold text-red-700 text-sm">
                  {(profile.name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-bold truncate leading-none mb-1">
                    {profile.name}
                    <UnverifiedDot isVerified={profile.is_verified} />
                  </p>
                  <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                    {profile.is_admin
                      ? "Admin"
                      : profile.is_technician
                        ? "Technician"
                        : "Combatant"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-zinc-600 hover:bg-red-50 hover:text-red-700 border-zinc-200"
                onClick={logout}
              >
                <LogOut className="size-4 mr-2" />
                Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 py-2 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-bold transition uppercase tracking-wider w-16",
              activeTab === item.id ||
                (item.id === "search" && activeTab === "detail") ||
                (item.id === "search" && activeTab === "history") ||
                (item.id === "parking" && activeTab === "parking-level")
                ? "text-red-600"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
