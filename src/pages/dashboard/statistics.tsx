import { useContext, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import axios from 'axios';

interface StatisticsData {
  totalItems: number;
  totalCategories: number;
  totalOrders: number;
  totalSales: number;
}

export default function StatisticsPage() {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setStats(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Failed to fetch statistics.');
        setLoading(false);
      });
  }, [token, router]);

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Statistics</h2>
      </header>
      <section>
        {loading ? (
          <p>Loading statistics...</p>
        ) : errorMsg ? (
          <p className="text-red-500">{errorMsg}</p>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded shadow">
              <h3 className="text-xl font-semibold">Total Items</h3>
              <p className="text-3xl">{stats.totalItems}</p>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <h3 className="text-xl font-semibold">Total Categories</h3>
              <p className="text-3xl">{stats.totalCategories}</p>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <h3 className="text-xl font-semibold">Total Orders</h3>
              <p className="text-3xl">{stats.totalOrders}</p>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <h3 className="text-xl font-semibold">Total Sales</h3>
              <p className="text-3xl">${stats.totalSales.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p>No statistics available.</p>
        )}
      </section>
    </DashboardLayout>
  );
}
