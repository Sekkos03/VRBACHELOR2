import React, { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import './DeepZoomViewer.css';

// Base sample identifiers and their sizes (in pixels).
const tileSources = [
  { name: 'deepzoom2', width: 120940, height: 87898 },
  { name: 'deepzoom3', width: 149233, height: 51097 },
  { name: 'deepzoom4', width: 120742, height: 30124 },
  { name: 'deepzoom5', width: 187024, height: 80181 }
].map(s => ({
  ...s,
  thumbnail: `/tiles/${s.name}_files/12/0_0.jpg`
}));

export default function DeepZoomViewer() {
  const viewerRef = useRef(null);
  const osdViewer = useRef(null);
  const [selected, setSelected] = useState(tileSources[0]);

  // Helper to build inline DeepZoom config
  // ↓ Lowered tileSize from 4098 → 1024 for faster, smaller uploads
  const buildDzConfig = ({
    name,
    width,
    height,
    tileSize = 8194,
    overlap = 1,
    format = 'jpg'
  }) => ({
    width,
    height,
    tileSize,
    tileOverlap: overlap,
    tileFormat: format,
    minLevel: 0,
    getTileUrl: (level, x, y) =>
      `/tiles/${name}_files/${level}/${x}_${y}.${format}`
  });

  // (OPTIONAL) Remove this entire effect if you no longer need to
  // forcibly free textures every frame—it was causing major slowdowns.
  /*
  useEffect(() => {
    if (OpenSeadragon?.WebGLDrawer) {
      const WebGLDrawer = OpenSeadragon.WebGLDrawer;
      const origDraw = WebGLDrawer.prototype.draw;
      WebGLDrawer.prototype.draw = function() {
        origDraw.apply(this, arguments);
        // …texture/context cleanup…
      };
    }
  }, []);
  */

  // Initialize OpenSeadragon once with inline dzConfig + tuned render options
  useEffect(() => {
    if (viewerRef.current && !osdViewer.current) {
      osdViewer.current = OpenSeadragon({
        element:       viewerRef.current,
        prefixUrl:     '/openseadragon/images/',
        tileSources:   buildDzConfig(selected),

        // Navigator
        showNavigator:      true,
        navigatorSizeRatio: 0.2,
        navigatorPosition:  'TOP_RIGHT',

        // 🔥 Performance tuning
        immediateRender:    true,    // draw intermediate tiles instantly
        renderWhilePanning: true,    // keep rendering during pan
        blendTime:          0.1,     // quick fade between zoom levels
        animationTime:      0.5,     // pan/zoom “fling” speed
        maxZoomPixelRatio:  2,       // don’t oversample past 200%
        visibilityRatio:    0.6,     // tile edge-buffer
        constrainDuringPan: false,   // allow “free” panning feel

        // 🗃 Cache more tiles to avoid thrashing
        maxImageCacheCount: 200,
        minImageCacheCount: 50,
      });
    }

    // Cleanup on unmount to free all GL resources
    return () => {
      if (osdViewer.current) {
        osdViewer.current.destroy();
        osdViewer.current = null;
      }
    };
  }, [selected]);

  // When user clicks a thumbnail, just `.open()` the new source
  useEffect(() => {
    if (osdViewer.current) {
      osdViewer.current.open(buildDzConfig(selected));
    }
  }, [selected]);

  return (
    <div className="deepzoom-container">
      {/* Main Deep Zoom panel */}
      <div id="openseadragon1" ref={viewerRef} className="deepzoom-viewer" />

      {/* Thumbnails */}
      <div className="thumbnails">
        {tileSources.map(source => (
          <img
            key={source.name}
            src={source.thumbnail}
            alt={source.name}
            className={`thumb ${source.name === selected.name ? 'active' : ''}`}
            onClick={() => setSelected(source)}
          />
        ))}
      </div>

      {/* Patient Information */}
      <div className="patient-info">
        <h2>Patient Information</h2>
        <div className="date">
          {new Date().toLocaleDateString('no-NO', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    </div>
  );
}
