import { describe, it, vi, beforeEach, Mock, expect, afterEach } from 'vitest'
import { debounce } from './debouncer';

describe("Debouncer", () => {
  let methodToDebounce: Mock;

  beforeEach(() => {
    methodToDebounce = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("triggers debounced method after period", () => {
    vi.useFakeTimers();
    const debounced = debounce(methodToDebounce, 300);

    debounced();

    expect(methodToDebounce).not.toHaveBeenCalled();

    vi.advanceTimersByTime(301);

    expect(methodToDebounce).toHaveBeenCalledOnce();
  });

  it("debounces calls", () => {
    vi.useFakeTimers();
    const debounced = debounce(methodToDebounce, 300);

    debounced();
    debounced();
    debounced();
    debounced();
    debounced();

    expect(methodToDebounce).not.toHaveBeenCalled();

    vi.advanceTimersByTime(301);

    expect(methodToDebounce).toHaveBeenCalledOnce();
  });

  it("respects debounce time", () => {
    vi.useFakeTimers();
    const debounced = debounce(methodToDebounce, 1000);

    debounced();

    expect(methodToDebounce).not.toHaveBeenCalled();

    vi.advanceTimersByTime(301);

    expect(methodToDebounce).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1001);

    expect(methodToDebounce).toHaveBeenCalledOnce();
  });
});
