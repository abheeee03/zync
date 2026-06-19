"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Logo from "@/components/logo";
import { sileo } from "sileo";
import { motion } from "framer-motion";
import Image from "next/image";
import ThemeSwitcher from "@/components/theme-switcher";
import { GithubIcon, GoogleIcon } from "@/components/icons";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      sileo.error({
        title: "Authentication Failed",
        description: "Could not connect to Google. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/home",
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      sileo.error({
        title: "Authentication Failed",
        description: "Could not connect to GitHub. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center px-7 py-7">
      <div className="absolute top-5 right-5">
        <ThemeSwitcher />
      </div>
      <div className="hidden md:block h-full w-1/2 px-4 py-4">
        <div className="relative h-full w-full rounded-xl overflow-hidden">
          <div className="absolute z-40 text-white text-4xl px-8 py-8">
            <Image
              height={100}
              width={100}
              src={'/zync-logo.png'}
              alt="zync"
              className="pointer-events-none"
            />
            <h1>
              your workflows. <br /> on autopilot.
            </h1>
          </div>
          <Image
            className="h-full w-full pointer-events-none"
            src={'/grad.jpg'}
            width={1000}
            height={1000}
            alt="gradient"
          />
        </div>
      </div>
      <div className="h-full w-full md:w-1/2 py-8 px-4 md:px-8 flex flex-col items-center md:items-start justify-center md:justify-start">
        {/* Responsive Logo shown only on mobile */}
        <div className="block md:hidden mb-6">
          <Image
            height={80}
            width={80}
            src={'/zync-logo.png'}
            alt="zync"
            className="pointer-events-none"
          />
        </div>
        <h1 className="text-3xl">Get Started</h1>
        <p className="text-xl mt-2 text-zinc-600 dark:text-zinc-400 text-center md:text-left">signin to continue your automation journey.</p>
        <div className="border border-border/60 shadow-lg dark:shadow-sm rounded-xl mt-10 h-full w-full flex flex-col gap-4 items-center justify-center p-6 md:p-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="border w-full max-w-[320px] py-2.5 text-lg rounded-xl border-t shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors duration-200">
            Sign in using Google <GoogleIcon />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            onClick={handleGithubSignIn}
            className="border w-full max-w-[320px] py-2.5 rounded-xl text-lg border-t shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors duration-200">
            Sign in using GitHub <GithubIcon />
          </motion.button>
        </div>
      </div>
    </div>
  );
}