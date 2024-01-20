import { MapContainer, TileLayer } from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import Slider from "@mui/material/Slider";
import "./style/Home.css";
import L from "leaflet";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const Home = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [data, setData] = useState([]);
  const [searchChoice, setSearchChoice] = useState([]);
  const [search, setSearch] = useState([]);
  const [year, setYear] = useState(2020);
  const [level, setLevel] = useState("okresy");
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

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
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/ciselnik/places/${level}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await response.json();
        setSearchChoice(json);
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
      }
    };

    fetchData();
  }, [level]);

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

  let highlightedLayer = null; 

  const resetHighlight = () => {
    if (highlightedLayer) {
      highlightedLayer.setStyle({
        fillColor: "#1976d2",
        fillOpacity: 0.1,
        color: "black",
        weight: 1.5,
      });
    }
  };

  const highlightFeature = (layer) => {
    if(!selectedArea) {
      resetHighlight();
    }

    layer.setStyle({
      weight: 5,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.7,
      fillColor: "#00f",
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    highlightedLayer = layer;

    const areaName = layer.feature.nazev;
    setSelectedArea(areaName);
    console.log(selectedArea);
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        highlightFeature(layer);
        console.log(`ID místa: ${feature.nationalCode}`);
      },
      dblclick: () => {
        const centroid = layer.getBounds().getCenter();
        console.log(centroid);
        console.log("Ahoj");
      },
    });
  };
  

  console.log(search);



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

      <div className="search">
        <Autocomplete
          freeSolo
          className="search-bar"
          getOptionLabel={(option) => option.nazev}
          options={Array.isArray(searchChoice) ? searchChoice : []}
          renderInput={(params) => (
            <TextField
              {...params}
              label=""
              placeholder="Vyhledávač"
              value={selectedArea || ""}
            />
          )}
          onChange={(event, newValue) => {
            setSearch(newValue ? newValue.id : null);
            setSelectedArea(newValue ? newValue.nazev : null);
          }}
          getOptionSelected={(option, value) => option.id === value.id}
        />
      </div>

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
