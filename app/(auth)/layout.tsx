import { GalleryVerticalEnd } from "lucide-react";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            ReClos.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:flex flex-col justify-end items-center">
        <div className="w-full py-6">
          <h1 className="text-7xl font-bold text-center">AI-Powered</h1>
          <h1 className="text-7xl font-bold text-center">Photo Sharing</h1>
          <h3 className="text-center tex5-2xl textgraye50">Fast, Private, and client-ready</h3>
        </div>
        <img
          src="/images/image-2.png"
          alt="Image"
          className="w-[450px] object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
