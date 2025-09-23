// src/app/layout.jsx
import './globals.css';
import DatabaseInitializer from '@/components/DatabaseInitializer';
import { Toaster } from 'react-hot-toast'; // 1. Import Toaster

export const metadata = {
  title: 'MLM App',
  description: 'Multi-Level Management Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-center" reverseOrder={false} /> {/* 2. Add the Toaster component here */}
        <DatabaseInitializer />
        {children}
      </body>
    </html>
  );
}