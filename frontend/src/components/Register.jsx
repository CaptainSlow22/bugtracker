import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function Register() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await apiRequest("/members/register", { method: "POST", auth: false, body: form });
      setSuccess("Account created. You can now sign in.");
      navigate("/login", { replace: true, state: { message: "Account created. Please sign in." } });
    } catch (requestError) {
      setError(requestError.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-gray-100 flex flex-col gap-8 min-h-screen justify-center items-center p-6">
      <h1 className="text-4xl font-black text-center">Sign up for a member account</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-lg p-10 rounded-xl flex flex-col gap-5 w-full max-w-md">
        <label className="flex flex-col gap-2">First name
          <input autoComplete="given-name" required maxLength={80} value={form.firstName} onChange={update("firstName")} className="p-2 bg-gray-100 rounded-xl" />
        </label>
        <label className="flex flex-col gap-2">Last name
          <input autoComplete="family-name" required maxLength={80} value={form.lastName} onChange={update("lastName")} className="p-2 bg-gray-100 rounded-xl" />
        </label>
        <label className="flex flex-col gap-2">Email
          <input autoComplete="email" required maxLength={254} type="email" value={form.email} onChange={update("email")} className="p-2 bg-gray-100 rounded-xl" />
        </label>
        <label className="flex flex-col gap-2">Password
          <input autoComplete="new-password" required minLength={12} maxLength={72} type="password" value={form.password} onChange={update("password")} className="p-2 bg-gray-100 rounded-xl" />
          <span className="text-sm text-gray-600">Use at least 12 characters.</span>
        </label>
        <button disabled={submitting} className="px-4 py-2 bg-blue-700 text-white font-bold rounded-full">{submitting ? "Creating account…" : "Sign Up"}</button>
        {error && <p role="alert" className="bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
        {success && <p role="status" className="bg-green-100 text-green-800 p-3 rounded-lg">{success}</p>}
      </form>
      <span>Already have an account? <NavLink to="/login" className="font-bold">Log in</NavLink></span>
    </main>
  );
}
