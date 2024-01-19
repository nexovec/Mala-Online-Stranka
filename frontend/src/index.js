import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
//import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Plotly from "./pages/Plotly";
import NoPage from "./pages/NoPage";
import { MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';

export default function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <BrowserRouter>
        <Routes>
          {/*<Route path="/" element={<Layout />}> */}
          <Route path="/">
            <Route index element={<Home />} />
            <Route path="test" element={<Plotly />} />
            {/*<Route path="blogs" element={<Blogs />} /> */}
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
