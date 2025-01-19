import { useState, useEffect, useContext, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import { ItemsApi, Configuration } from '@/api';

interface StockItem {
  id: number;
  name: string;
  stockCount: number;
  categoryName: string;
}

export default function StockPage() {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
  const itemsApi = new ItemsApi(config);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    itemsApi
      .apiItemsGet()
      .then((response) => {
        setStockItems(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Failed to fetch stock items.');
        setLoading(false);
      });
  }, [token, router, itemsApi]);

  const handleAddItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const newItem = { name: newItemName, description: null };
      const response = await itemsApi.apiItemsPost(newItem);
      setStockItems((prev) => [...prev, response.data]);
      setNewItemName('');
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to add new item.');
    }
  };

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Manage Stock</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Add Item
        </button>
      </header>

      {/* Stock Items Table */}
      <section>
        <h3 className="text-2xl font-semibold mb-4">Current Stock Items</h3>
        {loading ? (
          <p>Loading stock items...</p>
        ) : errorMsg ? (
          <p className="text-red-500">{errorMsg}</p>
        ) : stockItems.length === 0 ? (
          <p>No items in stock.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-left">Item Name</th>
                  <th className="p-4 text-left">Stock Count</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{item.name}</td>
                    <td className="p-4">{item.stockCount}</td>
                    <td className="p-4">{item.categoryName}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        onClick={() => router.push(`/dashboard/stock/${item.id}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal for Adding New Stock Item */}
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                  placeholder="Enter item name"
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
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
