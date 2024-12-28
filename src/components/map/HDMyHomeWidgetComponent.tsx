import React, { useEffect } from 'react';
import '@honestdoor/widget-react/dist/widget.umd.css';


const HDMyHomeWidgetComponent: React.FC = () => {
  useEffect(() => {
    // Create and append the CSS link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/@honestdoor/lead-gen-widget@latest/dist/widget.umd.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@honestdoor/lead-gen-widget@latest/dist/widget.umd.js';
    script.async = true;
    script.onload = () => {
      new (window as any).HDWidget('AY98q81Kyk6kcILnM7ObC6AHXiPk7msp6eCo32kM', 'hd-widget'); // Replace with your widget ID
    };


    document.getElementById('hd-widget')?.appendChild(script);
  }, []);

  return (
    <>
      <div id="hd-widget" style={{zIndex: '5'}}></div>
    </>

  );
};

export default HDMyHomeWidgetComponent;
