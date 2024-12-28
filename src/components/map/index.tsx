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
import { fetchImage, formatPid, getBathrooms, formatPrice } from '@/utils';
import MapControls from '../mapControls';
import StrataMenu from '../strataMenu';
import { PropertyDetailPopup } from './propertyDetailPopup';
import { ListingDetailPopup } from './listingDetailPopup';

interface MapboxMapProps {
    accessToken: string; // Mapbox access token
    style?: string; // Map style
    center?: [number, number]; // Initial center [lng, lat]
    zoom?: number; // Initial zoom level
    markers?: Array<{ lng: number; lat: number; popupText?: string }>; // Markers with optional popups
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
    markers = [],
    height = '400px',
    width = '100%',
  }) => {
    const [getProperty, setProperty] = useState<any>(null);
    const [getStrataProperties, setStrataProperties] = useState<any>([]);
    const [getStrataProperty, setStrataProperty] = useState<any>(null);
    const [cardImage, setCardImage] = useState<any>(null);
    const strataPopupRef = useRef<HTMLDivElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    const detachedListingPopupRef = useRef<HTMLDivElement | null>(null);
    const multifamilyListingPopupRef = useRef<HTMLDivElement | null>(null);
    const strataListingPopupRef = useRef<HTMLDivElement | null>(null);
    const multipleStrataListingsPopupRef = useRef<HTMLDivElement | null>(null);
    const landListingPopupRef = useRef<HTMLDivElement | null>(null);
    const [showListingDetails, setShowListingDetails] = useState<any>(null);
    const [showPropertyDetails, setShowPropertyDetails] = useState<any>(null);
    const [propertyType, setPropertyType] = useState<any>(null);
    const [allDetachedListings, setAllDetachedListings] = useState<any>(null);
    const [allStrataListings, setAllStrataListings] = useState<any>(null);
    const [allLandListings, setAllLandListings] = useState<any>(null);
    const [allMultifamilyListings, setAllMultifamilyListings] = useState<any>(null);
    const [allDetachedListingsCoordinates, setAllDetachedListingsCoordinates] = useState<any>(null);
    const [allStrataListingsCoordinates, setAllStrataListingsCoordinates] = useState<any>(null);
    const [allLandListingsCoordinates, setAllLandListingsCoordinates] = useState<any>(null);
    const [allMultifamilyListingsCoordinates, setAllMultifamilyListingsCoordinates] = useState<any>(null);
    const [detachedListing, setDetachedListing] = useState<any>(null);
    const [multifamilyListing, setMultifamilyListing] = useState<any>(null);
    const [strataListing, setStrataListing] = useState<any>(null);
    const [landListing, setLandListing] = useState<any>(null);
    const [listingType, setListingType] = useState<any>(null);
    const [getStrataListings, setStrataListings] = useState<any>([]);

    const selectedStatuses = ['Active', 'Active Under Contract'];

    var markerHeight = 50, markerRadius = 10, linearOffset = 25;
    var popupOffsets: mapboxgl.PopupOptions['offset'] = {
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
      
        const marker = new mapboxgl.Marker()
          .setLngLat([longitude, latitude])
          .addTo(map);
      
        map.flyTo({
          center: [longitude, latitude],
        });
    }

    const getPopUp = (data: any) => {
        var civic_address = data.CivicAddress.Value.split(' ')
        civic_address[1] = civic_address[1][0].toUpperCase() + civic_address[1].slice(1).toLowerCase()
        setProperty(data);
        
        var bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/Streetview/'
        var card_image = bucket + civic_address[1] + '/card/' + civic_address[0] + '-' + civic_address[1] + '.jpg'
  
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

     const extractCoordinates = (data) =>
      data.map((item) => ({
        latitude: item.Latitude.Value,
        longitude: item.Longitude.Value,
    }));


    const fetchListings = async (endpoint, setListings, setCoordinates) => {
      try {
        const response = await axios.get(endpoint);
        const listings = response.data;
    
        // Filter listings based on Latitude and Longitude validity
        const filteredData = listings
          .filter(item => item.Latitude && item.Longitude && item.Latitude.Value && item.Longitude.Value)
          .map(item => {
            // Clean Latitude and Longitude if needed
            if (item.Latitude.Value && item.Longitude.Value) {
              item.Latitude.Value = item.Latitude.Value.replace(/[^-+\d.]/g, '');
              item.Longitude.Value = item.Longitude.Value.replace(/[^-+\d.]/g, '');
            }
            return item;
          });
    
        setListings(filteredData);
        const coordinates = extractCoordinates(filteredData);
        setCoordinates(coordinates);
      } catch (error) {
        console.error(`Error fetching listings from ${endpoint}:`, error);
        throw error;
      }
    };

    const fetchAllListings = async () => {
      try {
        await Promise.all([
          fetchListings(`/api/rets/detached/getAllDetachedListings`, setAllDetachedListings, setAllDetachedListingsCoordinates),
          fetchListings(`/api/rets/multifamily/getAllMultifamilyListings`, setAllMultifamilyListings, setAllMultifamilyListingsCoordinates),
          fetchListings(`/api/rets/strata/getAllStrataListings`, setAllStrataListings, setAllStrataListingsCoordinates),
          fetchListings(`/api/rets/land/getAllLandListings`, setAllLandListings, setAllLandListingsCoordinates),
        ]);
      } catch (error) {
        console.error("Error fetching all listings:", error);
      }
    };

    const getStatusImage = (status, type) => {
      // Adjusts image path based on the listing type (detached, strata, etc.)
      if (type === 'strata') {
        if (status === 'Active' || status === 'Active Under Contract') {
          return "url('/images/Strata-Active.png')";
        } else if (status === 'Pending' || status === 'Closed') {
          return "url('/images/Strata-Sold.png')";
        }
        return "url('/images/Strata-Others.png')";
      } else {
        if (status === 'Active' || status === 'Active Under Contract') {
          return "url('/images/Detached-Active.png')";
        } else if (status === 'Pending' || status === 'Closed') {
          return "url('/images/Detached-Sold.png')";
        }
        return "url('/images/Detached-Others.png')";
      }
    };

    const createMarkerElement = (status, type) => {
      const el = document.createElement('div');
      el.style.width = '60px';
      el.style.height = '60px';
      el.style.backgroundSize = '100%';
      el.style.cursor = 'pointer';
      el.style.zIndex = "0";
      el.style.backgroundImage = getStatusImage(status, type);
      return el;
    };

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);  

    const getListingByType = async (pid, listingType) => {
      const url = `/api/rets/${listingType}/get${capitalize(listingType)}Listing/${pid}`;
      const response = await axios.get(url);
      return response.data[0];
    };

    const showPopup = (listing, listingType) => {
      const popupRef = 
      listingType === 'detached' 
        ? detachedListingPopupRef 
        : listingType === 'strata' 
          ? strataListingPopupRef 
          : listingType === 'multifamily' 
            ? multifamilyListingPopupRef 
            : listingType === 'strataMultiple'
            ? multipleStrataListingsPopupRef
            : landListingPopupRef;


      const popups = document.getElementsByClassName("mapboxgl-popup");
      if (popups.length) popups[0].remove();

      console.log(listingType)
    
      new mapboxgl.Popup({ offset: popupOffsets, className: 'mapboxgl-popup' })
        .setLngLat([listing.Longitude.Value, listing.Latitude.Value])
        .setMaxWidth("100px")
        .setDOMContent(popupRef.current)
        .addTo(map);
    };

    const addClickListener = (el, listing, listingType) => {
      el.addEventListener('click', async (event) => {
        event.stopPropagation();
        event.preventDefault();
        const pid = listing.PID.Value;
    
        try {
          const fetchedListing = await getListingByType(pid, listingType);
          console.log(fetchedListing);
          if(listingType === 'strata') {
            const bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/';
            const card_image = bucket + fetchedListing.GISID.Value + '/card.jpg';

            fetchImage(card_image).then(result => {
              setCardImage(result);
            });
          } else {
            var civic_address = fetchedListing.CivicAddress.Value.split(' ')
            civic_address[1] = civic_address[1][0].toUpperCase() + civic_address[1].slice(1).toLowerCase()
            var bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/Streetview/'
            var card_image = bucket + civic_address[1] + '/card/' + civic_address[0] + '-' + civic_address[1] + '.jpg'

            fetchImage(card_image)// what? Net 40050
            .then(result => {
              setCardImage(result);
            });
          }
    
          setListingType(listingType + "Listing");
          if (listingType === 'strata') {
            setStrataListing(fetchedListing);
          } else if (listingType === 'multifamily') {
            setMultifamilyListing(fetchedListing);
          } else if (listingType === 'land') {
            setLandListing(fetchedListing);
          } else {
            setDetachedListing(fetchedListing);
          }
          showPopup(fetchedListing, listingType);
        } catch (error) {
          console.error("Error:", error);
        }
      });
    };

    const addStrataClickListener = async (el, listings, listingType) => {
      const getMultipleListings = async (listings) => {
        const multipleListings: any = [];
        const promises = listings.map(async (item) => {
          const pid = item.PID.Value;
          try {
            const fetchedListing = await getListingByType(pid, listingType);
            multipleListings.push(fetchedListing);
          } catch (error) {
          }
        });
        await Promise.all(promises);
        return multipleListings;
      }


      if (listings.length === 1) {
        addClickListener(el, listings[0], listingType);
      } else {
          el.addEventListener('click', async (event) => {
            event.stopPropagation();
            event.preventDefault();
    
            try {
              const strataListingsData = await getMultipleListings(listings);
              const filteredListings = strataListingsData.filter(listing => ['Activ'].includes(listing.Status.Value));
              setStrataListings(filteredListings);
              setListingType('strataListing');
              const StrataBucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/';

              const card_image = StrataBucket + listings[0].GISID.Value + '/card.jpg';
              fetchImage(card_image)
              .then(result => {
                setCardImage(result);
              });
              showPopup(listings[0], 'strataMultiple');
            } catch (error) {
            }
          });        
      }

    }

    const addListingsToMap = async ({ coordinates, filteredData }, listingType) => {
      coordinates.forEach((coordinate, index) => {
        const listing = filteredData[index];
        if (selectedStatuses.includes(listing.Status.Value)) {
          const markerEl = createMarkerElement(listing.Status.Value, listingType);
          addClickListener(markerEl, listing, listingType);
          new mapboxgl.Marker(markerEl).setLngLat([coordinate.longitude, coordinate.latitude]).addTo(map);
        }
      });
    };

    const addStrataListingsToMap = async ({ coordinates, filteredData }, listingType) => {
      const listingsByCoordinates = coordinates.reduce((acc, coordinate, index) => {
        const key = `${coordinate.latitude},${coordinate.longitude}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(filteredData[index]);
        return acc;
      }, {});

      Object.keys(listingsByCoordinates).forEach((key) => {
        const listings = listingsByCoordinates[key];
        const [latitude, longitude] = key.split(',').map(Number);
        if (selectedStatuses.includes(listings[0].Status.Value)) {
          const markerEl = createMarkerElement(listings[0].Status.Value, listingType);
          addStrataClickListener(markerEl, listings, listingType);
          new mapboxgl.Marker(markerEl).setLngLat([longitude, latitude]).addTo(map);
        }
      });
    };

    const addMarkers = async () => {
     if (allDetachedListingsCoordinates && allDetachedListings) {
        console.log('Adding detached markers');
        await addListingsToMap({coordinates: allDetachedListingsCoordinates, filteredData: allDetachedListings}, 'detached');
     }

     if (allStrataListingsCoordinates && allStrataListings) {
       await addStrataListingsToMap({coordinates: allStrataListingsCoordinates, filteredData: allStrataListings}, 'strata');
     }

     if (allLandListingsCoordinates && allLandListings) {
       await addListingsToMap({coordinates: allLandListingsCoordinates, filteredData: allLandListings}, 'land');
     }

     if (allMultifamilyListingsCoordinates && allMultifamilyListings) {
       await addListingsToMap({coordinates: allMultifamilyListingsCoordinates, filteredData: allMultifamilyListings}, 'multifamily');
     }
   };

   const handleButtonClick = () => {
    setShowListingDetails(false);
    setShowPropertyDetails(true);
  }

  const handleListingButtonClick = () => {
    setShowPropertyDetails(false);
    setShowListingDetails(true);
  }
    
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
            setPropertyType('strata');
        } else {
            getPropertyData(raw_pid, 'detached');
            setPropertyType('detached');
        }
            
        var feature = map.queryRenderedFeatures(e.point, {
          layers: ['parcels-fill']
        });

        var filter = feature.reduce(
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


      fetchAllListings();
  
      // Clean up on unmount
      // return () => map.remove();
    }, []);

    useEffect(() => {
      if (allDetachedListings?.length || allMultifamilyListings?.length || allStrataListings?.length || allLandListings?.length) {
        console.log('Adding markers');
        addMarkers();
      }
    }, [allDetachedListings, allMultifamilyListings, allStrataListings, allLandListings]);
  
  
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
              handleButtonClick();
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
                <StrataMenu strataProperties={getStrataProperties} setProperty={setStrataProperty} handleButtonClick={handleButtonClick}/>
            </div>
        </div> 

        <div style={{ display: "none" }} onClick={() => {
             handleListingButtonClick();
          }}>
            <div ref={detachedListingPopupRef}>
              <style>{popupStyles}</style>
              <div className="detached-card">
                {cardImage && <Image src={cardImage} alt="" width={1000} height={600}></Image>}
                <div className="bottom-left">
                  {
                    detachedListing && (
                      <p>    
                      {formatPrice(detachedListing.AskingPrice.Value)}<br/>
                      {detachedListing.CivicAddress.Value}<br/>
                      {detachedListing.Neighbourhood.Value}&nbsp;|&nbsp;{detachedListing.PostalCode.Value}<br/>
                      Beds {detachedListing.Bedrooms.Value} &nbsp;|&nbsp;Baths  {getBathrooms(detachedListing.FullBaths.Value, detachedListing.HalfBaths.Value)} &nbsp;|&nbsp;Floor Area  {detachedListing.TotalFloorArea.Value}<br/>
                      Lot Size  {detachedListing.LotSize.Value}<br/>
                      MLS® {detachedListing.MLSNumber.Value}<br/>
                      Listing By {detachedListing.ListingOffice.Value}<br/>
                      </p>
                    )
                  }
                </div>
              </div>
            </div>
        </div> 

        <div style={{ display: "none" }} onClick={() => {
            handleListingButtonClick();
          }}>
              <div ref={strataListingPopupRef}>
                <style>{popupStyles}</style>
                <div className="detached-card">
                  {cardImage && <Image src={cardImage} alt="" width={1000} height={600}></Image>}
                  <div className="bottom-left">
                    {
                      strataListing && (
                        <p>    
                        {formatPrice(strataListing.AskingPrice.Value)}<br/>
                        {strataListing.CivicAddress.Value}<br/>
                        {strataListing.Neighbourhood.Value}&nbsp;|&nbsp;{strataListing.PostalCode.Value}<br/>
                        Beds {strataListing.Bedrooms.Value} &nbsp;|&nbsp;Baths  {getBathrooms(strataListing.FullBaths.Value, strataListing.HalfBaths.Value)} &nbsp;|&nbsp;Floor Area  {strataListing.TotalFloorArea.Value}<br/>
                        Lot Size  {strataListing.LotSize.Value}<br/>
                        MLS® {strataListing.MLSNumber.Value}<br/>
                        Listing By {strataListing.ListingOffice.Value}<br/>
                        </p>
                      )
                    }
                  </div>
                </div>
            </div>
        </div> 

        <div style={{ display: "none" }} >
          <div ref={multipleStrataListingsPopupRef}>
            <style>{popupStyles}</style>
            <div className="strata-card">
            {cardImage && <Image src={cardImage} alt="" width={1000} height={600}></Image>}
              <div className="bottom-left"></div>
            </div>
            <StrataMenu strataProperties={getStrataListings} setProperty={setStrataListing} handleButtonClick={handleListingButtonClick} />
          </div>
        </div>

        <div style={{ display: "none" }} onClick={()=> {
          handleListingButtonClick();
        }}>
          <div ref={landListingPopupRef}>
              <style>{popupStyles}</style>
              <div className="detached-card">
                {cardImage && <Image src={cardImage} alt="" width={1000} height={600}></Image>}
                {/* <Image src="/images/Default-Card.jpg" alt="" width={1000} height={600}></Image> */}
                <div className="bottom-left">
                  {
                    landListing && (
                      <p>    
                        {formatPrice(landListing.AskingPrice.Value)}<br/>
                      {landListing.CivicAddress.Value}<br/>
                      {landListing.Neighbourhood.Value}&nbsp;|&nbsp;{landListing.PostalCode.Value}<br/>
                      Beds {landListing.Bedrooms.Value} &nbsp;|&nbsp;Baths {landListing.Bathrooms.Value} &nbsp;|&nbsp;Floor Area  {landListing.TotalFloorArea.Value}<br/>
                      Lot Size  {landListing.LotSize.Value}<br/>
                      MLS® {landListing.MLSNumber.Value}<br/>
                      Listing By {landListing.ListingOffice.Value}<br/>
                      </p>
                    )
                  }
                </div>
              </div>
          </div>
        </div> 

        <div style={{ display: "none" }} onClick={() => {
          handleListingButtonClick();
          }}>
            <div ref={multifamilyListingPopupRef}>
              <style>{popupStyles}</style>
              <div className="detached-card">
                {cardImage && <Image src={cardImage} alt="" width={1000} height={600}></Image>}
                <div className="bottom-left">
                  {
                    multifamilyListing && (
                      <p>    
                      {formatPrice(multifamilyListing.AskingPrice.Value)}<br/>
                      {multifamilyListing.CivicAddress.Value}<br/>
                      {multifamilyListing.Neighbourhood.Value}&nbsp;|&nbsp;{multifamilyListing.PostalCode.Value}<br/>
                      Beds {multifamilyListing.Bedrooms.Value} &nbsp;|&nbsp;Baths  {getBathrooms(multifamilyListing.FullBaths.Value, multifamilyListing.HalfBaths.Value)} &nbsp;|&nbsp;Floor Area  {multifamilyListing.TotalFloorArea.Value}<br/>
                      Lot Size  {multifamilyListing.LotSize.Value}<br/>
                      MLS® {multifamilyListing.MLSNumber.Value}<br/>
                      Listing By {multifamilyListing.ListingOffice.Value}<br/>
                      </p>
                    )
                  }
                </div>
              </div>
            </div>
        </div> 

        {showPropertyDetails && propertyType === 'detached' && (
              <PropertyDetailPopup
                showPropertyDetails={showPropertyDetails}
                setShowPropertyDetails={setShowPropertyDetails}
                getProperty={getProperty}
                propertyType={propertyType}
                listings={allDetachedListings}
              />
          )}

        {showPropertyDetails && propertyType === 'strata' && (
              <PropertyDetailPopup
                showPropertyDetails={showPropertyDetails}
                setShowPropertyDetails={setShowPropertyDetails}
                getProperty={getStrataProperty}
                propertyType={propertyType}
                listings={allStrataListings}

              />
        )}

        {showListingDetails && listingType === 'detachedListing' && (
              <ListingDetailPopup
                showListingDetails={showListingDetails}
                setShowListingDetails={setShowListingDetails}
                getListing={detachedListing}
                listingType={listingType}
              />
        )}

        {showListingDetails && listingType === 'landListing' && (
              <ListingDetailPopup
                showListingDetails={showListingDetails}
                setShowListingDetails={setShowListingDetails}
                getListing={landListing}
                listingType={listingType}
              />
        )}

        {showListingDetails && listingType === 'strataListing' && (
              <ListingDetailPopup
                showListingDetails={showListingDetails}
                setShowListingDetails={setShowListingDetails}
                getListing={strataListing}
                listingType={listingType}
              />
          )}

          {showListingDetails && listingType === 'multifamilyListing' && (
            <ListingDetailPopup
              showListingDetails={showListingDetails}
              setShowListingDetails={setShowListingDetails}
              getListing={multifamilyListing}
              listingType={listingType}
            />
          )}
 
      </div>
    );
};

export default MapboxMap;
