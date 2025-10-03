import { useMemo } from 'react';
import { Activity, Clock, TrendingUp } from 'lucide-react';
import { ScanType } from '@/shared/types';

interface RiskMetricsProps {
  scans: ScanType[];
}

interface RiskMetrics {
  activeOutbreaks: number;
  pendingReview: number;
  accuracyRate: number;
}

export default function RiskMetrics({ scans }: RiskMetricsProps) {
  const metrics = useMemo((): RiskMetrics => {
    // Only include valid diseases from our model
    const validDiseases = ['Healthy', 'Black Rot', 'Black Measle'];
    const filteredScans = scans.filter(scan => 
      scan.disease_detected && validDiseases.includes(scan.disease_detected)
    );
    
    const totalScans = filteredScans.length;
    if (totalScans === 0) {
      return {
        activeOutbreaks: 0,
        pendingReview: 0,
        accuracyRate: 0,
      };
    }

    // Calculate active outbreaks (unique locations with diseases in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentDiseaseScans = filteredScans.filter(scan => 
      scan.disease_detected && 
      scan.disease_detected !== 'Healthy' &&
      new Date(scan.created_at) > weekAgo &&
      scan.location_lat && 
      scan.location_lng
    );

    const uniqueLocations = new Set(
      recentDiseaseScans.map(scan => 
        `${Math.round(scan.location_lat! * 100)},${Math.round(scan.location_lng! * 100)}`
      )
    );
    const activeOutbreaks = uniqueLocations.size;

    // Calculate pending review (recent scans with low confidence)
    const pendingReview = recentDiseaseScans.filter(scan => 
      scan.confidence_score && scan.confidence_score < 0.8
    ).length;

    // Calculate accuracy rate (high confidence detections)
    const highConfidenceScans = filteredScans.filter(scan => 
      scan.confidence_score && scan.confidence_score > 0.8
    ).length;
    const accuracyRate = Math.round((highConfidenceScans / totalScans) * 100);

    return {
      activeOutbreaks,
      pendingReview,
      accuracyRate,
    };
  }, [scans]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Active Outbreaks */}
      <div className="bg-blue-500 rounded-2xl p-4 text-white text-center">
        <Activity className="w-8 h-8 mx-auto mb-2" />
        <div className="text-2xl font-bold mb-1">{metrics.activeOutbreaks}</div>
        <div className="text-sm font-medium mb-1">Active</div>
        <div className="text-xs text-blue-100">Outbreaks</div>
      </div>

      {/* Pending Review */}
      <div className="bg-yellow-500 rounded-2xl p-4 text-white text-center">
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <div className="text-2xl font-bold mb-1">{metrics.pendingReview}</div>
        <div className="text-sm font-medium mb-1">Pending</div>
        <div className="text-xs text-yellow-100">Review</div>
      </div>

      {/* Accuracy Rate */}
      <div className="bg-green-500 rounded-2xl p-4 text-white text-center">
        <TrendingUp className="w-8 h-8 mx-auto mb-2" />
        <div className="text-2xl font-bold mb-1">{metrics.accuracyRate}%</div>
        <div className="text-sm font-medium mb-1">Accuracy</div>
        <div className="text-xs text-green-100">Rate</div>
      </div>
    </div>
  );
}
