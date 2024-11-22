"use client"

import mapboxgl, { LngLatLike } from 'mapbox-gl';
import React, { useEffect, useState, useRef } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {MapboxStyleDefinition, MapboxStyleSwitcherControl} from 'mapbox-gl-style-switcher';
import 'mapbox-gl-style-switcher/styles.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';
import { popupStyles } from './styles';  
import Image from 'next/image';
import { fetchImage, formatPid } from '@/utils';
import MapControls from '../mapControls';
import StrataMenu from '../strataMenu';

interface MapboxMapProps {
    accessToken: string; // Mapbox access token
    style?: string; // Map style
    center?: [number, number]; // Initial center [lng, lat]
    zoom?: number; // Initial zoom level
    height?: string; // Map height (e.g., '400px')
    width?: string; // Map width (e.g., '100%')
}
  
let map: mapboxgl.Map | null = null;
let center_index = 0;

const MapboxMap: React.FC<MapboxMapProps> = ({
    accessToken,
    style = 'mapbox://styles/nmandiveyi/ckwmqtgv305f514mnn23k7yax',
    center = [-123.152797, 49.699331],
    zoom = 16,
    height = '400px',
    width = '100%',
  }) => {
    const [getProperty, setProperty] = useState<any>(null);
    const [getStrataProperties, setStrataProperties] = useState<any>([]);
    const [cardImage, setCardImage] = useState<any>(null);
    const strataPopupRef = useRef<HTMLDivElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    // const [propertyType, setPropertyType] = useState<any>(null);

    const markerHeight = 50, markerRadius = 10, linearOffset = 25;
    const popupOffsets: mapboxgl.PopupOptions['offset'] = {
      'top': [0, 0],
      'top-left': [0, 0],
      'top-right': [0, 0],
      'bottom': [0, -markerHeight],
      'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
      'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
      'left': [markerRadius, (markerHeight - markerRadius) * -1],
      'right': [-markerRadius, (markerHeight - markerRadius) * -1]
    };

    const centres: LngLatLike[] = [
        [-123.152797, 49.699331],
        [-123.133609, 49.700974],
        [-123.119757, 49.705591],
        [-123.137476, 49.701877],
        [-123.140778, 49.723844],
        [-123.098531, 49.73718],
        [-123.112242, 49.740384],
        [-123.132769, 49.739052],
        [-123.133288, 49.75533],
        [-123.151891, 49.834472],
        [-123.142436, 49.76105],
        [-123.152541, 49.729439],  
        [-123.154537, 49.720418],
        [-123.153982, 49.709819]
    ];

    const handleFlyTo = () => {
        if (center_index === 13) {
          center_index = 0;
        } else {
          center_index++;
        }
    
        map.flyTo({
          center: centres[center_index]
        });
    };
    
    const handleFlyBack = () => {
    if (center_index === 0) {
        center_index = 13;
    } else {
        center_index--;
    }

    map.flyTo({
        center: centres[center_index]
    });
    };

    const getLocation = (event: React.MouseEvent<HTMLDivElement>) => {
    if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(flyToPosition);
        }
        event.preventDefault();
    };

    function flyToPosition(position: GeolocationPosition) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
      
        new mapboxgl.Marker()
          .setLngLat([longitude, latitude])
          .addTo(map);
      
        map.flyTo({
          center: [longitude, latitude],
        });
    }

    const getPopUp = (data: any) => {
        const civic_address = data.CivicAddress.Value.split(' ')
        civic_address[1] = civic_address[1][0].toUpperCase() + civic_address[1].slice(1).toLowerCase()
        setProperty(data);
        
        const bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/Streetview/'
        const card_image = bucket + civic_address[1] + '/card/' + civic_address[0] + '-' + civic_address[1] + '.jpg'
  
        fetchImage(card_image)
        .then(result => {
          setCardImage(result);
        });
  
        new mapboxgl.Popup({offset: popupOffsets, className: 'mapboxgl-popup'})
            .remove()
            .setLngLat([data.Longitude.Value, data.Latitude.Value])
            .setMaxWidth("100px")
            .setDOMContent(popupRef.current)   
            .addTo(map);
    }

    const getStrataPopUp = async (data: any) => {
        const StrataBucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/';
        
        try {
          const response = await axios.get(`/api/property/strata/getStrataWithGISID/${data.GISID.Value}`);
          
          if(response.status === 200){
            const data = await response.data;
            setStrataProperties(data);
          }
        
        } catch (error) {
          throw error;
        }
       
       const card_image = StrataBucket + data.GISID.Value + '/card.jpg';
       
       fetchImage(card_image)
       .then(result => {
        setCardImage(result);
       });
  
       new mapboxgl.Popup({offset: popupOffsets, className: 'mapboxgl-popup'})
            .remove()
            .setLngLat([data.Longitude.Value, data.Latitude.Value])
            .setMaxWidth("100px")
            .setDOMContent(strataPopupRef.current)   
            .addTo(map);
    }
    const getPropertyData = async (pid: string, propertyType: 'strata' | 'detached') => {
        const formattedPid = formatPid(pid);
        const endpoint = propertyType === 'strata' 
          ? `/api/property/strata/getStrataWithPID/${formattedPid}`
          : `/api/property/parcels/getParcelWithPID/${formattedPid}`;
        
        try {
          const response = await axios.get(endpoint);
          if (response.status === 200) {
            const data = await response.data;
            propertyType === 'strata' ? getStrataPopUp(data) : getPopUp(data);
          }
        } catch (error) {
          console.error('Error fetching property data:', error);
        }
      };      

    useEffect(() => {
      if (map) return; 
  
      mapboxgl.accessToken = accessToken;
  
      map = new mapboxgl.Map({
        container: 'map', // Map container
        style,
        center,
        zoom,
        bearing: 0,
        pitch: 0,
        cooperativeGestures: true
      });     
  
      const addDataLayer = () => {
          map.addSource('property-parcels', {
            type: 'vector',
            url: 'mapbox://nmandiveyi.952g6rwo',
            hover: true,
          })
    
          map.addSource('points', {
            'type': 'geojson',
            'data': {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -123.142436,
                        49.761050
                            ]
                        }
                    },
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -123.132769,
                        49.739052
                            ]
                        }
                    },
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -123.152797,
                        49.699331
                            ]
                        }
                    },
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -123.140778,
                        49.723844
                            ]
                        }
                    },
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -123.133609,
                        49.700974
                            ]
                        }
                    },
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -123.098531,
                        49.737180
    
                            ]
                        }
                    },
                {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -123.112242,
                        49.740384
                            ]
                        }
                    }
                ]
            }
            });
    
          map.addLayer({
            'id': 'parcel-outline',
            'type': 'line',
            'source': 'property-parcels',
            'source-layer': 'squamish_shape_data',
            'layout': {
            'line-join': 'round',
            'line-cap': 'round'
            },
            'paint': {
            'line-color': 'black',
            'line-width': 2,
            'line-blur': 2,
            }, 
            });
    
          map.addLayer({
          'id': 'parcels-fill',
          'type': 'fill',
          'source': 'property-parcels',
          'source-layer': 'squamish_shape_data',
          'layout': {
          },
          'paint': {
          'fill-color': 'transparent',
          'fill-opacity': 0.3,
          'fill-outline-color': 'black'
          }
          });
    
          map.addLayer(
            {
            'id': 'houses-highlighted',
            'type': 'line',
            'source': 'property-parcels',
            'source-layer': 'squamish_shape_data',
            'layout': {
            'line-join': 'round',
            'line-cap': 'round'
            },
            'paint': {
            'line-color': 'blue',
            'line-width': 3,
            'line-blur': 2,
            },
            'filter': ['in', 'OBJECTID', '']
            }
    
            );
              
        }
  
      const geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl
      });
  
      map.addControl(geocoder);
  
      const styles: MapboxStyleDefinition[] = [
        {
            title: "Satellite",
            uri:"mapbox://styles/nmandiveyi/ckwmqtgv305f514mnn23k7yax"
        },
        {
            title: "Street",
            uri:"mapbox://styles/nmandiveyi/ckwmoxdhi0dp315upyyt5uuu1"
        }, 
        {
            title: "Light",
            uri:"mapbox://styles/nmandiveyi/clqzt0bcy002701ra8dic8i7c"
        },
        {
            title: "Dark",
            uri:"mapbox://styles/nmandiveyi/clqztwel600f401pz6lyz9p33"
        }, 
        {
            title: "Outdoors",
            uri:"mapbox://styles/nmandiveyi/clqzu3bts00fy01rd02q3dgjt"
        }
      ];
  
      const styleSwitcher = new MapboxStyleSwitcherControl(styles, 'Satellite');
      map.addControl(new mapboxgl.FullscreenControl());
      map.addControl(styleSwitcher as any);
      map.addControl(new mapboxgl.NavigationControl());
      map.scrollZoom.disable();
  
      map.on("style.load", () => {
          addDataLayer();
      });

      map.on('click', 'parcels-fill', function (e) {
        
        const raw_pid = e.features[0].properties.PID;
        
        if(e.features[0].properties.CLASS === 'Building Strata') {
            getPropertyData(raw_pid, 'strata');
            // setPropertyType('strata');
        } else {
            getPropertyData(raw_pid, 'detached');
            // setPropertyType('detached');
        }
            
        const feature = map.queryRenderedFeatures(e.point, {
          layers: ['parcels-fill']
        });

        const filter = feature.reduce(
          function (memo, feature) {
            memo.push(feature.properties.OBJECTID);
            return memo;
            },
            ['in', 'OBJECTID']
            );
          
          map.setFilter('houses-highlighted', filter);
      });

      // Change the cursor to a pointer when the mouse is over the states layer.
      map.on('mouseenter', 'parcels-fill', function () {
        map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      map.on('mouseleave', 'parcels-fill', function () {
          map.getCanvas().style.cursor = '';
      });

  
      // Clean up on unmount
      // return () => map.remove();
    });
  
  
    return (
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          id="map"
          style={{
            height,
            width,
          }}
        />
        
        <MapControls onFlyTo={handleFlyTo} onFlyBack={handleFlyBack} onGetLocation={getLocation} />

        <div style={{ display: "none" }} onClick={() => {
              
        }} >
            <div ref={popupRef}>
                <style>{popupStyles}</style>
                <div className="detached-card">
                {cardImage && <Image src={cardImage} alt="" width={1000} height={600}></Image>}
                <div className="bottom-left">
                    {
                    getProperty && (
                        <p>    
                    
                        {getProperty.CivicAddress.Value}<br/>
                        {getProperty.Neighbourhood.Value}&nbsp;|&nbsp;{getProperty.PostalCode.Value}<br/>
                        Beds {getProperty.Bedrooms.Value} &nbsp;|&nbsp;Baths  {getProperty.Bathrooms.Value} &nbsp;|&nbsp;Floor Area  {getProperty.FloorArea.Value}<br/>
                        Lot Size  {getProperty.LotSize.Value}<br/>
                    </p>
                    )
                    }
                    
                </div>
                </div>
            </div>
        </div> 

        <div style={{ display: "none" }}  >
            <div ref={strataPopupRef}>
                <style>{popupStyles}</style>
                <div className="strata-card">
                {cardImage && <Image src={cardImage} alt="" width={1000} height={600}></Image>}
                <div className="bottom-left"></div>
                </div>
                <StrataMenu strataProperties={getStrataProperties} />
            </div>
        </div> 
      </div>
    );
};

export default MapboxMap;
