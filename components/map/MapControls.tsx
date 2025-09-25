"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Layers,
  Sun,
  Moon,
  Compass,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";

interface MapControlsProps {
  onLocationClick: () => void;
  onThemeChange: (theme: "light" | "dark" | "satellite") => void;
  on3DToggle: (enabled: boolean) => void;
  onResetView: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  currentTheme: "light" | "dark" | "satellite";
  is3DEnabled: boolean;
}

const themes = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "satellite", icon: Eye, label: "Satellite" },
];

export function MapControls({
  onLocationClick,
  onThemeChange,
  on3DToggle,
  onResetView,
  onFullscreen,
  isFullscreen,
  currentTheme,
  is3DEnabled,
}: MapControlsProps) {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [show3DControls, setShow3DControls] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-50 space-y-3">
      {/* Location Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={onLocationClick}
        className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:bg-blue-50"
      >
        <Navigation className="w-5 h-5 text-blue-600" />
      </motion.button>

      {/* Theme Picker */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowThemePicker(!showThemePicker)}
          className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:bg-purple-50"
        >
          <Layers className="w-5 h-5 text-purple-600" />
        </motion.button>

        <AnimatePresence>
          {showThemePicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute top-16 left-0 bg-white rounded-xl shadow-2xl p-3 border border-gray-200 w-32"
            >
              {themes.map(({ key, icon: Icon, label }) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onThemeChange(key as "light" | "dark" | "satellite");
                    setShowThemePicker(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    currentTheme === key
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Toggle */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShow3DControls(!show3DControls)}
          className={`w-12 h-12 rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 ${
            is3DEnabled
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Compass className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {show3DControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute top-16 left-0 bg-white rounded-xl shadow-2xl p-3 border border-gray-200 w-40"
            >
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    on3DToggle(!is3DEnabled);
                    setShow3DControls(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors ${
                    is3DEnabled
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {is3DEnabled ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>{is3DEnabled ? "Disable 3D" : "Enable 3D"}</span>
                </motion.button>

                {is3DEnabled && (
                  <motion.button
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onResetView();
                      setShow3DControls(false);
                    }}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg text-sm hover:bg-gray-100 text-gray-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset View</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Toggle */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={onFullscreen}
        className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:bg-green-50"
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-green-600" />
        ) : (
          <Maximize2 className="w-5 h-5 text-green-600" />
        )}
      </motion.button>

      {/* Settings */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:bg-gray-50"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </motion.button>
    </div>
  );
}






