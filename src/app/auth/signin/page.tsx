"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { APP_CONFIG } from "@/lib/constants";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        username: data.username.toLowerCase().trim(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Username atau password salah");
        return;
      }

      if (result?.ok) {
        // Get the updated session to check user info
        const session = await getSession();

        if (session?.user) {
          // Successful login, redirect to callback URL
          router.push(callbackUrl);
          router.refresh();
        } else {
          setError("Terjadi kesalahan saat masuk");
        }
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">A</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            {APP_CONFIG.NAME}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{APP_CONFIG.DESCRIPTION}</p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Masuk ke Sistem</CardTitle>
            <CardDescription className="text-center">
              Masukkan username dan password untuk mengakses sistem
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  label="Username"
                  placeholder="Masukkan username"
                  autoComplete="username"
                  error={errors.username?.message}
                  {...register("username")}
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-8 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
            </CardFooter>
          </form>
        </Card>



        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 PT ANTAM Tbk. All rights reserved.</p>
          <p className="mt-1">Version {APP_CONFIG.VERSION}</p>
        </div>
      </div>
    </div>
  );
}
