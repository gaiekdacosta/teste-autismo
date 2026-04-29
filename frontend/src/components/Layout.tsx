import type { ReactNode } from 'react';
import WhatsappButton from './WhatsappButton';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative">
      {children}
      <WhatsappButton />
    </div>
  );
}
