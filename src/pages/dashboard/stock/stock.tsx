// pages/dashboard/stock/stock.tsx
import { useState, useEffect, useContext, FormEvent, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
// Import API classes from your generated API client
import { ItemsApi, Configuration, TaxationApi, ShippingApi } from '@/api';
import { useDropzone } from 'react-dropzone';

// Define interfaces for your data
interface Item {
  id: number;
  name: string;
  description: string | null;
  taxationId: number | null;
  priceItems?: Array<{ price: number; isSale?: boolean }>;
  images?: Array<{ base64Data: string; isThumbnail?: boolean; displayOrder?: number }>;
}

interface TaxationOption {
  id: number;
  name: string;
  rate: number;
}

interface ShippingOption {
  id: number;
  name: string;
  cost: number;
}

export default function ItemsPage() {
  const { token: contextToken } = useContext(AuthContext);
  const router = useRouter();

  // Optionally, get token from localStorage as a fallback
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const token = contextToken || storedToken;

  // State for items, error and a loading indicator
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // State for search/filter input
  const [filter, setFilter] = useState('');

  // State for modal visibility (to add a new item)
  const [showModal, setShowModal] = useState(false);
  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newTaxationId, setNewTaxationId] = useState<number | ''>('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [isSale, setIsSale] = useState(false);
  const [newShippingId, setNewShippingId] = useState<number | ''>('');
  // State for images (Base64 strings) uploaded via dropzone
  const [newImageBase64List, setNewImageBase64List] = useState<string[]>([]);

  // State for fetched taxation and shipping options (to be shown in select dropdowns)
  const [taxationOptions, setTaxationOptions] = useState<TaxationOption[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);

  // Memoize API configuration (include the token so that all requests carry it)
  const config = useMemo(() => {
    return new Configuration({
      basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
      accessToken: token || undefined,
    });
  }, [token]);

  const itemsApi = useMemo(() => new ItemsApi(config), [config]);
  const taxationApi = useMemo(() => new TaxationApi(config), [config]);
  const shippingApi = useMemo(() => new ShippingApi(config), [config]);

  // Redirect to login if token is not present
  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    // Fetch items once when token is available.
    const fetchItems = async () => {
      try {
        const response = await itemsApi.apiItemsGet();
        setItems(response.data || []);
      } catch (error) {
        console.error('Items fetch error:', error);
        setErrorMsg('Failed to fetch items.');
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [token, itemsApi, router]);

  // Fetch taxation options (once)
  useEffect(() => {
    if (!token) return;
    const fetchTaxation = async () => {
      try {
        const response = await taxationApi.apiTaxationGet();
        setTaxationOptions(response.data || []);
      } catch (error) {
        console.error('Taxation fetch error:', error);
      }
    };
    fetchTaxation();
  }, [token, taxationApi]);

  // Fetch shipping options (once)
  useEffect(() => {
    if (!token) return;
    const fetchShipping = async () => {
      try {
        const response = await shippingApi.apiShippingGet();
        setShippingOptions(response.data || []);
      } catch (error) {
        console.error('Shipping fetch error:', error);
      }
    };
    fetchShipping();
  }, [token, shippingApi]);

  // Handler for form submit that creates a new item
  const handleAddItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Create payload to match CreateItemWithPricesDto
      const newItemData = {
        name: newItemName,
        description: newItemDescription,
        taxationId: newTaxationId === '' ? null : Number(newTaxationId),
        priceItems: newPrice === '' ? null : [{ price: Number(newPrice), isSale }],
        images: newImageBase64List.length > 0
          ? newImageBase64List.map((img, index) => ({
              base64Data: img,
              isThumbnail: index === 0,
              displayOrder: index + 1,
            }))
          : null,
        // If your API accepts a shipping option, you can pass shippingId:
        // shippingId: newShippingId === '' ? null : Number(newShippingId),
      };

      const response = await itemsApi.apiItemsCreateWithPricesPost(newItemData);
      // Add the new item to the current list
      setItems((prev) => [...prev, response.data]);
      // Reset the form fields and close modal
      setNewItemName('');
      setNewItemDescription('');
      setNewTaxationId('');
      setNewPrice('');
      setIsSale(false);
      setNewImageBase64List([]);
      setNewShippingId('');
      setShowModal(false);
    } catch (error) {
      console.error('Create item error:', error);
      setErrorMsg('Failed to add new item.');
    }
  };

  // Compute filtered items based on the filter text (case-insensitive search)
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Dropzone handler: Convert dropped files to Base64 strings and append them
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject('Could not convert file to Base64');
            }
          };
          reader.onerror = (error) => reject(error);
        });
      try {
        const base64Files = await Promise.all(
          acceptedFiles.map((file) => toBase64(file))
        );
        setNewImageBase64List((prev) => [...prev, ...base64Files]);
      } catch (error) {
        console.error('Error converting file(s):', error);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <DashboardLayout>
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold mb-4 sm:mb-0">Manage Items</h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <input
            type="text"
            placeholder="Filter items..."
            className="border rounded p-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Add Item
          </button>
        </div>
      </header>

      {/* Items Table */}
      <div className="overflow-x-auto border rounded bg-white shadow">
        {loadingItems ? (
          <p className="p-4">Loading items...</p>
        ) : errorMsg ? (
          <p className="p-4 text-red-500">{errorMsg}</p>
        ) : filteredItems.length === 0 ? (
          <p className="p-4">No items found.</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Item Name</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/stock/${item.id}`)
                      }
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

      {/* Modal for Adding New Item */}
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 overflow-y-auto max-h-full">
            <h3 className="text-2xl font-bold mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-1">Taxation</label>
                <select
                  value={newTaxationId}
                  onChange={(e) =>
                    setNewTaxationId(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="">Select taxation (optional)</option>
                  {taxationOptions.map((tax) => (
                    <option key={tax.id} value={tax.id}>
                      {tax.name} ({tax.rate}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Shipping Option</label>
                <select
                  value={newShippingId}
                  onChange={(e) =>
                    setNewShippingId(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="">Select shipping option (optional)</option>
                  {shippingOptions.map((ship) => (
                    <option key={ship.id} value={ship.id}>
                      {ship.name} (${ship.cost})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Price</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter price"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSale}
                  onChange={(e) => setIsSale(e.target.checked)}
                  id="isSale"
                />
                <label htmlFor="isSale">Is Sale?</label>
              </div>
              <div>
                <label className="block mb-1">Images</label>
                <div
                  {...getRootProps()}
                  className="border-dashed border-2 p-4 text-center cursor-pointer rounded"
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Drop the images here ...</p>
                  ) : newImageBase64List.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {newImageBase64List.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Selected ${index}`}
                          className="h-24 object-contain border"
                        />
                      ))}
                    </div>
                  ) : (
                    <p>Drag & drop images here, or click to select files</p>
                  )}
                </div>
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
