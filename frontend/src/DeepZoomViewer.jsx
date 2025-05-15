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
  const canvasRef = useRef(null);
  const osdViewer = useRef(null);
  const [selected, setSelected] = useState(tileSources[0]);

  // Build DeepZoom config
  const buildDzConfig = ({ name, width, height, tileSize = 4098, overlap = 1, format = 'jpg' }) => ({
    width,
    height,
    tileSize,
    tileOverlap: overlap,
    tileFormat: format,
    minLevel: 0,
    getTileUrl: (level, x, y) => `/tiles/${name}_files/${level}/${x}_${y}.${format}`
  });

  // Initialize OpenSeadragon + WebGL + WebXR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || osdViewer.current) return;

    // 1) Create high-performance WebGL2 context
    const gl = canvas.getContext('webgl2', {
      antialias:           false,
      depth:               false,
      stencil:             false,
      alpha:               false,
      powerPreference:     'high-performance',
      preserveDrawingBuffer: false
    });

    // 2) Optionally initialize WebXR session with foveated layer
    async function initXR() {
      if (navigator.xr) {
        try {
          const session = await navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['local-floor', 'layers']
          });

          const xrLayer = new XRWebGLLayer(session, gl, {
            antialias:      false,
            foveationLevel: 2,   // 0 = off, 1 = low, 2 = medium, 3 = high
            depthFormat:    'none'
          });

          await session.updateRenderState({ baseLayer: xrLayer });
          if (gl.makeXRCompatible) await gl.makeXRCompatible();
        } catch (e) {
          console.warn('WebXR init failed:', e);
        }
      }
    }
    initXR();

    // 3) Instantiate OpenSeadragon viewer on our canvas container
    osdViewer.current = OpenSeadragon({
      element:             canvas,
      prefixUrl:           '/openseadragon/images/',
      tileSources:         buildDzConfig(selected),
      // Navigator
        showNavigator:      true,
        navigatorSizeRatio: 0.2,
        navigatorPosition:  'TOP_RIGHT',

      // Performance tuning
      pixelRatio:          1,
      showNavigator:       false,
      immediateRender:     false,
      renderWhilePanning:  false,
      blendTime:           0,
      animationTime:       0.2,
      maxZoomPixelRatio:   1,
      visibilityRatio:     0.3,
      constrainDuringPan:  false,
      maxImageCacheCount:  50,
      minImageCacheCount:  10
    });

    return () => {
      osdViewer.current?.destroy();
      osdViewer.current = null;
    };
  }, [selected]);

  // When tile source changes, update viewer
  useEffect(() => {
    if (osdViewer.current) {
      osdViewer.current.open(buildDzConfig(selected));
    }
  }, [selected]);

  return (
    <div className="deepzoom-container">
      {/* Canvas for OpenSeadragon & WebGL/WebXR */}
      <canvas ref={canvasRef} className="deepzoom-viewer" />

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




 