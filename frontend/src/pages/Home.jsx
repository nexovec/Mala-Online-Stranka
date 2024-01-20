import { MapContainer, TileLayer } from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import Slider from "@mui/material/Slider";
import "./style/Home.css";
//import L from "leaflet";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import BarLoader from "react-spinners/BarLoader";
import Plot from "react-plotlyjs";

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
  const [plotData, setPlotData] = useState([]);
  const [showmodal, setShowmodal] = useState(null);
  const [detailInfo, setDetailInfo] = useState(null);

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
    let obec = selectedFeatureId;
    if (level === "obce") {
      obec = selectedFeatureId.slice(6);
    }
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/ciselnik/getUzemiInfoById/${obec}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await response.json();
        setDetailInfo(json);
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
      }
    };

    fetchData();
  }, [selectedFeatureId, level]);


  console.log(search);
  useEffect(() => {
    let obec = selectedFeatureId;
    if (level === "obce") {
      obec = selectedFeatureId.slice(6);
    }
    

    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/data/spider?place=${obec}&year=${year}&level=${level}`
        );
        const data = await response.json();
        const data2 = JSON.parse(data);
        setPlotData(data2);
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
      }
    };

    fetchData();
  }, [year, selectedFeatureId, level]);

  useEffect(() => {
    setLoading(true);
    setGeojsonData(null);
    fetch(`${level}.json`)
      .then((response) => response.json())
      .then((data) => {
        setGeojsonData(data);
        setLoading(false);
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
      <div className="loading-container">
        <img src="logo.png" alt="cloudovi bratri" />
        <BarLoader color="#010619" height={20} loading width={400} />
      </div>
    );
  }

  const onFeatureClick = (e) => {
    if (level === "obce") {
      const featureId = e.layer.feature.id;
      setSelectedFeatureId(featureId);
    } else {
      const featureId = e.layer.feature.nationalCode;
      setSelectedFeatureId(featureId);
    }
    setShowmodal(null);
  };

  const onFeatureDblClick = (e) => {
    if (level === "obce") {
      setShowmodal(e.layer.feature.id.slice(6));
    } else {
      setShowmodal(e.layer.feature.nationalCode);
    }
  };

  const geoJSONStyle = (feature) => {
    let id = feature.nationalCode;
    if (level === "obce") {
      id = feature.id;
    }

    if (id === selectedFeatureId) {
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

  console.log(detailInfo);


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
              dblclick: onFeatureDblClick,
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

      {showmodal && (
        <div className="modal">
          <h3>{detailInfo}</h3>
          <Plot
            data={plotData.data}
            layout={plotData.layout}
            style={{ width: "100%", height: "400px" }}
          />
        </div>
      )}

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
        <div className="logo-small">
          Vytvořili Cloudoví barbaři 2024
          <img src="logo.png" alt="cloudovi bratri" />
        </div>
      </div>
    </>
  );
};

export default Home;
