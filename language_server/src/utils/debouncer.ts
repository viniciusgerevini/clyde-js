export function debounce(callable: Function, waitTime: number): Function {
  let timeoutId: any;
  return function (...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callable(args);
    }, waitTime);
  };
}
