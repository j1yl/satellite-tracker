export interface SatelliteEndpointResponse {
  satellites: {
    type: string;
    features: Satellite[];
  };
}

export interface Satellite {
  id: number;
  geometry: {
    coordinates: number[]; // [lng, lat, alt]
  };
  properties: {
    name: string;
    norad_id: number;
    open: boolean;
  };
}
