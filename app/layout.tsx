import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SkakCoach',
    template: '%s | SkakCoach',
  },
  description: 'Skaktræning med computer-modstander, taktik og progression på dansk.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <div className="siteShell">
          <div className="siteBackdrop" />
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
