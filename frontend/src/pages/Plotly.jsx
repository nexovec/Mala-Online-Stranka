import Plot from "react-plotly.js";
import { useState } from "react";
import 'dayjs/locale/cs';
import { DatePicker } from "@mantine/dates";
import '@mantine/dates/styles.css';

const Plotly = () => {
  const [value, setValue] = useState([null, null]);

  return (
    <div>
      <Plot
        data={[
          {
            x: [1, 2, 3],
            y: [2, 6, 3],
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "red" },
          },
          { type: "bar", x: [1, 2, 3], y: [2, 5, 3] },
        ]}
        layout={{ width: 500, height: 240, title: "A Fancy Plot" }}
      />

      <DatePicker  value={value} onChange={setValue} locale="cs" />
    </div>
  ); 
};

export default Plotly;
