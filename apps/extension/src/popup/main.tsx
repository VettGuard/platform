import { createRoot } from "react-dom/client"
import { Popup } from "./popup"
import "./popup.css"

const container = document.getElementById("root")
if (!container) throw new Error("missing #root")
createRoot(container).render(<Popup />)
