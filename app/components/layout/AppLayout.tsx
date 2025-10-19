import { useState } from "react";
import { AppProvider, Frame, Navigation, TopBar } from "@shopify/polaris";
import {
  HomeIcon,
  SearchIcon,
  PackageIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import { useNavigate, useMatches } from "@remix-run/react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const navigate = useNavigate();
  const matches = useMatches();
  
  const currentPath = matches[matches.length - 1]?.pathname || "/app";

  const toggleMobileNavigationActive = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const navigationItems = [
    {
      url: "/app",
      label: "My Sections",
      icon: HomeIcon,
      selected: currentPath === "/app",
    },
    {
      url: "/app/explore",
      label: "Explore Sections",
      icon: SearchIcon,
      selected: currentPath.startsWith("/app/explore"),
    },
    {
      url: "/app/bundles",
      label: "Bundle & Save",
      icon: PackageIcon,
      selected: currentPath.startsWith("/app/bundles"),
      badge: "Save 40%",
    },
    {
      url: "/app/conversion",
      label: "Conversion Blocks",
      icon: PackageIcon,
      selected: currentPath.startsWith("/app/conversion"),
      badge: "Plus",
    },
    {
      url: "/app/inspiration",
      label: "Section Inspiration",
      icon: SearchIcon,
      selected: currentPath.startsWith("/app/inspiration"),
    },
    {
      url: "/app/migrator",
      label: "Theme Migrator",
      icon: HomeIcon,
      selected: currentPath.startsWith("/app/migrator"),
    },
    {
      url: "/app/help",
      label: "Help Center",
      icon: HomeIcon,
      selected: currentPath.startsWith("/app/help"),
    },
  ];

  const secondaryNavigationItems = [
    {
      url: "/app/favorites",
      label: "Favorites",
      icon: HomeIcon,
      selected: currentPath.startsWith("/app/favorites"),
    },
    {
      url: "/app/settings",
      label: "Settings",
      icon: SettingsIcon,
      selected: currentPath.startsWith("/app/settings"),
    },
  ];

  const logo = {
    width: 124,
    topBarSource: "/logo.svg",
    contextualSaveBarSource: "/logo.svg",
    url: "/app",
    accessibilityLabel: "Section Store",
  };

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigationActive}
    />
  );

  const navigationMarkup = (
    <Navigation location={currentPath}>
      <Navigation.Section
        items={navigationItems.map((item) => ({
          ...item,
          onClick: () => navigate(item.url),
        }))}
      />
      <Navigation.Section
        separator
        items={secondaryNavigationItems.map((item) => ({
          ...item,
          onClick: () => navigate(item.url),
        }))}
      />
    </Navigation>
  );

  return (
    <AppProvider i18n={{}}>
      <Frame
        logo={logo}
        topBar={topBarMarkup}
        navigation={navigationMarkup}
        showMobileNavigation={mobileNavigationActive}
        onNavigationDismiss={toggleMobileNavigationActive}
      >
        {children}
      </Frame>
    </AppProvider>
  );
}
