import { MapContainer, TileLayer } from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import Slider from "@mui/material/Slider";
import "./style/Home.css";
//import L from "leaflet";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import BounceLoader from "react-spinners/BounceLoader";
import Plot from "react-plotly.js";
import { useDisclosure } from "@mantine/hooks";
import { Modal } from "@mantine/core";
//import { useRef } from "react";
//import { motion } from "framer-motion";
import { Burger } from "@mantine/core";
import defaultExport from "../config";

const Home = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [data, setData] = useState([]);
  const [searchChoice, setSearchChoice] = useState([]);
  //const [search, setSearch] = useState([]);
  const [year, setYear] = useState(2020);
  const [level, setLevel] = useState("okresy");
  const [loading, setLoading] = useState(false);
  //const [selectedArea, setSelectedArea] = useState(); //uchovává vybrané uzemí
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [plotData, setPlotData] = useState([]);
  const [plotData2, setPlotData2] = useState([]);
  const [showmodal, setShowmodal] = useState(null);
  const [detailInfo, setDetailInfo] = useState(null);
  const [metric, setMetric] = useState(70720);
  const [opened, { open, close }] = useDisclosure(false); //modal controls
  const [openedburger, { toggle }] = useDisclosure();
  const [mobile, setMobile] = useState(window.innerWidth < 1000);
  const [rank, setRank] = useState(null);
  const [wideClass, setWideClass] = useState(false);

  const toggleWideClass = () => {
    setWideClass(!wideClass);
  };

  useEffect(() => {
    const handleResize = () => {
      setMobile(window.innerWidth < 1000);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to handle click event on a GeoJSON featurev

  //const constraintsRef = useRef(null);

  const closeModal = () => {
    setShowmodal(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${defaultExport.BACKEND_URL}/ciselnik/metrics`
        );
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
          `${defaultExport.BACKEND_URL}/ciselnik/places/${level}`
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
    if (level === "obce" && obec != null) {
      obec = selectedFeatureId.slice(6);
    }
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${defaultExport.BACKEND_URL}/ciselnik/getUzemiInfoById?id=${obec}&level=${level}`
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
  }, [level, selectedFeatureId]);

  useEffect(() => {
    let obec = selectedFeatureId;
    if (level === "obce" && obec != null) {
      obec = selectedFeatureId.slice(6);
    }

    const fetchData = async () => {
      try {
        setPlotData2(null);
        const response = await fetch(
          `${defaultExport.BACKEND_URL}/data/spider?place=${obec}&year=${year}&level=${level}`
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
    let obec = selectedFeatureId;
    if (level === "obce" && obec != null) {
      obec = selectedFeatureId.slice(6);
    }
    setRank(null);
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${defaultExport.BACKEND_URL}/data/rank?metric_id=${metric}&place=${obec}&level=${level}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const data2 = JSON.parse(data);
        setRank(data2);
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
      }
    };

    fetchData();
  }, [level, selectedFeatureId, metric, wideClass]);

  useEffect(() => {
    let obec = selectedFeatureId;
    if (level === "obce" && obec != null) {
      obec = selectedFeatureId.slice(6);
    }

    const fetchData = async () => {
      try {
        setPlotData2(null);
        const response = await fetch(
          `${defaultExport.BACKEND_URL}/data/plotlygraph?place=${obec}&metric=${metric}&level=${level}`
        );
        const data = await response.json();
        const data2 = JSON.parse(data);
        setPlotData2(data2);
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
      }
    };

    fetchData();
  }, [year, selectedFeatureId, level, metric, wideClass]);

  useEffect(() => {
    setLoading(true);
    setSelectedFeatureId(null);
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
        <BounceLoader color="#010619" height={20} loading width={400} />
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

  console.log(selectedFeatureId);

  return (
    <div
    //ref={constraintsRef}
    >
      <MapContainer
        center={[49.5214, 15.3547]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: "100vh", width: "100%" }}
        className="map"
        doubleClickZoom={false}
      >
        {geojsonData && (
          <GeoJSON
            data={geojsonData}
            style={geoJSONStyle}
            eventHandlers={{
              click: onFeatureClick,
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
            <TextField {...params} label="" placeholder={"Vyhledávač"} />
          )}
          onChange={(event, newValue) => {
            if (newValue) {
              setSelectedFeatureId(newValue.id);
              console.log(newValue.id);
              //setSearch(newValue.id);
              setShowmodal(true);
              //setSelectedArea(newValue.name);
            } else {
              setSelectedFeatureId(null);
              //setSearch(null);
              //setSelectedArea(null);
            }
          }}
          getOptionSelected={(option, value) => option.id === value.id}
        />
        <Burger
          opened={openedburger}
          onClick={toggle}
          aria-label="Toggle navigation"
          className="burger"
        />
      </div>

      {showmodal && detailInfo && (
        <div className="modal">
          <button onClick={closeModal}>X</button>
          {level === "obce" ? (
            <>
              <h3>{detailInfo.obec_name}</h3>
              <h4>{detailInfo.kraj_name}</h4>
              <h4>Okres: {detailInfo.okres_name}</h4>
            </>
          ) : level === "kraje" ? (
            <div>
              <h3>{detailInfo.kraj_name}</h3>
            </div>
          ) : level === "okresy" ? (
            <div>
              <h3>{detailInfo.okres_name}</h3>
              <h4>{detailInfo.kraj_name}</h4>
            </div>
          ) : null}

          {level === "obce" && selectedFeatureId != null && (
            <img
              src={`${
                defaultExport.BACKEND_URL
              }/data/flag?place=${selectedFeatureId.slice(6)}`}
              alt="Flag"
              className="flag"
            />
          )}
          {plotData && (
            <Plot
              data={plotData.data}
              layout={plotData.layout}
              style={{ width: "100%", height: "400px" }}
            />
          )}
        </div>
      )}

      {openedburger && mobile && (
        <div className="selectors">
          <NativeSelect
            mt="md"
            label="Výběr ukazatele"
            data={data.map((item) => ({
              value: item.id,
              label: item.nazev,
            }))}
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          />
        </div>
      )}

      {!mobile && (
        <div className={`selectors ${wideClass ? "wide" : ""}`}>
          <button onClick={toggleWideClass}>{wideClass ? "<" : ">"}</button>
          <NativeSelect
            mt="md"
            label="Výběr ukazatele"
            data={data.map((item) => ({
              value: item.id,
              label: item.nazev,
            }))}
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          />

          {level !== "obce" && selectedFeatureId && rank && wideClass && (
            <Plot
              data={rank.data}
              layout={rank.layout}
              style={{ width: "100%", height: "400px" }}
            />
          )}

          {!rank && level !== "obce" && (
            <div className="loading-rank">
              <BounceLoader color="#1976d2" height={20} loading width={400} />
            </div>
          )}

          {selectedFeatureId && wideClass && plotData2 && (
            <Plot
              data={plotData2.data}
              layout={plotData2.layout}
              style={{ width: "100%", height: "200px" }}
              s
            />
          )}

          {!plotData2 && (
            <div className="loading-plot2">
              <BounceLoader color="#1976d2" height={20} loading width={400} />
            </div>
          )}
        </div>
      )}

      <div className="timeline">
        <div className="slider-container">
          <h3>2000</h3>
          <Slider
            className="slider"
            value={year}
            min={2000}
            max={2020}
            valueLabelDisplay="off"
            onChange={(e) => setYear(e.target.value)}
            step={1}
            marks
          />
          <h3>2020</h3>
        </div>
        <div className="timeline-container">
          <div className="year">
            <h3>Vybraný rok: {year}</h3>
          </div>
          <div className="selector-timeline">
            <h3>Vyberte uzemní jednotku:</h3>
            <NativeSelect
              mt="md"
              //label="Výběr územní jednotky"
              value={level}
              data={["Okresy", "Kraje", "Obce"]}
              onChange={(e) => {
                setLevel(e.target.value.toLowerCase());
              }}
            />
          </div>
          {/* 
          <div className="logo-small">
            Vytvořili Cloudoví barbaři 2024
            <img src="logo.png" alt="cloudovi bratri" />
          </div>
          */}
        </div>

        <Modal.Root opened={opened} onClose={close}>
          <Modal.Overlay />
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Modal</Modal.Title>
              <Modal.CloseButton />
            </Modal.Header>
            <Modal.Body>
              text text text text text text text text text text text text text
              text text text text text{" "}
            </Modal.Body>
          </Modal.Content>
        </Modal.Root>

        <div className="helpicon-container" onClick={open}>
          <h1>?</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;
