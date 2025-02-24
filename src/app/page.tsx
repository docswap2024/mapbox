"use client";

import MapboxMap from "@/components/map";
import { useState, useEffect } from "react";
import { getWebsiteOwnerByApiKey } from "@/db/server/actions/websiteOwner.action";
import { WebsiteOwner } from "@/db/schema";
import AccessDenied from "./accessDenied";

export default function Home() {
  const [currentWebsiteOwner, setCurrentWebsiteOwner] = useState<WebsiteOwner>();
  const [isLoading, setIsLoading] = useState(true);
  

  // Get the API key from the URL query string
  const getApiKeyFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("apiKey");
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const apiKey = getApiKeyFromUrl();

      if (apiKey) {
        const websiteOwner = await getWebsiteOwnerByApiKey(apiKey);
        setCurrentWebsiteOwner(websiteOwner);
      }

      console.log(apiKey)

      setIsLoading(false);
    };



    fetchData();
  }, []);

  if (isLoading) {
    return <div className="relative w-12 h-12 mx-auto top-10">
            <div className="absolute w-full h-full border-t-transparent border-2 border-brandDark text-white rounded-full animate-spin"></div>
        </div>
  }

  return (
    <>
      {currentWebsiteOwner ? (
        <div>
          <MapboxMap
            accessToken="pk.eyJ1Ijoibm1hbmRpdmV5aSIsImEiOiJja2x5Z3o5N3kwMTlzMnVwOG8yaHFsbm9iIn0.Hnx3npUN7PTiOZSH8ju1kA"
            style="mapbox://styles/nmandiveyi/ckwmqtgv305f514mnn23k7yax"
            center={[-123.152797, 49.699331]}
            zoom={16}
          />
        </div>
      ) : (
        <AccessDenied />
      )}
    </>
  );
}
