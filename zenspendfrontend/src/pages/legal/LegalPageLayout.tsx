import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Shared layout for static legal pages (terms, privacy, cookies).
 * The content below is a working template and should be reviewed by a
 * legal professional before a public launch.
 */
const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted mb-10">Dernière mise à jour : {lastUpdated}</p>
        <div className="space-y-6 text-muted leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;
