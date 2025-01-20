import { useRouter } from 'next/router';
import { useState, useEffect, useContext, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
import { ShippingApi, Configuration } from '@/api';

interface ShippingVariant {
  id: number;
  name: string | null;
  cost: number;
}

export default function ShippingDetailPage() {
  const router = useRouter();
  const { id } = router.query; // Dynamic route parameter
  const { token } = useContext(AuthContext);
  const [shipping, setShipping] = useState<ShippingVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState<number>(0);

  const config = new Configuration({ basePath: process.env.NEXT_PUBLIC_API_BASE_URL });
  const shippingApi = new ShippingApi(config);

  useEffect(() => {
    if (!token || !id) return;
    if (typeof id === 'string') {
      shippingApi.apiShippingIdGet(Number(id))
        .then((response) => {
          setShipping(response.data);
          setNewName(response.data.name ?? '');
          setNewCost(response.data.cost ?? 0);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setErrorMsg('Failed to fetch shipping details.');
          setLoading(false);
        });
    }
  }, [token, id, shippingApi]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      // Implement your update logic here (e.g., shippingApi.apiShippingIdPut)
      console.log('Updating shipping id:', id, 'with new values:', newName, newCost);
      alert('Shipping variant updated (demo – implement the update endpoint).');
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to update shipping variant.');
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Shipping Detail</h2>
      </header>
      {loading ? (
        <p>Loading shipping details...</p>
      ) : errorMsg ? (
        <p className="text-red-500">{errorMsg}</p>
      ) : shipping ? (
        <div className="bg-white p-6 rounded shadow max-w-xl">
          <p className="mb-4"><strong>ID:</strong> {shipping.id}</p>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block mb-1">Shipping Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Cost</label>
              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/shipping/shipping')}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Back to Shipping
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p>Shipping variant not found.</p>
      )}
    </DashboardLayout>
  );
}
