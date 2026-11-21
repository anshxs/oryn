import { useEffect, useRef } from 'react';
import liquidGL from 'liquid-gl';

/**
 * useLiquidGL - React hook to apply Apple-style Liquid Glass (WebGPU/WebGL) shaders
 * to any DOM element or selector.
 *
 * @param {string|React.RefObject} target - CSS selector or React Ref for the target element.
 * @param {Object} options - Configuration overrides for liquidGL.
 * @param {Array} deps - Dependency list to re-capture or update tints (e.g. [theme]).
 */
export function useLiquidGL(target, options = {}, deps = []) {
  const instanceRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    // Small delay to ensure DOM layout and theme styles are painted
    const timer = setTimeout(() => {
      if (isCancelled) return;

      try {
        const selector = typeof target === 'string' 
          ? target 
          : (target?.current ? target.current : null);

        if (!selector) return;

        // If target was passed as an element ref, generate or use its selector/id
        let targetQuery = selector;
        if (typeof selector !== 'string' && selector instanceof HTMLElement) {
          if (!selector.id) {
            selector.id = `liquid-lens-${Math.random().toString(36).substring(2, 9)}`;
          }
          targetQuery = `#${selector.id}`;
        }

        const isDark = document.documentElement.classList.contains('dark');
        const defaultTint = isDark
          ? 'rgba(12, 14, 20, 0.42)'
          : 'rgba(255, 255, 255, 0.22)';

        const config = {
          target: targetQuery,
          snapshot: 'body',
          engine: 'auto',
          resolution: 2.0,
          refraction: 0.014,
          aberration: 0.12,
          bevelDepth: 0.05,
          bevelWidth: 0.1,
          frost: 1.5,
          shadow: true,
          specular: true,
          tilt: false,
          tiltFactor: 3.5,
          reveal: 'none',
          interaction: 'fluid',
          interactionStrength: 0.4,
          interactionRadius: 0.3,
          interactionViscosity: 0.5,
          tint: options.tint || defaultTint,
          content: false,
          ...options
        };

        const instance = liquidGL(config);
        instanceRef.current = instance;

        // Request background snapshot recapture to account for theme changes
        if (window.__liquidGLRenderer__?.captureSnapshot) {
          window.__liquidGLRenderer__.captureSnapshot();
        }
      } catch (err) {
        console.warn('[liquidGL] Notice: Glass shader fallback to CSS backdrop filter:', err.message);
      }
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (instanceRef.current) {
        try {
          if (typeof instanceRef.current.destroy === 'function') {
            instanceRef.current.destroy();
          }
        } catch (_) {}
        instanceRef.current = null;
      }
    };
  }, deps);

  return instanceRef;
}

export default useLiquidGL;
