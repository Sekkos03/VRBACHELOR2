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
    tileSize = 4098,
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

  // force down your render resolution to 1× device pixels
  // (Quest defaults to something like 1.5–2× which doubles/triples your workload)
  pixelRatio:    1,

  // navigator
  showNavigator:      false,    // turn it off in VR to free up textures

  // throttle rendering passes
  immediateRender:    false,    // wait until you have a full tile, don’t draw “in‐between” intermediates
  renderWhilePanning: false,    // only render once the pan/gesture ends
  blendTime:          0,        // no cross‐fade between levels
  animationTime:      0.2,      // make zoom/pan snappier (so you don’t drag through a hundred frames)
  
  // avoid oversampling
  maxZoomPixelRatio:  1,        // never load a tile at more than 100% of its native res

  // load a tighter window around the viewport
  visibilityRatio:    0.3,      // only grab tiles that are really on‐screen

  // cache fewer tiles so you don’t thrash Quest memory
  maxImageCacheCount:  50,
  minImageCacheCount:  10,
  
  // keep the rest of your defaults
  constrainDuringPan:  false,
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
