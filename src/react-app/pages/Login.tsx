import { useAuth } from "@/react-app/utils/auth";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { Leaf, ArrowRight, Camera, Shield, History } from "lucide-react";

export default function Login() {
  const { user, redirectToLogin, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin">
          <Leaf className="w-12 h-12 text-purple-300" />
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-purple-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-400/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 px-6 py-12 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl mb-8 shadow-2xl p-3">
            <img 
              src="/assets/grapex-logo.svg" 
              alt="GrapeX Logo" 
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            GrapeXDetection
          </h1>
          <p className="text-xl text-green-200 leading-relaxed">
            AI-powered grape leaf disease detection and treatment recommendations
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-400/20 rounded-xl backdrop-blur-sm">
                <Camera className="w-6 h-6 text-green-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Instant Detection</h3>
                <p className="text-green-200 text-sm">Scan grape leaves with your camera for immediate disease identification</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Expert Recommendations</h3>
                <p className="text-green-200 text-sm">Get tailored treatment and prevention strategies</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-400/20 rounded-xl backdrop-blur-sm">
                <History className="w-6 h-6 text-purple-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Track Progress</h3>
                <p className="text-green-200 text-sm">Monitor your vineyard's health over time</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={redirectToLogin}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 shadow-2xl hover:shadow-green-500/25 transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm"
        >
          <span>Continue with Google</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-green-300 text-sm mt-6">
          Secure authentication • Powered by Google
        </p>

    
      </div>
    </div>
  );
}
