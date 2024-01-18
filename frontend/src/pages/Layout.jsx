import { Outlet, Link } from "react-router-dom";
import "./style/Layout.css";
import { IconMessageCircle2 } from "@tabler/icons-react";

const Layout = () => {
  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/plotly">Plotly</Link>
          </li>
        </ul>
      </nav>

      <div className="chaticon-container">
        <IconMessageCircle2 className="chaticon" size={40}/>
      </div>

      <Outlet />
    </>
  );
};

export default Layout;
