import { useEffect, useRef } from 'react';

/**
 * useLiquidGL - Ultra-smooth, non-blocking Liquid Glass manager.
 * Safely integrates liquidGL WebGPU/WebGL optical shaders without blocking
 * pointer events, causing frame drops, or interfering with DOM stacking contexts.
 *
 * @param {string|React.RefObject} target - CSS selector or Ref for the target element.
 * @param {Object} options - Configuration overrides for liquidGL.
 * @param {Array} deps - Dependency list for updates.
 */
export function useLiquidGL(target, options = {}, deps = []) {
  const instanceRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    // Use requestIdleCallback or a gentle timer so UI is fully interactive immediately
    const scheduleInit = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (fn) => window.requestIdleCallback(fn, { timeout: 300 })
      : (fn) => setTimeout(fn, 100);

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

        // Ensure target and children have proper pointer-events and z-index isolation
        targetEl.style.position = targetEl.style.position || 'relative';

        // Dynamically load liquid-gl without delaying initial page paint
        const liquidGLModule = await import('liquid-gl');
        const liquidGL = liquidGLModule.default || liquidGLModule;

        if (!liquidGL || isCancelled) return;

        const isDark = document.documentElement.classList.contains('dark');
        const defaultTint = isDark
          ? 'rgba(12, 14, 20, 0.35)'
          : 'rgba(255, 255, 255, 0.20)';

        const config = {
          target: typeof selector === 'string' ? selector : targetEl,
          snapshot: 'body',
          engine: 'auto',
          resolution: 1.5, // 1.5 is crisp and prevents GPU fill-rate stutter
          refraction: 0.012,
          aberration: 0.1,
          bevelDepth: 0.04,
          bevelWidth: 0.08,
          frost: 1.0,
          shadow: false, // Avoid duplicate drop shadows on complex components
          specular: true,
          tilt: false, // Disabled on interactive controls to prevent transform stacking context bugs
          reveal: 'none',
          interaction: 'none', // Prevents mouse event hijacking on text and buttons
          tint: options.tint || defaultTint,
          content: false,
          ...options
        };

        const instance = liquidGL(config);
        instanceRef.current = instance;

        // Ensure any canvas created by liquidGL has pointer-events: none
        if (targetEl) {
          const canvases = targetEl.querySelectorAll('canvas');
          canvases.forEach(c => {
            c.style.pointerEvents = 'none';
          });
        }
      } catch (err) {
        // Graceful silent fallback to CSS glassmorphism
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
  }, deps);

  return instanceRef;
}

export default useLiquidGL;
