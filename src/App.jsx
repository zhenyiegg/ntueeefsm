// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./styles/App.css";
import StateToCircuit from "./routes/StateToCircuit";
import CircuitToState from "./routes/CircuitToState";

function App() {
    return (
        <Router>
            <div className="App">
                <header className="App-header">
                    <nav className="navbar">
                        <Link to="/state-to-circuit">
                            <button className="nav-button">
                                State diagram ➡️ Circuit
                            </button>
                        </Link>
                        <Link to="/circuit-to-state">
                            <button className="nav-button">
                                Circuit ➡️ State diagram
                            </button>
                        </Link>
                    </nav>
                </header>
                <main>
                    <Routes>
                        <Route
                            path="/state-to-circuit"
                            element={<StateToCircuit />}
                        />
                        <Route
                            path="/circuit-to-state"
                            element={<CircuitToState />}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
