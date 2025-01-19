import { useRouter } from 'next/router';
import { useState, useEffect, FormEvent, useContext } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
import { CategoriesApi, Configuration } from '@/api';

interface Category {
  id: number;
  name: string;
  // Add additional fields such as "description" if your API provides them
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const { id } = router.query; // Dynamic route parameter (e.g., id = "1")
  const { token } = useContext(AuthContext);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [newName, setNewName] = useState('');

  // Configure the API client using the base URL from your .env.local.
  // (Make sure your NEXT_PUBLIC_API_BASE_URL does NOT include an extra `/api` if your endpoints start with `/api`.)
  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
  const categoriesApi = new CategoriesApi(config);

  useEffect(() => {
    if (!token || !id) return;

    // If your generated client provides an endpoint to get a category by its ID:
    if (typeof id === 'string') {
      categoriesApi
        .apiCategoriesCategoryDetailIdGet(Number(id))
        .then((response) => {
          setCategory(response.data);
          setNewName(response.data.name);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setErrorMsg('Failed to fetch category details.');
          setLoading(false);
        });
    }
  }, [token, id, categoriesApi]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !newName) return;
    try {
      // If your API has an endpoint for updating a category (e.g., apiCategoriesPut),
      // you would call it here. For now, we’ll simply log the new value.
      console.log('Updating category id:', id, 'with new name:', newName);
      alert('Category updated (this is a demo – implement the update endpoint in your API client).');
      // Optionally, refresh the data or navigate back:
      // router.push('/dashboard/categories');
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to update category.');
    }
  };

  if (!token) {
    return null;
  }

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Category Detail</h2>
      </header>
      {loading ? (
        <p>Loading category details...</p>
      ) : errorMsg ? (
        <p className="text-red-500">{errorMsg}</p>
      ) : category ? (
        <div className="bg-white p-6 rounded shadow max-w-xl">
          <p className="text-lg mb-4">Category ID: {category.id}</p>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block mb-1">Category Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
            {/* Additional fields for editing can be added here */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/categories/categories')}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Back to Categories
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p>Category not found.</p>
      )}
    </DashboardLayout>
  );
}
