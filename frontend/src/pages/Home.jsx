import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import Slider from "@mui/material/Slider";
import "./style/Home.css";

const Home = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [data, setData] = useState([]);
  const [year, setYear] = useState(2020);
  const [level, setLevel] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/ciselnik/metrics");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setGeojsonData(null)
    fetch(`${level}.json`)
      .then((response) => response.json())
      .then((data) => {
        setGeojsonData(data);
      });
  }, [level]);
  

  const geoJSONStyle = (feature) => {
    return {
      fillColor: "#1976d2",
      fillOpacity: 0.1,
      color: "black",
      weight: 1.5,
    };
  };

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
          data={data.map((item) => ({
            value: item.value,
            label: item.nazev,
          }))}
        />
      </div>


      <div className="selector2">
        <NativeSelect
          mt="md"
          label="Výběr ukazatele"
          data={['okresy', 'kraje', 'obce']}
          onChange={
            (e) => {
              setLevel(e.target.value);
              console.log(e.target.value);

            }
          }
        />
      </div>


      <div className="timeline">
        <Slider
          className="slider"
          value={year}
          min={2000}
          max={2020}
          onChange={(e) => setYear(e.target.value)}
          step={1}
          marks 
        />
        <h3>{year}</h3>
      </div>
    </>
  );
};

export default Home;
