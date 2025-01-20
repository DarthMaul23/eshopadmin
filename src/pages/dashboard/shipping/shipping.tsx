import { useState, useEffect, useContext, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import { ShippingApi, Configuration } from '@/api';

interface ShippingVariant {
  id: number;
  name: string | null;
  cost: number;
}

export default function ShippingPage() {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  const [shippingVariants, setShippingVariants] = useState<ShippingVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('');

  // Modal state for adding new shipping variant
  const [showModal, setShowModal] = useState(false);
  const [newShippingName, setNewShippingName] = useState('');
  const [newShippingCost, setNewShippingCost] = useState<number>(0);

  const config = new Configuration({ basePath: process.env.NEXT_PUBLIC_API_BASE_URL });
  const shippingApi = new ShippingApi(config);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    shippingApi
      .apiShippingGet()
      .then((response) => {
        setShippingVariants(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Failed to fetch shipping variants.');
        setLoading(false);
      });
  }, [token, router, shippingApi]);

  const handleAddShipping = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const newShipping = { name: newShippingName, cost: newShippingCost };
      const response = await shippingApi.apiShippingPost(newShipping);
      setShippingVariants((prev) => [...prev, response.data]);
      setNewShippingName('');
      setNewShippingCost(0);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to add new shipping variant.');
    }
  };

  const filteredShipping = shippingVariants.filter((ship) =>
    (ship.name ?? '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold mb-4 sm:mb-0">Shipping Variants</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            placeholder="Filter shipping..."
            className="border rounded p-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Add Shipping
          </button>
        </div>
      </header>

      {/* Shipping Variants Table */}
      <div className="overflow-x-auto border rounded bg-white shadow">
        {loading ? (
          <p className="p-4">Loading shipping variants...</p>
        ) : errorMsg ? (
          <p className="p-4 text-red-500">{errorMsg}</p>
        ) : filteredShipping.length === 0 ? (
          <p className="p-4">No shipping variants found.</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Cost</th>
                <th className="px-4 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipping.map((ship) => (
                <tr key={ship.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{ship.name}</td>
                  <td className="px-4 py-2">${ship.cost.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => router.push(`/dashboard/shipping/${ship.id}`)}
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

      {/* Modal for Adding New Shipping Variant */}
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Add New Shipping Variant</h3>
            <form onSubmit={handleAddShipping} className="space-y-4">
              <div>
                <label className="block mb-1">Shipping Name</label>
                <input
                  type="text"
                  value={newShippingName}
                  onChange={(e) => setNewShippingName(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter shipping name"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Cost</label>
                <input
                  type="number"
                  value={newShippingCost}
                  onChange={(e) => setNewShippingCost(Number(e.target.value))}
                  className="w-full border rounded p-2"
                  placeholder="Enter cost"
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
                  Add Shipping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
