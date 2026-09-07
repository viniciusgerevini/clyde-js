import { describe, it, expect, vi, afterEach } from "vitest";

import * as serverModule from "./server";

import "./index";

vi.mock("./server.js", () => {
  return {
    startServer: vi.fn(),
  };
});

describe("Index", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ensures start server is called on import", () => {
    expect(vi.mocked(serverModule.startServer)).toHaveBeenCalled();
  });
});
