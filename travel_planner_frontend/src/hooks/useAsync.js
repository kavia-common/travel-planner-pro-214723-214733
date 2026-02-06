import { useCallback, useEffect, useRef, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * A standardized async runner hook for loading/error/value.
 */
export function useAsync(asyncFn, deps = [], options = {}) {
  /**
   * @param {Function} asyncFn async function returning a value
   */
  const { immediate = false } = options;

  const [status, setStatus] = useState("idle"); // idle | pending | success | error
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  // Prevent setting state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...args) => {
    setStatus("pending");
    setError(null);
    try {
      const result = await asyncFn(...args);
      if (mountedRef.current) {
        setValue(result);
        setStatus("success");
      }
      return result;
    } catch (e) {
      if (mountedRef.current) {
        setError(e);
        setStatus("error");
      }
      throw e;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) {
      run();
    }
  }, [immediate, run]);

  return { run, status, value, error, setValue };
}
