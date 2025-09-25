"use client";

import { useState, useEffect, useCallback } from "react";

const SCRIPT_ID = "google-maps-script";
let scriptLoading = false;
let scriptLoaded = false;
let scriptError: string | null = null;
const listeners: ((status: {
  loaded: boolean;
  error: string | null;
}) => void)[] = [];

const loadGoogleMapsScript = (apiKey: string) => {
  if (scriptLoaded) {
    return;
  }

  if (scriptLoading) {
    return;
  }

  // Check if script already exists
  const existingScript = document.getElementById(SCRIPT_ID);
  if (existingScript) {
    scriptLoaded = true;
    scriptError = null;
    listeners.forEach((listener) => listener({ loaded: true, error: null }));
    return;
  }

  scriptLoading = true;
  scriptError = null;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
  script.async = true;
  script.defer = true;

  // Add timeout for script loading
  const timeoutId = setTimeout(() => {
    if (scriptLoading) {
      scriptLoading = false;
      scriptError = "Script loading timeout";
      listeners.forEach((listener) =>
        listener({ loaded: false, error: scriptError })
      );
    }
  }, 30000); // 30 second timeout

  script.onload = () => {
    clearTimeout(timeoutId);
    scriptLoading = false;
    scriptLoaded = true;
    scriptError = null;

    // Verify Google Maps is actually available
    if (window.google?.maps) {
      listeners.forEach((listener) => listener({ loaded: true, error: null }));
    } else {
      scriptError = "Google Maps failed to initialize properly";
      listeners.forEach((listener) =>
        listener({ loaded: false, error: scriptError })
      );
    }
  };

  script.onerror = () => {
    clearTimeout(timeoutId);
    scriptLoading = false;
    scriptLoaded = false;
    scriptError = "Failed to load Google Maps script";
    listeners.forEach((listener) =>
      listener({ loaded: false, error: scriptError })
    );
  };

  // Handle script load errors
  script.onabort = () => {
    clearTimeout(timeoutId);
    scriptLoading = false;
    scriptLoaded = false;
    scriptError = "Google Maps script loading was aborted";
    listeners.forEach((listener) =>
      listener({ loaded: false, error: scriptError })
    );
  };

  document.head.appendChild(script);
};

export const useGoogleMaps = () => {
  const [status, setStatus] = useState({
    loaded: scriptLoaded,
    error: scriptError,
  });

  const retry = useCallback(() => {
    // Reset global state
    scriptLoaded = false;
    scriptError = null;
    scriptLoading = false;

    // Remove existing script
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

    // Reset local state
    setStatus({ loaded: false, error: null });

    // Reload script
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY || "";
    if (apiKey) {
      loadGoogleMapsScript(apiKey);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded) {
      setStatus({ loaded: true, error: null });
      return;
    }

    // Support multiple env var names commonly used for the Google Maps API key
    const apiKey =
      process.env.NEXT_PUBLIC_MAPS_API_KEY ||
      (process.env as any).NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "";

    if (!apiKey) {
      setStatus({ loaded: false, error: "Google Maps API key is missing." });
      return;
    }

    const listener = (newStatus: { loaded: boolean; error: string | null }) => {
      setStatus(newStatus);
    };

    listeners.push(listener);
    loadGoogleMapsScript(apiKey);

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return { ...status, retry };
};
