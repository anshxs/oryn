import { useEffect, useRef } from 'react';

/**
 * useLiquidGL - Ultra-smooth Liquid Glass manager powered by WebGPU/WebGL.
 * Dedicated to LIGHT MODE to create stunning liquid optics, refractive glass,
 * and specular highlights.
 * In DARK MODE, liquidGL is safely deactivated so the app seamlessly renders
 * pure, ultra-clean, high-contrast shadcn-ui components without GPU overhead.
 *
 * @param {string|React.RefObject} target - CSS selector or Ref for the target element.
 * @param {Object} options - Configuration overrides for liquidGL.
 * @param {Array} deps - Dependency list for updates.
 */
export function useLiquidGL(target, options = {}, deps = []) {
  const instanceRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    // Check theme: Only activate liquidGL in LIGHT MODE as requested
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    if (isDark) {
      if (instanceRef.current) {
        try {
          if (typeof instanceRef.current.destroy === 'function') {
            instanceRef.current.destroy();
          }
        } catch (_) {}
        instanceRef.current = null;
      }
      return;
    }

    // Schedule initialization gently without blocking the initial paint
    const scheduleInit = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (fn) => window.requestIdleCallback(fn, { timeout: 350 })
      : (fn) => setTimeout(fn, 120);

    const cancelInit = typeof window !== 'undefined' && 'cancelIdleCallback' in window
      ? (id) => window.cancelIdleCallback(id)
      : (id) => clearTimeout(id);

    const handle = scheduleInit(async () => {
      if (isCancelled) return;

      try {
        const selector = typeof target === 'string' 
          ? target 
          : (target?.current ? target.current : null);

        if (!selector) return;

        let targetEl = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!targetEl) return;

        targetEl.style.position = targetEl.style.position || 'relative';

        // Dynamically load liquid-gl
        const liquidGLModule = await import('liquid-gl');
        const liquidGL = liquidGLModule.default || liquidGLModule;

        if (!liquidGL || isCancelled) return;

        // Verify still in light mode
        if (document.documentElement.classList.contains('dark')) return;

        const config = {
          target: typeof selector === 'string' ? selector : targetEl,
          snapshot: 'body',
          engine: 'auto',
          resolution: 1.5,
          refraction: 0.016,
          aberration: 0.12,
          bevelDepth: 0.06,
          bevelWidth: 0.1,
          frost: 1.0,
          shadow: false,
          specular: true,
          tilt: false,
          reveal: 'none',
          interaction: 'none',
          tint: options.tint || 'rgba(255, 255, 255, 0.28)',
          content: false,
          ...options
        };

        const instance = liquidGL(config);
        instanceRef.current = instance;

        // Ensure canvas never intercepts pointer events
        if (targetEl) {
          const canvases = targetEl.querySelectorAll('canvas');
          canvases.forEach(c => {
            c.style.pointerEvents = 'none';
            c.style.position = 'absolute';
            c.style.zIndex = '0';
          });
        }
      } catch (err) {
        // Silent graceful fallback to CSS backdrop-filter glassmorphism
      }
    });

    return () => {
      isCancelled = true;
      cancelInit(handle);
      if (instanceRef.current) {
        try {
          if (typeof instanceRef.current.destroy === 'function') {
            instanceRef.current.destroy();
          }
        } catch (_) {}
        instanceRef.current = null;
      }
    };
  }, [deps]);

  return instanceRef;
}

export default useLiquidGL;
