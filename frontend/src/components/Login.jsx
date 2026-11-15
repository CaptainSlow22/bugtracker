import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "./AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { token, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) navigate("/projects", { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest("/members/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      if (!data?.token) throw new Error("The API did not return an access token.");
      setToken(data.token);
      navigate(location.state?.from?.pathname || "/projects", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-gray-100 flex flex-col gap-8 min-h-screen justify-center items-center p-6">
      <h1 className="text-4xl font-black text-center">Log into your member account</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-lg p-10 rounded-xl flex flex-col gap-6 w-full max-w-sm">
        <label className="flex flex-col gap-2">Email
          <input autoComplete="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 bg-gray-100 rounded-xl" />
        </label>
        <label className="flex flex-col gap-2">Password
          <input autoComplete="current-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-2 bg-gray-100 rounded-xl" />
        </label>
        <button disabled={submitting} className="px-4 py-2 bg-blue-700 text-white font-bold rounded-full">{submitting ? "Signing in…" : "Log In"}</button>
        {error && <p role="alert" className="bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      </form>
      <span>Don't have an account? <NavLink to="/register" className="font-bold">Register here</NavLink></span>
      {location.state?.message && <p role="status" className="text-green-800">{location.state.message}</p>}
      <p className="text-sm text-gray-600">For security, signing in again is required after a page refresh.</p>
    </main>
  );
}
