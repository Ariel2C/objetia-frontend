"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import RootTab from '../../mi-objetia/RootTab';

export default function RootDashboardPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[999999] bg-[#121214] w-screen h-screen overflow-hidden flex flex-col">
      <RootTab onVolverAMiEspacio={() => router.push('/mi-objetia?tab=billetera')} />
    </div>
  );
}
