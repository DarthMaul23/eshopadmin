import { useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  // Optional theme properties:
  sidebarBg?: string;          // Background color for sidebar
  sidebarTextColor?: string;   // Text color for sidebar
  sidebarActiveBg?: string;    // Background color for active sidebar item
  topbarBg?: string;           // Background color for topbar
  topbarTextColor?: string;    // Text color for topbar title
}

export default function DashboardLayout({
  children,
  sidebarBg = 'bg-gray-800',
  sidebarTextColor = 'text-gray-100',
  sidebarActiveBg = 'bg-red-600',
  topbarBg = 'bg-white',
  topbarTextColor = 'text-gray-800'
}: DashboardLayoutProps) {
  const { logout } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleToggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
  };

  // List of sidebar menu items
  const menuItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Manage Stock', href: '/dashboard/stock/stock' },
    { label: 'Categories', href: '/dashboard/categories/categories' },
    { label: 'Taxation', href: '/dashboard/taxation/taxation' },
    { label: 'Shipping', href: '/dashboard/shipping/shipping' },
    { label: 'Statistics', href: '/dashboard/statistics' }
  ];

  // List of topbar label items
  const labelItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Stock', href: '/dashboard/stock/stock' },
    { label: 'Item Details', href: '/dashboard/stock/[id]' },
    { label: 'Categories', href: '/dashboard/categories/categories' },
    { label: 'Category Detail', href: '/dashboard/categories/categories/[id]' },
    { label: 'Taxation', href: '/dashboard/taxation/taxation' },
    { label: 'Shipping', href: '/dashboard/shipping/shipping' },
    { label: 'Statistics', href: '/dashboard/statistics' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`w-64 ${sidebarBg} ${sidebarTextColor} flex-shrink-0`}>
        <div className="p-6 text-2xl font-bold border-b border-gray-700">
          eShop Admin
        </div>
        <nav className="mt-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2.5 px-4 transition ${
                  isActive
                    ? sidebarActiveBg
                    : 'hover:' + sidebarActiveBg
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className={`flex justify-between items-center ${topbarBg} border-b border-gray-200 p-4`}>
          <h1 className={`text-xl font-bold ${topbarTextColor}`}>
          {labelItems.map((item) => {
            console.log(item.href);
            console.log(router.pathname);
            if (router.pathname === item.href){
                return (item.label);
            }
          })}
          </h1>
          <div className="relative">
            <button
              onClick={handleToggleUserMenu}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <img
                src="/vercel.svg"  // Replace with user's avatar if available
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
              />
              <span className="hidden sm:inline">John Doe</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
