import { useState, useEffect, useContext, FormEvent } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
import { CategoriesApi, Configuration } from '@/api';

interface Category {
  id: number;
  name: string;
}

export default function CategoriesPage() {
  const { token } = useContext(AuthContext);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('');

  // State for modal visibility and new category name.
  const [showModal, setShowModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const config = new Configuration({ basePath: process.env.NEXT_PUBLIC_API_BASE_URL });
  const categoriesApi = new CategoriesApi(config);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    categoriesApi
      .apiCategoriesGet()
      .then((response) => {
        setCategories(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Failed to fetch categories.');
        setLoading(false);
      });
  }, [token, router, categoriesApi]);

  const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const newCategory = { name: newCategoryName };
      const response = await categoriesApi.apiCategoriesPost(newCategory);
      setCategories((prev) => [...prev, response.data]);
      setNewCategoryName('');
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to add new category.');
    }
  };

  // Filter categories by name (case-insensitive)
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h2 className="text-3xl font-bold mb-4 sm:mb-0">Manage Categories</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            placeholder="Filter categories..."
            className="border rounded p-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Add Category
          </button>
        </div>
      </header>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto border rounded bg-white shadow">
        {loading ? (
          <p className="p-4">Loading categories...</p>
        ) : errorMsg ? (
          <p className="p-4 text-red-500">{errorMsg}</p>
        ) : filteredCategories.length === 0 ? (
          <p className="p-4">No categories available.</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Category Name</th>
                <th className="px-4 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{category.name}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => router.push(`/dashboard/categories/${category.id}`)}
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

      {/* Modal for Adding New Category */}
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full border rounded p-2"
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
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
