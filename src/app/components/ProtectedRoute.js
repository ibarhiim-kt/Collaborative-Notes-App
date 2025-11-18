"use client";
import { useEffect, useState,Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/app/supabase/supabaseClient";

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      <span className="ml-4 text-lg">Logging</span>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!router) return;
    async function checkUser() {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        router.replace("/auth/login"); 
      } else {
        setLoading(false); 
      }
    }

    checkUser();
  }, [router]);

  if (loading) return <Suspense fallback={<Loading />}>
        <Loading />
      </Suspense>

  return <>{children}</>;
}
