import { describe, it, expect } from "vitest";
import { validateUpload, detectFileType, IMAGE_TYPES, CERTIFICATE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/server/security/uploadValidator.js";

const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const pdf = Buffer.from("%PDF-1.7\n" + "x".repeat(40));
const file = (buf, type, name = "a.png") => new File([buf], name, { type });

describe("validateUpload", () => {
  it("accepts a real PNG and gives it a random name", async () => {
    const res = await validateUpload(file(png, "image/png", "../../evil.php"), { allowed: IMAGE_TYPES });
    expect(res.mime).toBe("image/png");
    expect(res.safeName).toMatch(/^[a-f0-9]{32}\.png$/);
  });
  it("rejects a script renamed to .png (magic bytes)", async () => {
    await expect(validateUpload(file(Buffer.from("<?php echo 1;"), "image/png"), { allowed: IMAGE_TYPES })).rejects.toMatchObject({ status: 400 });
  });
  it("rejects when declared type disagrees with content", async () => {
    await expect(validateUpload(file(jpg, "image/png"), { allowed: IMAGE_TYPES })).rejects.toMatchObject({ status: 400 });
  });
  it("rejects PDFs where only images are allowed", async () => {
    await expect(validateUpload(file(pdf, "application/pdf"), { allowed: IMAGE_TYPES })).rejects.toMatchObject({ status: 400 });
    expect((await validateUpload(file(pdf, "application/pdf", "c.pdf"), { allowed: CERTIFICATE_TYPES })).ext).toBe("pdf");
  });
  it("rejects oversized files", async () => {
    const big = Buffer.concat([png, Buffer.alloc(MAX_UPLOAD_BYTES)]);
    await expect(validateUpload(file(big, "image/png"), { allowed: IMAGE_TYPES })).rejects.toMatchObject({ status: 413 });
  });
  it("rejects missing / empty files", async () => {
    await expect(validateUpload(null, { allowed: IMAGE_TYPES })).rejects.toMatchObject({ status: 400 });
    await expect(validateUpload("text", { allowed: IMAGE_TYPES })).rejects.toMatchObject({ status: 400 });
    await expect(validateUpload(file(Buffer.alloc(0), "image/png"), { allowed: IMAGE_TYPES })).rejects.toMatchObject({ status: 400 });
  });
  it("detects types", () => {
    expect(detectFileType(png).mime).toBe("image/png");
    expect(detectFileType(Buffer.from("hello"))).toBeNull();
  });
});
