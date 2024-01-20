import { MapContainer, TileLayer } from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import Slider from "@mui/material/Slider";
import "./style/Home.css";
//import L from "leaflet";
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
  const [selectedArea, setSelectedArea] = useState(); //uchovává vybrané uzemí
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);

  // Function to handle click event on a GeoJSON feature


  
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

  /*
  const geoJSONStyle = (feature) => {
    return {
      fillColor: "#1976d2",
      fillOpacity: 0.1,
      color: "black",
      weight: 1.5,
    };
  };

  */

  if (loading) {
    return (
      <div>
        <h1>Načítání dat...</h1>
      </div>
    );
  }

  const onFeatureClick = (e) => {
    console.log(e.layer.feature.nationalCode);
    const featureId = e.layer.feature.nationalCode;
    setSelectedFeatureId(featureId); // Update the selected feature ID
  };

  const geoJSONStyle = (feature) => {
    // Check if this feature is the selected one
    if (feature.nationalCode === selectedFeatureId) {
      return {
        fillColor: "blue",
        fillOpacity: 0.5,
        color: "black",
        weight: 2,
      };
    } else {
      return {
        fillColor: "#1976d2",
        fillOpacity: 0.1,
        color: "black",
        weight: 1.5,
      };
    }
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
            //onEachFeature={onEachFeature}
            eventHandlers={{
              click: onFeatureClick, // Add the click event handler
            }}
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
              placeholder={selectedArea || "Vyhledávač"}
            />
          )}
          onChange={(event, newValue) => {
            setSearch(newValue ? newValue.id : null);
            setSelectedArea(newValue ? newValue.name : null);
          }}
          getOptionSelected={(option, value) => option.id === value.id}
        />
      </div>

      {/*
      <div className="modal">
        <h3>{selectedArea}</h3>


      </div>

      */}

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
        </div>
        <div className="year">
          <h3>Vybraný rok: {year}</h3>
        </div>
      </div>
    </>
  );
};

export default Home;
