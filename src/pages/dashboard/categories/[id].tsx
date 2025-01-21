import { useRouter } from 'next/router';
import { useState, useEffect, FormEvent, useContext, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthContext } from '@/context/AuthContext';
import { CategoriesApi, Configuration } from '@/api';

interface Category {
  id: number;
  name: string;
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useContext(AuthContext);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [newName, setNewName] = useState('');

  const config = useMemo(
    () =>
      new Configuration({
        basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: token || undefined,
      }),
    [token]
  );
  const categoriesApi = useMemo(() => new CategoriesApi(config), [config]);

  useEffect(() => {
    if (!token || !id) return;

    if (typeof id === 'string') {
      categoriesApi
        .apiCategoriesCategoryDetailIdGet(Number(id))
        .then((response) => {
          setCategory(response.data);
          setNewName(response.data.name);
        })
        .catch((error) => {
          console.error(error);
          setErrorMsg('Failed to fetch category details.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token, id, categoriesApi]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !newName) return;
    try {
      console.log('Updating category id:', id, 'with new name:', newName);
      alert('Category updated (demo – implement update endpoint).');
      // Optionally, navigate back:
      // router.push('/dashboard/categories/categories');
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to update category.');
    }
  };

  if (!token) return null;

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
            {/* Add additional fields here if necessary */}
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
