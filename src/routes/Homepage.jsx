import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Homepage.css"; // Import your CSS file

export default function HomePage() {
    const navigate = useNavigate();

    const handleAnyClick = () => {
        const paths = ["/circuit-to-state", "/state-to-circuit"];
        const randomPath = paths[Math.floor(Math.random() * paths.length)];
        navigate(randomPath);
    };

    return (
        <div className="zoom-container">
            <div className="page-container">
                <div className="title-container">
                    <h1 className="main-title">Finite State Machines</h1>
                </div>

                <div className="divider-container">
                    <div className="divider"></div>
                    <div className="divider"></div>
                    <div className="divider"></div>
                </div>

                <div className="buttons-container">
                    <button
                        className="custom-button"
                        onClick={() => navigate("/circuit-to-state")}
                    >
                        Circuit to State Diagram
                    </button>

                    <button
                        className="custom-button"
                        onClick={() => navigate("/state-to-circuit")}
                    >
                        State to Circuit Diagram
                    </button>

                    <button className="custom-button" onClick={handleAnyClick}>
                        Any
                    </button>
                </div>
            </div>
        </div>
    );
}
