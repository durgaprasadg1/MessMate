// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("leaflet/dist/leaflet.css", () => ({}));
const { default: LocationPicker } = await import("@/Component/Map/LocationPicker.jsx");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LocationPicker (OpenStreetMap)", () => {
  it("shows the OSM map with attribution and a hint when nothing is selected", () => {
    render(<LocationPicker value={null} onChange={() => {}} />);
    expect(document.querySelector(".leaflet-container")).not.toBeNull();
    expect(document.body.textContent).toContain("OpenStreetMap");
    expect(screen.getByText(/Click on the map/i)).toBeTruthy();
  });

  it("searches an address and saves the chosen coordinates (rounded)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "18.5204303", lon: "73.8567437", display_name: "Pune, Maharashtra, India" }],
    });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LocationPicker value={null} onChange={onChange} />);

    await user.type(screen.getByLabelText(/Search for the mess location/i), "Pune");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    const result = await screen.findByText("Pune, Maharashtra, India");
    expect(fetchMock.mock.calls[0][0]).toContain("https://nominatim.openstreetmap.org/search");
    await user.click(result);

    expect(onChange).toHaveBeenCalledWith({ lat: 18.52043, lon: 73.85674 });
  });

  it("asks for at least 3 characters and does not call the network", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<LocationPicker value={null} onChange={() => {}} />);
    await user.type(screen.getByLabelText(/Search for the mess location/i), "ab");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));
    expect(await screen.findByText(/at least 3 characters/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the selected coordinates and can clear them", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LocationPicker value={{ lat: 18.52043, lon: 73.85674 }} onChange={onChange} />);
    expect(screen.getByText("18.52043, 73.85674")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith({ lat: "", lon: "" });
  });

  it("survives a failed search with a friendly message", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(<LocationPicker value={null} onChange={() => {}} />);
    await user.type(screen.getByLabelText(/Search for the mess location/i), "Pune city");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));
    await waitFor(() => expect(screen.getByText(/unavailable/i)).toBeTruthy());
  });
});
