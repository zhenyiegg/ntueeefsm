// Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
    const location = useLocation();
    const pathname = location.pathname;

    // Simple utility to replicate classnames logic (like `cn`)
    const cn = (...classes) => classes.filter(Boolean).join(" ");

    return (
        <nav className="navbar2">
            <div className="navbar-container">
                <div className="navbar-content">
                    {/* Logo/Home Link */}
                    <Link to="/" className="navbar-logo">
                        FSM
                    </Link>

                    {/* Navigation Links */}
                    <div className="navbar-links">
                        <Link
                            to="/circuit-to-state"
                            className={cn(
                                "navbar-link",
                                pathname === "/circuit-to-state" &&
                                    "navbar-active"
                            )}
                        >
                            Circuit → State
                        </Link>
                        <Link
                            to="/state-to-circuit"
                            className={cn(
                                "navbar-link",
                                pathname === "/state-to-circuit" &&
                                    "navbar-active"
                            )}
                        >
                            State → Circuit
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
