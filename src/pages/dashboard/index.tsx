import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <DashboardLayout>
      <h2 className="text-3xl font-bold mb-6">Welcome to your Dashboard</h2>
      <p>Select an option from the sidebar to manage your online shop.</p>
    </DashboardLayout>
  );
}
