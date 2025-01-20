import { useState, useEffect, useContext, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import { TaxationApi, Configuration } from '@/api';

interface Taxation {
  id: number;
  name: string | null;
  rate: number;
}

export default function TaxationPage() {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  const [taxations, setTaxations] = useState<Taxation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('');

  // Modal state for new taxation
  const [showModal, setShowModal] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState<number>(0);

  const config = new Configuration({ basePath: process.env.NEXT_PUBLIC_API_BASE_URL });
  const taxationApi = new TaxationApi(config);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    taxationApi
      .apiTaxationGet()
      .then((response) => {
        setTaxations(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Failed to fetch taxations.');
        setLoading(false);
      });
  }, [token, router, taxationApi]);

  const handleAddTaxation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const newTaxation = { name: newTaxName, rate: newTaxRate };
      const response = await taxationApi.apiTaxationPost(newTaxation);
      setTaxations((prev) => [...prev, response.data]);
      setNewTaxName('');
      setNewTaxRate(0);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to add new taxation.');
    }
  };

  const filteredTaxations = taxations.filter((tax) =>
    (tax.name ?? '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold mb-4 sm:mb-0">Taxation Variants</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            placeholder="Filter taxations..."
            className="border rounded p-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Add Taxation
          </button>
        </div>
      </header>

      {/* Taxation Table */}
      <div className="overflow-x-auto border rounded bg-white shadow">
        {loading ? (
          <p className="p-4">Loading taxations...</p>
        ) : errorMsg ? (
          <p className="p-4 text-red-500">{errorMsg}</p>
        ) : filteredTaxations.length === 0 ? (
          <p className="p-4">No taxations found.</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Rate</th>
                <th className="px-4 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxations.map((tax) => (
                <tr key={tax.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{tax.name}</td>
                  <td className="px-4 py-2">{tax.rate}%</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => router.push(`/dashboard/taxation/${tax.id}`)}
                      className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Adding New Taxation */}
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Add New Taxation</h3>
            <form onSubmit={handleAddTaxation} className="space-y-4">
              <div>
                <label className="block mb-1">Taxation Name</label>
                <input
                  type="text"
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter taxation name"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(Number(e.target.value))}
                  className="w-full border rounded p-2"
                  placeholder="Enter tax rate"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                  Add Taxation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
