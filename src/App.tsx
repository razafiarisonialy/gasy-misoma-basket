import { BrowserRouter, Routes, Route } from "react-router-dom";
import ControlPage from "./pages/ControlPage";
import DisplayPage from "./pages/DisplayPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ControlPage />} />
        <Route path="/display" element={<DisplayPage />} />
      </Routes>
    </BrowserRouter>
  );
}
