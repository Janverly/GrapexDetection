import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ScanType } from '@/shared/types';
import { Calendar, MapPin, AlertTriangle } from 'lucide-react';

interface DiseaseCluster {
  lat: number;
  lng: number;
  count: number;
  diseaseType: string;
  severity: 'low' | 'medium' | 'high';
  city?: string;
  scans: ScanType[];
}

interface DiseaseMapProps {
  scans: ScanType[];
  selectedSeverity: string;
  selectedStatus: string;
}

// Custom hook to fit map bounds to markers
function MapBounds({ clusters }: { clusters: DiseaseCluster[] }) {
  const map = useMap();

  useEffect(() => {
    if (clusters.length > 0) {
      const bounds = new LatLngBounds(
        clusters.map(cluster => [cluster.lat, cluster.lng])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [clusters, map]);

  return null;
}

export default function DiseaseMap({ scans, selectedSeverity, selectedStatus }: DiseaseMapProps) {
  const [clusters, setClusters] = useState<DiseaseCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processScans = async () => {
      setLoading(true);
      
      // Only include valid diseases from our model
      const validDiseases = ['Healthy', 'Black Rot', 'Black Measle'];
      
      // Filter scans based on location and valid diseases
      const validScans = scans.filter(scan => 
        scan.location_lat && 
        scan.location_lng &&
        scan.disease_detected &&
        validDiseases.includes(scan.disease_detected) &&
        scan.disease_detected !== 'Healthy'
      );

      // Group scans by approximate location (within 0.01 degrees)
      const locationGroups: { [key: string]: ScanType[] } = {};
      
      for (const scan of validScans) {
        const lat = Math.round(scan.location_lat! * 100) / 100;
        const lng = Math.round(scan.location_lng! * 100) / 100;
        const key = `${lat},${lng}`;
        
        if (!locationGroups[key]) {
          locationGroups[key] = [];
        }
        locationGroups[key].push(scan);
      }

      // Create clusters with city information
      const newClusters: DiseaseCluster[] = [];
      
      for (const [key, groupScans] of Object.entries(locationGroups)) {
        const [lat, lng] = key.split(',').map(Number);
        
        // Get city name for the cluster
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

        // Determine severity based on disease types and count
        const diseaseTypes = groupScans.map(s => s.disease_detected).filter(Boolean);
        const hasBlackRot = diseaseTypes.includes('Black Rot');
        const hasBlackMeasle = diseaseTypes.includes('Black Measle');
        const count = groupScans.length;

        let severity: 'low' | 'medium' | 'high' = 'low';
        if (hasBlackRot || count > 5) {
          severity = 'high';
        } else if (hasBlackMeasle || count > 2) {
          severity = 'medium';
        }

        const primaryDisease = hasBlackRot ? 'Black Rot' : 
                              hasBlackMeasle ? 'Black Measle' : 
                              diseaseTypes[0] || 'Unknown';

        newClusters.push({
          lat,
          lng,
          count,
          diseaseType: primaryDisease,
          severity,
          city,
          scans: groupScans
        });
      }

      setClusters(newClusters);
      setLoading(false);
    };

    processScans();
  }, [scans]);

  // Filter clusters based on selected filters
  const filteredClusters = clusters.filter(cluster => {
    if (selectedSeverity !== 'all' && cluster.severity !== selectedSeverity) {
      return false;
    }
    
    // For now, we'll consider all clusters as "active" status
    // You can extend this logic based on your status definitions
    if (selectedStatus !== 'all') {
      return true; // Keep all for now, extend logic as needed
    }
    
    return true;
  });

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444'; // red
      case 'medium': return '#f59e0b'; // orange
      case 'low': return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  const getMarkerSize = (count: number) => {
    if (count > 10) return 20;
    if (count > 5) return 15;
    if (count > 2) return 12;
    return 8;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Default center on Philippines (adjust based on your region)
  const defaultCenter: [number, number] = [14.5995, 120.9842];

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds clusters={filteredClusters} />
        
        {filteredClusters.map((cluster, index) => (
          <CircleMarker
            key={index}
            center={[cluster.lat, cluster.lng]}
            pathOptions={{
              color: getMarkerColor(cluster.severity),
              fillColor: getMarkerColor(cluster.severity),
              fillOpacity: 0.8,
              weight: 2
            }}
            radius={getMarkerSize(cluster.count)}
          >
            <Popup>
              <div className="p-2 min-w-48">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{cluster.city}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    cluster.severity === 'high' ? 'bg-red-100 text-red-700' :
                    cluster.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {cluster.severity.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{cluster.count} disease reports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Primary: {cluster.diseaseType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Latest: {formatDate(cluster.scans[0]?.created_at || '')}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Click for detailed scan information
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
