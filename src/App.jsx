/* App.jsx */
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./styles/App.css"; // Navbar and basic styles
import CircuitToState from "./routes/CircuitToState";
import StateToCircuit from "./routes/StateToCircuit";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons"; // FontAwesome Arrow

function App() {
    return (
        <Router>
            {/* Navbar */}
            <nav className="navbar">
                <Link
                    to="/state-to-circuit"
                    className="nav-btn state-to-circuit"
                >
                    State Diagram <FontAwesomeIcon icon={faArrowRight} />{" "}
                    Circuit
                </Link>
                <Link
                    to="/circuit-to-state"
                    className="nav-btn circuit-to-state"
                >
                    Circuit <FontAwesomeIcon icon={faArrowRight} /> State
                    Diagram
                </Link>
            </nav>

            {/* Routes */}
            <Routes>
                <Route path="/circuit-to-state" element={<CircuitToState />} />
                <Route path="/state-to-circuit" element={<StateToCircuit />} />
            </Routes>
        </Router>
    );
}

export default App;
