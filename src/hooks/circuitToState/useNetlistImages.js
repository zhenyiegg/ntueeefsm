import { useCallback, useRef, useState } from "react";
import axios from "axios";

const useNetlistImages = () => {
  const [netlistImages, setNetlistImages] = useState([]);
  const [fetchImagesCompleted, setFetchImagesCompleted] = useState(false);

  const isFetchingImagesRef = useRef(false);
  const fetchIdRef = useRef(0); // Track fetch sessions

  const fetchImagesFromNetlists = useCallback(async (equations) => {
    isFetchingImagesRef.current = true;
    setFetchImagesCompleted(false);

    const thisFetchId = ++fetchIdRef.current; // New session ID

    // Step 1: Initialize with empty images
    const initialResults = equations.map(({ label }) => ({
      label,
      image: undefined,
    }));

    setNetlistImages(initialResults); // Triggers loading spinners
    let results = [...initialResults];

    for (let i = 0; i < equations.length; i++) {
      const { label, netlist } = equations[i];

      try {
        if (!Array.isArray(netlist) || netlist.length === 0) {
          throw new Error("Netlist is invalid or empty");
        }

        console.log("Sending netlist for:", label);
        console.log(
          "Sending this netlist to backend:",
          JSON.stringify(netlist, null, 2),
        );

        //console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);

        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/external-call/generate-screenshot`,
          netlist, // just the array, not wrapped
          {
            headers: { "Content-Type": "application/json" },
            responseType: "arraybuffer", // expect binary image data
          },
        );

        if (response.status !== 200) {
          throw new Error(`API returned status ${response.status}`);
        }

        const base64Image = `data:image/png;base64,${btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        )}`;

        if (fetchIdRef.current !== thisFetchId) return; // cancel outdated

        // Step 2: Update specific item in results
        results[i] = { label, image: base64Image };
        setNetlistImages([...results]); // update state incrementally
      } catch (error) {
        console.error(`Error generating image for "${label}":`, error);
        results[i] = { label, image: null }; // Show error fallback
        setNetlistImages([...results]);
      }
    }

    if (fetchIdRef.current === thisFetchId) {
      isFetchingImagesRef.current = false;
      setFetchImagesCompleted(true); // always mark complete
    }
  }, []);

  return {
    netlistImages,
    fetchImagesCompleted,
    isFetchingImagesRef,
    fetchImagesFromNetlists,
  };
};

export default useNetlistImages;
