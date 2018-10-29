import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import Map from "./Map";
import registerServiceWorker from "./registerServiceWorker";

ReactDOM.render(<Map />, document.getElementById("root") as HTMLElement);
registerServiceWorker();
