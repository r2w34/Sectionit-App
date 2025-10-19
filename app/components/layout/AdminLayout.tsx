import { useState } from "react";
import { Frame, Navigation, TopBar, ActionList, Icon } from "@shopify/polaris";
import {
  HomeIcon,
  PackageIcon,
  ProductsIcon,
  CustomersIcon,
  AnalyticsIcon,
  SettingsIcon,
  LogOutIcon,
  OrderIcon,
} from "@shopify/polaris-icons";
import { useNavigate, useMatches, Form } from "@remix-run/react";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [userMenuActive, setUserMenuActive] = useState(false);
  const navigate = useNavigate();
  const matches = useMatches();
  
  const currentPath = matches[matches.length - 1]?.pathname || "/admin";

  const toggleMobileNavigationActive = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const toggleUserMenuActive = () => {
    setUserMenuActive(!userMenuActive);
  };

  const navigationItems = [
    {
      url: "/admin",
      label: "Dashboard",
      icon: HomeIcon,
      selected: currentPath === "/admin",
    },
    {
      url: "/admin/sections",
      label: "Sections",
      icon: ProductsIcon,
      selected: currentPath.startsWith("/admin/sections"),
    },
    {
      url: "/admin/bundles",
      label: "Bundles",
      icon: PackageIcon,
      selected: currentPath.startsWith("/admin/bundles"),
    },
    {
      url: "/admin/customers",
      label: "Customers",
      icon: CustomersIcon,
      selected: currentPath.startsWith("/admin/customers"),
    },
    {
      url: "/admin/orders",
      label: "Orders",
      icon: OrderIcon,
      selected: currentPath.startsWith("/admin/orders"),
    },
    {
      url: "/admin/analytics",
      label: "Analytics",
      icon: AnalyticsIcon,
      selected: currentPath.startsWith("/admin/analytics"),
    },
    {
      url: "/admin/settings",
      label: "Settings",
      icon: SettingsIcon,
      selected: currentPath.startsWith("/admin/settings"),
    },
  ];

  const userMenuActions = [
    {
      items: [
        {
          content: user.name,
          disabled: true,
        },
        {
          content: user.email,
          disabled: true,
        },
      ],
    },
    {
      items: [
        {
          content: "Sign Out",
          icon: LogOutIcon,
          onAction: () => {
            // This will be handled by a form submission
            const form = document.getElementById("logout-form") as HTMLFormElement;
            if (form) form.submit();
          },
        },
      ],
    },
  ];

  const userMenuMarkup = (
    <TopBar.UserMenu
      actions={userMenuActions}
      name={user.name}
      detail={user.role}
      initials={user.name.charAt(0).toUpperCase()}
      open={userMenuActive}
      onToggle={toggleUserMenuActive}
    />
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigationActive}
      userMenu={userMenuMarkup}
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
    </Navigation>
  );

  const logo = {
    width: 124,
    topBarSource: "/admin-logo.svg",
    contextualSaveBarSource: "/admin-logo.svg",
    url: "/admin",
    accessibilityLabel: "Section Store Admin",
  };

  return (
    <>
      <Frame
        logo={logo}
        topBar={topBarMarkup}
        navigation={navigationMarkup}
        showMobileNavigation={mobileNavigationActive}
        onNavigationDismiss={toggleMobileNavigationActive}
      >
        {children}
      </Frame>

      {/* Hidden logout form */}
      <Form method="post" action="/admin/logout" id="logout-form" style={{ display: "none" }} />
    </>
  );
}
