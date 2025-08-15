"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ServerCrash,
  Shield
} from "lucide-react";

export default function ErrorPage({ error }: { error: Error & { digest?: string } }): React.JSX.Element {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  const handleGoBack = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header with Logo Area */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-yellow-500 rounded-lg p-3">
              <Shield className="h-8 w-8 text-black font-bold" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-yellow-500">ANTAM SIMBAPRO</h1>
              <p className="text-sm text-gray-400">Sistem Informasi Maintenance & Engineering Bureau</p>
            </div>
          </div>
        </div>

        {/* Main Error Card */}
        <Card className="border border-yellow-500/20 shadow-2xl bg-black/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-yellow-500 rounded-full p-6">
                  <ServerCrash className="h-16 w-16 text-black" />
                </div>
              </div>
            </div>
            <CardTitle className="text-4xl font-bold text-yellow-500 mb-2">
              Oops!
            </CardTitle>
            <p className="text-xl text-gray-300 font-medium">
              Terjadi Kesalahan Sistem
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <div className="text-center space-y-4">
              <p className="text-gray-400">
                Terjadi kesalahan sistem. Silakan coba lagi.
              </p>
              
              <div className="bg-gray-900/50 rounded-lg p-4">
                <code className="text-xs text-yellow-300 break-all">
                  {error.message || "Internal Server Error"}
                </code>
              </div>
            </div>

            {/* Single Back Button */}
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleGoBack}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2025 ANTAM - PT Aneka Tambang (Persero) Tbk</p>
          <p className="mt-1">Maintenance & Engineering Bureau System</p>
          <p className="mt-2 text-gray-600">
            Jika masalah berlanjut, hubungi: support@antam.com
          </p>
        </div>
      </div>
    </div>
  );
}
