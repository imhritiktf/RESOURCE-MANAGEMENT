import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
        
      });
  
      console.log("Login Response:", data); // Debugging
      console.log("User Data:", data.user); // Inspect user data structure

      login(data); // Save user in context & localStorage
  
      const role = data.user.role;  
      if (role === "faculty") navigate("/faculty-dashboard");
      else if (role === "supervisor") navigate("/supervisor-dashboard");
      else if (role === "trustee") navigate("/trustee-dashboard");
    } catch (err) {
      console.error("Login API Error:", err.response);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-4 text-[#ef7f1a]">Login</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ef7f1a] text-white p-2 rounded hover:bg-orange-600"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
