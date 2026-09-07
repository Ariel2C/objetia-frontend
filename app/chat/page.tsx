"use client";
import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ChatRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room_id');

  useEffect(() => {
    if (roomId) {
      router.replace(`/mi-objetia?tab=chat&room_id=${encodeURIComponent(roomId)}`);
    } else {
      router.replace('/mi-objetia?tab=chat');
    }
  }, [roomId, router]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
        <p className="text-sm font-medium text-[#5f6368]">Redirigiendo a tus mensajes...</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
        </div>
      }
    >
      <ChatRedirectContent />
    </Suspense>
  );
}
