import { MapContainer, TileLayer } from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import Slider from "@mui/material/Slider";
import "./style/Home.css";
import L from 'leaflet';

const Home = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [data, setData] = useState([]);
  const [year, setYear] = useState(2020);
  const [level, setLevel] = useState("okresy");
  const [loading, setLoading] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);

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
    setLoading(true);
    setGeojsonData(null);
    fetch(`${level}.json`)
      .then((response) => response.json())
      .then((data) => {
        setGeojsonData(data);
        setLoading(false);
        console.log(data);
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

  if (loading) {
    return (
      <div>
        <h1>Načítání dat...</h1>
      </div>
    );
  }

  const highlightFeature = (e) => {
    var layer = e.target;

    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7,
      fillColor: '#00f'
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  };

  const resetHighlight = (e) => {
    var layer = e.target;
    layer.setStyle({
      weight: 2,
      color: '#666',
      dashArray: '3',
      fillOpacity: 0.2,
      fillColor: '#fff' // Vrátí se na původní barvu
    });
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: (e) => {
        if (activeRegion) {
          resetHighlight({ target: activeRegion });
        }
        setActiveRegion(e.target);
        highlightFeature(e);
        console.log(`ID místa: ${feature.id}`);
      }
    });
  };


  return (
    <>
      <MapContainer
        center={[49.8442, 13.3633]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: "100vh", width: "100%" }}
        className="map"
      >
        {geojsonData && (
          <GeoJSON
            data={geojsonData}
            style={geoJSONStyle}
            onEachFeature={onEachFeature} 
          />
        )}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      <div className="selectors">
        <NativeSelect
          mt="md"
          label="Výběr ukazatele"
          data={data.map((item) => ({
            value: item.value,
            label: item.nazev,
          }))}
        />

        <NativeSelect
          mt="md"
          label="Výběr ukazatele"
          value={level}
          data={["okresy", "kraje", "obce"]}
          onChange={(e) => {
            setLevel(e.target.value);
            console.log(e.target.value);
          }}
        />
      </div>

      <div className="timeline">
        <div className="slider-container">
          <h3>2000</h3>
          <Slider
            className="slider"
            value={year}
            min={2000}
            max={2022}
            valueLabelDisplay="off"
            onChange={(e) => setYear(e.target.value)}
            step={1}
            marks
          />
          <h3>2022</h3>
          <h3>{year}</h3>
        </div>
      </div>
    </>
  );
};

export default Home;
