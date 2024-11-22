export const popupStyles = `
.mapboxgl-popup-anchor-top {
  max-width: 250px;
  animation: fadein 0.2s;
}

.mapboxgl-popup-content {
  border-radius: 3px;
  border: 2px solid white;
  box-shadow: 0 3px 14px rgba(0,0,0,0.4);
  min-width: 300px;
  padding: 0;
  cursor: pointer;
}

.mapboxgl-popup-close-button {
  padding-top: 2px;
  padding-right: 5px;
  font-size: 18px;
  font-family: Tahoma, Verdana, sans-serif;
  color: white;
  font-weight: bold;
  z-index:10;
}

.mapboxgl-popup-close-button:hover {
  color: #999;
  background: transparent;
}

.body .hero-map {
  line-height: 1.4;
}

.bottom-left {
  position: absolute;
  bottom: 8px; 
  left: 16px;
  color: white;
  text-justify: left;
  font-weight: bold;
}
.bottom-left p {
  float: left; 
  position: relative; 
  text-align: left;
  font-weight: bold;
}
.strata-card {
  z-index: 5;
}
`;
