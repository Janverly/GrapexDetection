import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/react-app/utils/auth";
import { useNavigate } from "react-router";
import Webcam from "react-webcam";
import { Camera, RotateCcw, Check, Loader2, AlertCircle, MapPin, Upload, ImageIcon } from "lucide-react";
import Header from "@/react-app/components/Header";
import { detectDisease, initializeTensorFlow } from "@/react-app/utils/diseaseDetection";
import { PredictionResult } from "@/shared/types";

export default function Scanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'upload' | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    initializeTensorFlow();
    
    // Check if there's an uploaded image from home page
    const uploadedImage = localStorage.getItem('uploadedImage');
    const uploadedImageSource = localStorage.getItem('imageSource');
    if (uploadedImage) {
      setCapturedImage(uploadedImage);
      setImageSource(uploadedImageSource as 'camera' | 'upload' || 'upload');
      // Clear from localStorage
      localStorage.removeItem('uploadedImage');
      localStorage.removeItem('imageSource');
    }
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Try to get city name from coordinates
          let city = 'Unknown location';
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            if (response.ok) {
              const data = await response.json();
              city = data.city || data.locality || data.principalSubdivision || 'Unknown location';
            }
          } catch (error) {
            console.log('Failed to get city name:', error);
          }
          
          setLocation({ lat, lng, city });
        },
        (error) => {
          console.log("Location access denied:", error);
        }
      );
    }
  }, [user, navigate]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setImageSource('camera');
        setError(null);
      }
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setImageSource(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
        setImageSource('upload');
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create image element for analysis
      const img = new Image();
      img.onload = async () => {
        try {
          const prediction = await detectDisease(img);
          setResult(prediction);

          // Save scan to database
          await fetch("/api/scans", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_url: capturedImage,
              disease_detected: prediction.disease,
              confidence_score: prediction.confidence,
              recommendations: prediction.recommendations,
              location_lat: location?.lat,
              location_lng: location?.lng,
            }),
          });
        } catch (error) {
          console.error("Analysis error:", error);
          setError("Failed to analyze image. Please try again.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      img.src = capturedImage;
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to process image. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (disease: string) => {
    if (disease === "Healthy") return "text-green-600 bg-green-50 border-green-200";
    if (disease === "Black Rot") return "text-red-600 bg-red-50 border-red-200";
    if (disease === "Black Measle") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (disease === "Not a Grape Leaf" || disease === "Analysis Failed") return "text-gray-600 bg-gray-50 border-gray-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Disease Scanner" />

      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
              {!capturedImage ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{
                    facingMode: { ideal: "environment" },
                    width: 400,
                    height: 400,
                  }}
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured leaf"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex gap-3">
              {!capturedImage ? (
                <>
                  <button
                    onClick={capture}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Camera</span>
                  </button>
                  <button
                    onClick={triggerFileUpload}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={retake}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    <span>{isAnalyzing ? "Analyzing..." : "Analyze"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Analysis Failed</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {imageSource === 'camera' ? <Camera className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                  <span>{imageSource === 'camera' ? 'Camera' : 'Upload'}</span>
                </div>
              </div>
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-4 ${getSeverityColor(result.disease)}`}>
                {result.disease}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Confidence Score</h4>
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        result.confidence > 0.8 ? "bg-green-500" :
                        result.confidence > 0.6 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {(result.confidence * 100).toFixed(1)}% confident
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {result.recommendations}
                  </p>
                </div>

                {location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>Location: {location.city}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate("/history")}
                className="w-full mt-6 bg-white text-green-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-green-200"
              >
                View Scan History
              </button>
            </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl p-6 border border-green-100">
            <h3 className="font-bold text-gray-900 mb-2">Tips for Best Results</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Ensure good lighting conditions</li>
              <li>• Keep the leaf centered in frame</li>
              <li>• Use high-resolution images (upload feature)</li>
              <li>• Scan individual leaves for accuracy</li>
              <li>• Avoid blurry or dark images</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
