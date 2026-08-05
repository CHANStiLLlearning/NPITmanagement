import React from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from './Layout';

export function PlaceholderPage() {
  const location = useLocation();
  const pathName = location.pathname.replace('/', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <Layout>
      <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#0a1f44] ">
          {pathName} Module
        </h1>
        <p className="text-slate-500 ">
          This module is currently under development.
        </p>
      </div>
    </Layout>
  );
}
