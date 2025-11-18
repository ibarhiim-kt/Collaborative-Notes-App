"use client";

import { useState } from "react";
import { supabaseClient } from "@/app/supabase/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) setError(error.message);
    else router.push("/"); // Change to your protected page
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "google" });
    if (error) console.log(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-orange-200 px-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl space-y-5">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Sign In</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}

        <form className="space-y-4" onSubmit={handleEmailSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center justify-center space-x-2 text-gray-400 mt-3">OR</div>

        <button
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center w-full py-3 mt-2 space-x-2 bg-white-500 border-1 text-black font-semibold rounded-lg hover:bg-red-400 transition"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Sign in with Google</span>
        </button>

        <p className="text-center text-gray-500 mt-4">
          Don't have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => router.push("/auth/signup")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
