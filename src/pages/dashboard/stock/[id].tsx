import { useRouter } from 'next/router';
import {
  useState,
  useEffect,
  useContext,
  useCallback,
  FormEvent,
  useMemo
} from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
import { ItemsApi, Configuration, TaxationApi, CategoriesApi } from '@/api';
import { useDropzone } from 'react-dropzone';

// Define interfaces for our data structures
interface PriceItem {
  id?: number;
  price: number;
  isSale?: boolean;
}

interface ItemImage {
  id?: number;
  base64Data: string;
  isThumbnail?: boolean;
  displayOrder?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Item {
  id: number;
  name: string;
  description: string | null;
  taxationId: number | null;
  taxation?: {
    id: number;
    name: string;
    rate: number;
  };
  createdAt: string;
  priceItems?: PriceItem[];
  itemCategories?: Category[]; // Categories list
  itemImages?: ItemImage[];
  stocks?: number;
}

interface TaxationOption {
  id: number;
  name: string;
  rate: number;
}

interface CategoryOption {
  id: number;
  name: string;
}

type Tab = 'info' | 'price' | 'images' | 'stocks';

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useContext(AuthContext);

  // State for fetched item details
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active tab for detail view
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Editable state for base item info
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTaxationId, setEditTaxationId] = useState<number | ''>('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Editable images state
  const [editImages, setEditImages] = useState<string[]>([]);
  // Editable stocks state
  const [editStocks, setEditStocks] = useState<number>(0);

  // State for options (fetched once)
  const [taxationOptions, setTaxationOptions] = useState<TaxationOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  // *** IMPORTANT: Define modal visibility state ***
  const [showModal, setShowModal] = useState<{
    info: boolean;
    price: boolean;
    images: boolean;
    stocks: boolean;
  }>({
    info: false,
    price: false,
    images: false,
    stocks: false
  });

  // Memoized API configuration and clients
  const config = useMemo(
    () =>
      new Configuration({ basePath: process.env.NEXT_PUBLIC_API_BASE_URL }),
    []
  );
  const itemsApi = useMemo(() => new ItemsApi(config), [config]);
  const taxationApi = useMemo(() => new TaxationApi(config), [config]);
  const categoriesApi = useMemo(() => new CategoriesApi(config), [config]);

  // Fetch item details once when id is available
  useEffect(() => {
    if (!token || !id || typeof id !== 'string') return;
    const fetchItem = async () => {
      try {
        const response = await itemsApi.apiItemsIdGet(Number(id));
        const data = response.data;
        setItem(data);
        // Initialize editable fields
        setEditName(data.name);
        setEditDescription(data.description || '');
        setEditTaxationId(data.taxationId ?? '');
        setEditStocks(data.stocks ?? 0);
        if (data.itemCategories) {
          setSelectedCategoryIds(data.itemCategories.map((cat: Category) => cat.id));
        }
        if (data.itemImages && data.itemImages.length > 0) {
          setEditImages(data.itemImages.map((img) => img.base64Data));
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        setErrorMsg('Failed to fetch item details.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [token, id, itemsApi]);

  // Fetch taxation options once.
  useEffect(() => {
    if (!token) return;
    const fetchTaxationOptions = async () => {
      try {
        const response = await taxationApi.apiTaxationGet();
        setTaxationOptions(response.data || []);
      } catch (error) {
        console.error('Taxation options fetch error:', error);
      }
    };
    fetchTaxationOptions();
  }, [token, taxationApi]);

  // Fetch category options once.
  useEffect(() => {
    if (!token) return;
    const fetchCategoryOptions = async () => {
      try {
        const response = await categoriesApi.apiCategoriesGet();
        setCategoryOptions(response.data || []);
      } catch (error) {
        console.error('Category options fetch error:', error);
      }
    };
    fetchCategoryOptions();
  }, [token, categoriesApi]);

  // Dropzone handler for images in the images modal
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject('Conversion error');
          }
        };
        reader.onerror = (err) => reject(err);
      });
    try {
      const base64Files = await Promise.all(
        acceptedFiles.map((file) => toBase64(file))
      );
      setEditImages((prevImages) => [...prevImages, ...base64Files]);
    } catch (error) {
      console.error('Error converting images:', error);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers for saving modal changes
  const handleInfoSave = (e: FormEvent) => {
    e.preventDefault();
    console.log('Saving base info update:', { editName, editDescription, editTaxationId, selectedCategoryIds });
    if (item) {
      setItem({
        ...item,
        name: editName,
        description: editDescription,
        taxationId: editTaxationId === '' ? null : Number(editTaxationId),
        itemCategories: categoryOptions.filter((cat) => selectedCategoryIds.includes(cat.id))
      });
    }
    setShowModal((prev) => ({ ...prev, info: false }));
  };

  const handlePriceSave = (e: FormEvent) => {
    e.preventDefault();
    console.log('Saving price items update');
    // Update item.priceItems as needed
    setShowModal((prev) => ({ ...prev, price: false }));
  };

  const handleImagesSave = (e: FormEvent) => {
    e.preventDefault();
    console.log('Saving images update', editImages);
    if (item) {
      setItem({
        ...item,
        itemImages: editImages.map((base64, index) => ({
          base64Data: base64,
          isThumbnail: index === 0,
          displayOrder: index + 1
        }))
      });
    }
    setShowModal((prev) => ({ ...prev, images: false }));
  };

  const handleStocksSave = (e: FormEvent) => {
    e.preventDefault();
    console.log('Saving stocks update', editStocks);
    if (item) {
      setItem({ ...item, stocks: editStocks });
    }
    setShowModal((prev) => ({ ...prev, stocks: false }));
  };

  const toggleCategorySelection = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  if (!token) return null;

  return (
    <DashboardLayout>
      <div className="max-h-screen overflow-auto p-0">
        <header className="mb-2 flex flex-col sm:flex-row justify-between items-center">
          <button
            onClick={() => router.push('/dashboard/stock/stock')}
            className="mt-0 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Back to Items
          </button>
        </header>

        {loading ? (
          <p>Loading item details...</p>
        ) : errorMsg ? (
          <p className="text-red-500">{errorMsg}</p>
        ) : item ? (
          <div className="bg-white p-6 rounded shadow">
            {/* Base Item Info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Item Info</h3>
              <p><strong>ID:</strong> {item.id}</p>
              <p>
                <strong>Name:</strong> {item.name}{' '}
                <button
                  onClick={() =>
                    setShowModal((prev) => ({ ...prev, info: true }))
                  }
                  className="text-blue-500 underline ml-2"
                >
                  Edit
                </button>
              </p>
              <p>
                <strong>Description:</strong> {item.description}{' '}
                <button
                  onClick={() =>
                    setShowModal((prev) => ({ ...prev, info: true }))
                  }
                  className="text-blue-500 underline ml-2"
                >
                  Edit
                </button>
              </p>
              <p>
                <strong>Taxation:</strong>{' '}
                {item.taxation
                  ? `${item.taxation.name} (${item.taxation.rate}%)`
                  : 'None'}{' '}
                <button
                  onClick={() =>
                    setShowModal((prev) => ({ ...prev, info: true }))
                  }
                  className="text-blue-500 underline ml-2"
                >
                  Edit
                </button>
              </p>
              <p>
                <strong>Categories:</strong>{' '}
                {item.itemCategories && item.itemCategories.length > 0
                  ? item.itemCategories.map((cat: Category) => cat.name).join(', ')
                  : 'None'}{' '}
                <button
                  onClick={() =>
                    setShowModal((prev) => ({ ...prev, info: true }))
                  }
                  className="text-blue-500 underline ml-2"
                >
                  Edit
                </button>
              </p>
            </div>

            {/* Tabs for additional item info */}
            <div>
              <nav className="flex space-x-4 border-b mb-4">
                <button
                  className={`py-2 px-4 ${activeTab === 'info' ? 'border-b-2 font-bold border-blue-500' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  Info
                </button>
                <button
                  className={`py-2 px-4 ${activeTab === 'price' ? 'border-b-2 font-bold border-blue-500' : ''}`}
                  onClick={() => setActiveTab('price')}
                >
                  Price Items
                </button>
                <button
                  className={`py-2 px-4 ${activeTab === 'images' ? 'border-b-2 font-bold border-blue-500' : ''}`}
                  onClick={() => setActiveTab('images')}
                >
                  Images
                </button>
                <button
                  className={`py-2 px-4 ${activeTab === 'stocks' ? 'border-b-2 font-bold border-blue-500' : ''}`}
                  onClick={() => setActiveTab('stocks')}
                >
                  Stocks
                </button>
              </nav>

              <div>
                {activeTab === 'info' && (
                  <div>
                    <p>This tab shows the default item information.</p>
                  </div>
                )}
                {activeTab === 'price' && (
                  <div>
                    <h4 className="text-lg font-semibold">Price Items</h4>
                    {item.priceItems && item.priceItems.length > 0 ? (
                      <ul>
                        {item.priceItems.map((pi, i) => (
                          <li key={i}>
                            Price: {pi.price} – {pi.isSale ? 'On Sale' : 'Regular'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No price items available.</p>
                    )}
                    <button
                      onClick={() =>
                        setShowModal((prev) => ({ ...prev, price: true }))
                      }
                      className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Edit Price Items
                    </button>
                  </div>
                )}
                {activeTab === 'images' && (
                  <div>
                    <h4 className="text-lg font-semibold">Images</h4>
                    {item.itemImages && item.itemImages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {item.itemImages.map((img, index) => (
                          <img
                            key={index}
                            src={img.base64Data}
                            alt={`Image ${index + 1}`}
                            className="h-20 w-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    ) : (
                      <p>No images available.</p>
                    )}
                    <button
                      onClick={() =>
                        setShowModal((prev) => ({ ...prev, images: true }))
                      }
                      className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Edit Images
                    </button>
                  </div>
                )}
                {activeTab === 'stocks' && (
                  <div>
                    <h4 className="text-lg font-semibold">Stocks</h4>
                    <p>{item.stocks ?? 'No stock info available.'}</p>
                    <button
                      onClick={() =>
                        setShowModal((prev) => ({ ...prev, stocks: true }))
                      }
                      className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Edit Stocks
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p>Item not found.</p>
        )}

        {/* ---------- Modals ---------- */}

        {/* Modal for editing base info (name, description, taxation and categories) */}
        {showModal.info && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-96">
              <h3 className="text-xl font-bold mb-4">Edit Item Information</h3>
              <form onSubmit={handleInfoSave} className="space-y-4">
                <div>
                  <label className="block mb-1">Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Description:</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full border rounded p-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block mb-1">Taxation:</label>
                  <select
                    value={editTaxationId}
                    onChange={(e) =>
                      setEditTaxationId(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full border rounded p-2"
                  >
                    <option value="">Select taxation</option>
                    {taxationOptions.map((tax) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({tax.rate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Categories:</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-1 border rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(cat.id)}
                          onChange={() => toggleCategorySelection(cat.id)}
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal((prev) => ({ ...prev, info: false }))}
                    className="bg-gray-300 text-black px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for editing Price Items */}
        {showModal.price && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-96">
              <h3 className="text-xl font-bold mb-4">Edit Price Items</h3>
              <form onSubmit={handlePriceSave}>
                {/* Replace with your price items editing controls */}
                <p>Price items edit form (to be implemented).</p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal((prev) => ({ ...prev, price: false }))}
                    className="bg-gray-300 text-black px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for editing Images */}
        {showModal.images && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Edit Images</h3>
              <div className="mb-4">
                <div
                  {...getRootProps()}
                  className="border-dashed border-2 p-4 text-center cursor-pointer rounded"
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Drop images here...</p>
                  ) : (
                    <p>Drag & drop images here, or click to select files</p>
                  )}
                </div>
              </div>
              {editImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {editImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt={`Image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditImage(index)}
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal((prev) => ({ ...prev, images: false }))}
                  className="bg-gray-300 text-black px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImagesSave}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for editing Stocks */}
        {showModal.stocks && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-96">
              <h3 className="text-xl font-bold mb-4">Edit Stocks</h3>
              <form onSubmit={handleStocksSave}>
                <div className="mb-4">
                  <label className="block mb-1">Stocks:</label>
                  <input
                    type="number"
                    value={editStocks}
                    onChange={(e) => setEditStocks(Number(e.target.value))}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal((prev) => ({ ...prev, stocks: false }))}
                    className="bg-gray-300 text-black px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
