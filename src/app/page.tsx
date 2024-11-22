import Image from "next/image";
import MapboxMap from "@/components/map";

export default function Home() {
  return (
    <div>
       <MapboxMap
            accessToken='pk.eyJ1Ijoibm1hbmRpdmV5aSIsImEiOiJja2x5Z3o5N3kwMTlzMnVwOG8yaHFsbm9iIn0.Hnx3npUN7PTiOZSH8ju1kA'
            style="mapbox://styles/nmandiveyi/ckwmqtgv305f514mnn23k7yax"
            center={[-123.152797, 49.699331]}
            zoom={16}
        />
    </div>
  );
}
