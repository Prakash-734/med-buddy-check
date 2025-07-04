import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Clock, Users } from "lucide-react";

const GetStarted = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Never Miss a Dose",
      description: "Smart reminders to keep you on track with your medication schedule",
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Secure & Private",
      description: "Your health data is encrypted and stored securely",
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-500" />,
      title: "Track Progress",
      description: "Monitor your adherence and build healthy habits",
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Caretaker Support",
      description: "Share progress with trusted caretakers",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            MediCare Companion
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted partner in medication management. Take control of your health with smart tracking and reminders.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hero CTA */}
        <div className="text-center">
          <div className="max-w-3xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Ready to transform your medication routine?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join users who trust MediCare Companion to stay consistent with their health goals.
            </p>
          </div>

          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Get Started Now
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Free to use • Secure & private
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
