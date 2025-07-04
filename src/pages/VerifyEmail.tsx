// src/pages/VerifyEmail.tsx
import { CheckCircle } from "lucide-react";

const VerifyEmail = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h1>
        <p className="text-gray-600">Your email has been successfully confirmed. You can now log in.</p>
      </div>
    </div>
  );
};

export default VerifyEmail;
