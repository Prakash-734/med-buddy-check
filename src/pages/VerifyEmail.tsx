// src/pages/VerifyEmail.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const VerifyEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/auth"); // redirect to login manually
      }, 2000);
    };

    handleRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h1>
        <p className="text-gray-600">Redirecting to sign in page...</p>
      </div>
    </div>
  );
};

export default VerifyEmail;
