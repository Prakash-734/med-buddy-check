import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert("Password reset failed");
    } else {
      alert("Password updated successfully");
      navigate("/auth"); // redirect to login
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-4">
      <h1 className="text-xl font-bold">Reset Your Password</h1>
      <input
        type="password"
        placeholder="New Password"
        className="border p-2 w-full"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button
        onClick={handleReset}
        disabled={loading || !newPassword}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
};

export default ResetPassword;
