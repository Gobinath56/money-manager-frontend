import React, { useState } from "react";
import { login, register } from "../services/authService";

function LoginPage({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onSuccess(); // tell App.js to switch to the dashboard
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">💰 Money Manager</h1>
        <p className="text-slate-400 text-sm mb-6">
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </p>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            required
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded-xl font-semibold text-white transition"
          >
            {isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-400 hover:text-emerald-300 ml-1"
          >
            {isLogin ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
