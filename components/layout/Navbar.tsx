'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const primaryLinks: Array<{ href: Route; label: string }> = [
  { href: '/', label: 'Forside' },
  { href: '/play', label: 'Spil' },
  { href: '/tactics', label: 'Taktik' },
  { href: '/profile', label: 'Profil' },
];

const futureLinks: Array<{ href: Route; label: string }> = [
  { href: '/openings', label: 'Åbninger' },
  { href: '/gm', label: 'GM-mode' },
  { href: '/learn', label: 'Lær skak' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="shellContainer navbarInner">
        <Link className="brandLink" href="/">
          <span className="brandMark">SC</span>
          <span className="brandText">
            <strong>SkakCoach</strong>
            <small>Træning på dansk</small>
          </span>
        </Link>

        <nav aria-label="Hovednavigation" className="navPrimary">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              className={`navLink${pathname === link.href ? ' navLinkActive' : ''}`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Kommende områder" className="navSecondary">
          {futureLinks.map((link) => (
            <Link
              key={link.href}
              className={`navSecondaryLink${pathname === link.href ? ' navSecondaryLinkActive' : ''}`}
              href={link.href}
            >
              <span>{link.label}</span>
              <small>Kommer snart</small>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
