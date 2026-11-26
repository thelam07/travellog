// Khai báo kiểu tối thiểu cho plugin leaflet.gridlayer.googlemutant (gói không kèm .d.ts).
declare module 'leaflet.gridlayer.googlemutant' {
  import { GridLayer, GridLayerOptions } from 'leaflet';
  export interface GoogleMutantOptions extends GridLayerOptions {
    type?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
    styles?: unknown[];
  }
  export default class GoogleMutant extends GridLayer {
    constructor(options?: GoogleMutantOptions);
  }
}
