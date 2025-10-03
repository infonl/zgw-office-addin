import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetZaak, type Zaak } from "./useGetZaak";
import { useHttp } from "./useHttp";
import { fromPartial } from "@total-typescript/shoehorn";

// Mock the useHttp hook
vi.mock("./useHttp", () => ({
  useHttp: vi.fn(),
}));

// Mock console methods to avoid noise in tests
vi.spyOn(console, "debug").mockImplementation(() => {});
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

describe("useGetZaak", () => {
  let queryClient: QueryClient;
  let mockGet: ReturnType<typeof vi.fn>;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockZaak = fromPartial<Zaak>({
    url: "https://api.example.com/zaken/123",
    identificatie: "ZAAK-001",
    bronorganisatie: "123456789",
    omschrijving: "Test zaak",
    toelichting: "Test toelichting",
    zaaktype: {
      url: "https://api.example.com/zaaktypen/1",
      omschrijving: "Test Zaaktype",
      catalogus: "https://api.example.com/catalogussen/1",
      versiedatum: "2025-01-01",
      concept: false,
      informatieobjecttypen: [],
    },
    status: {
      url: "https://api.example.com/statussen/1",
      statustype: "https://api.example.com/statustypen/1",
      zaak: "https://api.example.com/zaken/123",
      datumStatusGezet: "2025-01-15T10:00:00Z",
      statustoelichting: "In behandeling",
    },
    zaakinformatieobjecten: [
      {
        url: "https://api.example.com/zaakinformatieobjecten/1",
        zaak: "https://api.example.com/zaken/123",
        informatieobject: "https://api.example.com/documenten/1",
        vertrouwelijkheidaanduiding: "openbaar",
        omschrijving: "Test document",
      },
    ],
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockGet = vi.fn();
    vi.mocked(useHttp).mockReturnValue({
      GET: mockGet,
      POST: vi.fn(),
    });
    vi.clearAllMocks();
  });
  it("should be disabled when zaaknummer is null", () => {
    const { result } = renderHook(() => useGetZaak(null), {
      wrapper: createWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("should be disabled when zaaknummer is empty string", () => {
    const { result } = renderHook(() => useGetZaak(""), {
      wrapper: createWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("should fetch zaak when zaaknummer is provided", async () => {
    mockGet.mockResolvedValueOnce(mockZaak);

    const { result } = renderHook(() => useGetZaak("ZAAK-001"), {
      wrapper: createWrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(mockGet).toHaveBeenCalledWith("/zaken/ZAAK-001");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockZaak);
    expect(result.current.error).toBe(null);
  });

  it("should handle API errors", async () => {
    const apiError = new Error("API Error: 404 Not Found");
    mockGet.mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useGetZaak("NONEXISTENT"), {
      wrapper: createWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
    expect(result.current.data).toBeUndefined();
  });

  it("should use correct query key", () => {
    renderHook(() => useGetZaak("ZAAK-001"), {
      wrapper: createWrapper,
    });

    // The query key should be accessible through the query client
    const queries = queryClient.getQueryCache().getAll();
    expect(queries).toHaveLength(1);
    expect(queries[0].queryKey).toEqual(["zaak", "ZAAK-001"]);
  });

  it("should update when zaaknummer changes", async () => {
    mockGet.mockResolvedValue(mockZaak);

    const { result, rerender } = renderHook(({ zaaknummer }) => useGetZaak(zaaknummer), {
      wrapper: createWrapper,
      initialProps: { zaaknummer: "ZAAK-001" },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGet).toHaveBeenCalledWith("/zaken/ZAAK-001");

    // Change the zaaknummer
    rerender({ zaaknummer: "ZAAK-002" });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/zaken/ZAAK-002");
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("should not refetch when zaaknummer changes to null", async () => {
    mockGet.mockResolvedValue(mockZaak);

    const { result, rerender } = renderHook(({ zaaknummer }) => useGetZaak(zaaknummer), {
      wrapper: createWrapper,
      initialProps: { zaaknummer: "ZAAK-001" },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Change to null
    rerender({ zaaknummer: null as unknown as string });

    // Should not trigger another API call
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });
});
