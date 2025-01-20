import type { AppProps } from 'next/app';
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import { useContext } from 'react';
import '@/app/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthWrapper>
        <Component {...pageProps} />
      </AuthWrapper>
    </AuthProvider>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading } = useContext(AuthContext);
  if (isLoading) return <p>Loading...</p>; // Wait for auth check before rendering
  return <>{children}</>;
}
