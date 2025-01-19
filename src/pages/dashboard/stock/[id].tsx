import { useRouter } from 'next/router';
import { useState, useEffect, useContext, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
import { ItemsApi, Configuration } from '@/api';

interface StockItem {
  id: number;
  name: string;
  stockCount: number;
  categoryName: string;
}

export default function StockDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useContext(AuthContext);
  const [item, setItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [newName, setNewName] = useState('');

  const config = new Configuration({ basePath: process.env.NEXT_PUBLIC_API_BASE_URL });
  const itemsApi = new ItemsApi(config);

  useEffect(() => {
    if (!token || !id) return;
    if (typeof id === 'string') {
      itemsApi.apiItemsIdGet(Number(id))
        .then((response) => {
          setItem(response.data);
          setNewName(response.data.name);
          setLoading(false);
        })
        .catch(() => {
          setErrorMsg('Failed to fetch item details.');
          setLoading(false);
        });
    }
  }, [token, id, itemsApi]);

  return (
    <DashboardLayout>
      <h2 className="text-3xl font-bold mb-4">Item Details</h2>
      {loading ? <p>Loading...</p> : errorMsg ? <p className="text-red-500">{errorMsg}</p> : (
        <div>
          <p><strong>Name:</strong> {item?.name}</p>
          <p><strong>Stock Count:</strong> {item?.stockCount}</p>
          <p><strong>Category:</strong> {item?.categoryName}</p>
        </div>
      )}
      <button onClick={() => router.push('/dashboard/stock/stock')} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">Back</button>
    </DashboardLayout>
  );
}
