import { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
// Import the API client from your generated API (using the OO interface)
import { AuthApi, Configuration } from '@/api';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Configure the API client using the base URL from your environment variables
  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
  const authApi = new AuthApi(config);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // The API client expects an AuthRequestDto
      const response = await authApi.apiAuthLoginPost({ username, password });
      // Assume the response contains a token (adjust according to your API)
      const token = response.data.token;
      login(token);
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Invalid login credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl mb-6 text-center">Login</h2>
        {errorMsg && <p className="mb-4 text-red-500 text-center">{errorMsg}</p>}
        <div className="mb-4">
          <label className="block mb-1">Username</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={username}
            placeholder="Enter your username"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded p-2"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
          Login
        </button>
      </form>
    </div>
  );
}
