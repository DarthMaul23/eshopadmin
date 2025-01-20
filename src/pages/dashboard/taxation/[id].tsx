import { useRouter } from 'next/router';
import { useState, useEffect, useContext, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
import { TaxationApi, Configuration } from '@/api';

interface Taxation {
  id: number;
  name: string | null;
  rate: number;
}

export default function TaxationDetailPage() {
  const router = useRouter();
  const { id } = router.query; // Dynamic route parameter
  const { token } = useContext(AuthContext);
  const [taxation, setTaxation] = useState<Taxation | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState<number>(0);

  const config = new Configuration({ basePath: process.env.NEXT_PUBLIC_API_BASE_URL });
  const taxationApi = new TaxationApi(config);

  useEffect(() => {
    if (!token || !id) return;
    if (typeof id === 'string') {
      taxationApi
        .apiTaxationIdGet(Number(id))
        .then((response) => {
          setTaxation(response.data);
          setNewName(response.data.name ?? '');
          setNewRate(response.data.rate ?? 0);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setErrorMsg('Failed to fetch taxation details.');
          setLoading(false);
        });
    }
  }, [token, id, taxationApi]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      // If your API supports updating, call it here:
      console.log('Updating taxation id:', id, 'with new values:', newName, newRate);
      alert('Taxation updated (demo – implement update endpoint accordingly).');
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to update taxation.');
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Taxation Detail</h2>
      </header>
      {loading ? (
        <p>Loading taxation details...</p>
      ) : errorMsg ? (
        <p className="text-red-500">{errorMsg}</p>
      ) : taxation ? (
        <div className="bg-white p-6 rounded shadow max-w-xl">
          <p className="mb-4"><strong>Taxation ID:</strong> {taxation.id}</p>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block mb-1">Taxation Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
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
                onClick={() => router.push('/dashboard/taxation/taxation')}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Back to Taxation
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p>Taxation not found.</p>
      )}
    </DashboardLayout>
  );
}
