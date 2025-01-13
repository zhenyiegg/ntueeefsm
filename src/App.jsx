/* App.jsx */
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./styles/App.css"; // Navbar and basic styles
import CircuitToState from "./routes/CircuitToState";
import StateToCircuit from "./routes/StateToCircuit";
import HomePage from "./routes/Homepage.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
    return (
        <Router>
            {/* Navbar */}
            <Navbar />
            {/* Routes */}
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/circuit-to-state" element={<CircuitToState />} />
                <Route path="/state-to-circuit" element={<StateToCircuit />} />
            </Routes>
        </Router>
    );
}

export default App;
