import { describe, it, expect } from "vitest";
import { getEmbeddablePdfUrl } from "./storageHelper";

describe("getEmbeddablePdfUrl", () => {
  it("returns an empty string for a missing url", () => {
    expect(getEmbeddablePdfUrl(null)).toBe("");
    expect(getEmbeddablePdfUrl(undefined)).toBe("");
  });

  it("converts a Google Slides link to its native embed endpoint", () => {
    const url = "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/edit?usp=sharing";
    expect(getEmbeddablePdfUrl(url)).toBe("https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/embed");
  });

  it("converts a Google Docs link to its native preview endpoint", () => {
    const url = "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/edit";
    expect(getEmbeddablePdfUrl(url)).toBe("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/preview");
  });

  it("converts a Google Sheets link to its native preview endpoint", () => {
    const url = "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/edit#gid=0";
    expect(getEmbeddablePdfUrl(url)).toBe("https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/preview");
  });

  it("converts a Google Drive /file/d/ link to its preview endpoint", () => {
    const url = "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing";
    expect(getEmbeddablePdfUrl(url)).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
  });

  it("converts the classic Drive '?id=' sharing link format to its preview endpoint", () => {
    // Regression case: this format (e.g. from an older "Get Link" share
    // dialog) used to fall straight through to the fragile gview proxy
    // instead of Drive's own, more reliable preview embed.
    const url = "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp";
    expect(getEmbeddablePdfUrl(url)).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
  });

  it("does not touch an unrelated URL just because it has an id= query param", () => {
    const url = "https://example.com/materi.pdf?id=abc123";
    expect(getEmbeddablePdfUrl(url)).toBe(url);
  });

  it("converts a data URL to a blob URL", () => {
    const result = getEmbeddablePdfUrl("data:application/pdf;base64,JVBERi0xLjQ=");
    expect(result.startsWith("blob:") || result.startsWith("data:")).toBe(true);
  });

  it("passes a blob URL through unchanged", () => {
    const url = "blob:http://localhost/abc-123";
    expect(getEmbeddablePdfUrl(url)).toBe(url);
  });

  it("routes a non-Google URL through the gview proxy only when forced", () => {
    const url = "https://example.com/materi.pdf";
    expect(getEmbeddablePdfUrl(url, false)).toBe(url);
    expect(getEmbeddablePdfUrl(url, true)).toBe(
      `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`,
    );
  });

  it("does not double-wrap a URL that's already a gview embed", () => {
    const url = "https://docs.google.com/gview?url=https%3A%2F%2Fexample.com%2Fa.pdf&embedded=true";
    expect(getEmbeddablePdfUrl(url, true)).toBe(url);
  });
});
