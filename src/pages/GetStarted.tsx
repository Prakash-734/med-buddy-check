import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Clock,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const GetStarted = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Never Miss a Dose",
      description:
        "Smart reminders to keep you on track with your medication schedule",
      color: "from-red-100 to-pink-100",
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Secure & Private",
      description: "Your health data is encrypted and stored securely",
      color: "from-green-100 to-emerald-100",
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-500" />,
      title: "Track Progress",
      description: "Monitor your adherence and build healthy habits",
      color: "from-blue-100 to-cyan-100",
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Caretaker Support",
      description: "Share progress with trusted caretakers",
      color: "from-purple-100 to-violet-100",
    },
  ];

  const benefits = [
    "Personalized medication schedules",
    "Real-time progress tracking",
    "Family caretaker dashboard",
    "Secure data encryption",
    "Smart reminder system",
    "Health insights & analytics",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-green-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-slate-100/[0.03] bg-[size:20px_20px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-30 animate-pulse" />

      <div className="container mx-auto px-4 py-8 relative">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                <span className="text-3xl font-extrabold text-white neon-text">
                  M
                </span>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-green-600 bg-clip-text text-transparent leading-tight">
              MediCare
              <span className="block italic tracking-wide font-bold text-emerald-500 drop-shadow-lg">
                Companion
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Transform your medication routine with intelligent tracking,
              <span className="font-semibold text-blue-600">
                {" "}
                smart reminders
              </span>
              , and
              <span className="font-semibold text-green-600">
                {" "}
                caretaker support
              </span>
            </p>

            <div className="flex justify-center pt-6">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-6 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group text-lg"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/70 backdrop-blur-md group overflow-hidden hover:-translate-y-2"
              >
                <CardContent className="p-6 text-center relative z-10">
                  <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700">
                    {feature.description}
                  </p>
                </CardContent>
                <div
                  className={`absolute inset-0 z-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600/5 to-green-600/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                  Why choose{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    MediCare?
                  </span>
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Join thousands of users who have transformed their medication
                  adherence with our comprehensive platform.
                </p>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 group text-slate-700"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                      <span className="font-medium group-hover:text-green-600 transition-colors">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-8 shadow-xl border border-white/20">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                        Start Today
                      </div>
                      <div className="text-slate-600">
                        Free forever • No credit card required
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to take control of your health?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the MediCare community and never miss a dose again
          </p>

          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-6 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 text-lg group"
          >
            Get Started Free
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="flex items-center justify-center gap-6 mt-8 text-blue-200 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure & private
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Family friendly
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
