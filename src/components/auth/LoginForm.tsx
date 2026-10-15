"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Login, Send, SquareLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import type { LoginFormProps } from "@/types";

export default function LoginForm({ dict }: LoginFormProps) {
  const l = dict.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePasswordMode, setUsePasswordMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);

    try {
      if (usePasswordMode) {
        if (!password) {
          setError("পাসওয়ার্ড প্রদান করুন");
          setIsLoading(false);
          return;
        }
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message || "লগইন ব্যর্থ হয়েছে");
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        const { error: magicError } = await authClient.signIn.magicLink({
          email,
          callbackURL: "/dashboard",
        });
        if (magicError) {
          setError(magicError.message || "ম্যাজিক লিংক পাঠাতে ব্যর্থ হয়েছে");
        } else {
          setIsSuccess(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "একটি ত্রুটি ঘটেছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full py-[24px] md:py-[40px]">
      <div className="flex flex-col items-center gap-[48px] w-full max-w-[400px] px-[24px]">
        <div className="flex flex-col items-center gap-8 w-full">
          <SquareLogo className="size-14" plate />

          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-balance font-semibold text-3xl text-foreground">
              {l.title}
            </h1>
            <p className="text-pretty text-muted-foreground text-sm">
              {l.newHere}{" "}
              <Link className="text-foreground hover:underline" href="/">
                {l.signUpFree}
              </Link>
            </p>
          </div>

          {error && (
            <div className="w-full p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="w-full flex flex-col gap-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                আপনার ইনবক্সে লগইন লিংক পাঠানো হয়েছে! ইমেইলটি চেক করুন।
              </div>
              <Button
                className="w-full rounded-xl"
                variant="outline"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                  setError(null);
                }}
              >
                ফিরে যান
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              <Field>
                <Input
                  required
                  className="w-full rounded-xl bg-background"
                  placeholder="আপনার ইমেইল"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </Field>

              {usePasswordMode && (
                <Field>
                  <Input
                    required
                    className="w-full rounded-xl bg-background"
                    placeholder="পাসওয়ার্ড"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </Field>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full rounded-xl flex items-center justify-center gap-2"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="size-4" />
                      <span>অপেক্ষা করুন...</span>
                    </>
                  ) : (
                    <>
                      {usePasswordMode ? (
                        <Login className="size-4" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      <span>
                        {usePasswordMode ? "লগইন করুন" : l.sendMagicLink}
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  className="w-full text-muted-foreground text-sm"
                  variant="link"
                  onClick={() => {
                    setUsePasswordMode(!usePasswordMode);
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  {usePasswordMode ? "ম্যাজিক লিংক ব্যবহার করুন" : l.usePassword}
                </Button>
              </div>

              <div className="flex items-center gap-4 py-2">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-sm">{l.or}</span>
                <Separator className="flex-1" />
              </div>

              <Button
                type="button"
                className="w-full rounded-xl flex items-center justify-center gap-2.5 font-medium"
                size="lg"
                variant="outline"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await authClient.signIn.social({
                      provider: "google",
                      callbackURL: "/dashboard",
                    });
                  } catch (err: unknown) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Google লগইন ব্যর্থ হয়েছে",
                    );
                    setIsLoading(false);
                  }
                }}
              >
                {isLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <Image
                    src="/google.svg"
                    alt="Google"
                    width={18}
                    height={18}
                    className="size-4.5"
                  />
                )}
                <span>গুগল দিয়ে লগইন করুন</span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
