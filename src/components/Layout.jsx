import { Header, FeedbackButton, defaultNavItems, defaultCtaButton } from "@empoweredvote/ev-ui";
import { useCompass } from "../contexts/CompassContext";
import { redirectToLogin } from "../lib/auth";
import { useSearchParams } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
export function Layout({ children }) {
  const { isLoggedIn, userName, logout } = useCompass();
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const currentAddress = searchParams.get('q') || '';

  const profileMenu = isLoggedIn
    ? {
        label: userName || "Account",
        items: [{ label: "Sign out", onClick: logout }],
      }
    : {
        label: "Account",
        items: [
          {
            label: "Sign in",
            onClick: () => redirectToLogin(),
          },
        ],
      };

  const baseNavItems = currentAddress
    ? defaultNavItems.map(item => {
        if (item.dropdown) {
          return {
            ...item,
            dropdown: item.dropdown.map(sub =>
              sub.label === 'Read & Rank'
                ? { ...sub, href: `https://readrank.empowered.vote?address=${encodeURIComponent(currentAddress)}` }
                : sub
            ),
          };
        }
        return item;
      })
    : defaultNavItems;

  const navItems = baseNavItems;

  return (
    <>
      <Header
        logoSrc="/EVLogo.svg"
        logoAlt="Empowered Vote"
        navItems={navItems}
        ctaButton={defaultCtaButton}
        secondaryAction={<div className="flex items-center gap-2"><ThemeToggle /><FeedbackButton /></div>}
        onNavigate={(href) => { window.location.href = href; }}
        profileMenu={profileMenu}
        style={isDark ? {
          backgroundColor: '#020618',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        } : undefined}
      />
      {children}
    </>
  );
}
