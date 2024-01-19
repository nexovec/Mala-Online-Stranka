import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import "./style/Home.css";

const Home = () => {
  const [geojsonData, setGeojsonData] = useState(null);

  useEffect(() => {
    fetch("obce.json")
      .then((response) => response.json())
      .then((data) => {
        setGeojsonData(data);
      });
  }, []);

  const geoJSONStyle = (feature) => {
    return {
      fillColor: "black",
      fillOpacity: 0.1,
      color: "black",
      weight: 1.5,
    };
  };

  console.log(geojsonData);

  return (
    <>
      <MapContainer
        center={[50.08, 14.42]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: "100vh", width: "100%" }}
        className="map"
      >
        {geojsonData && <GeoJSON data={geojsonData} style={geoJSONStyle} />}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[50.08, 14.42]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      </MapContainer> 

      <div className="selector">
          <NativeSelect
            mt="md"
            label="Výběr ukazatele"
            data={["React", "Angular", "Vue", "Svelte"]}
            //description="Description below the input"
          />
        </div>
    </>
  );
};

export default Home;
