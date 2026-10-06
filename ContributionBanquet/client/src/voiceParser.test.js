import { describe, expect, it } from "vitest";
import {
  applyVoiceInput,
  parseVoiceField,
  parseVoiceInput,
} from "./voiceParser.js";

describe("parseVoiceInput", () => {
  it("parses contributor name and native place from spoken text", () => {
    const result = parseVoiceInput("contributor name is Monica native place is Salem amount is 2000");

    expect(result.name).toBe("Monica");
    expect(result.city).toBe("Salem");
    expect(result.amount).toBe("2000");
  });

  it("keeps place and name separate when spoken in one sentence", () => {
    const result = parseVoiceInput("name is Ramesh native place is Tiruchengode amount is 5000");

    expect(result.name).toBe("Ramesh");
    expect(result.city).toBe("Tiruchengode");
    expect(result.amount).toBe("5000");
  });

  it("parses Tamil labels with English names and places", () => {
    const result = parseVoiceInput("பங்களிப்பாளர் பெயர் Monica, சொந்த ஊர் Salem, தொகை 2000");

    expect(result.name).toBe("Monica");
    expect(result.city).toBe("Salem");
    expect(result.amount).toBe("2000");
  });

  it("parses Tamil labels and Tamil-script names and places", () => {
    const result = parseVoiceInput("பெயர் ரமேஷ் சொந்த ஊர் சேலம் தொகை 2000");

    expect(result.name).toBe("ரமேஷ்");
    expect(result.city).toBe("சேலம்");
    expect(result.amount).toBe("2000");
  });

  it("parses a natural sentence without explicit name and amount labels", () => {
    const result = parseVoiceInput("Bhuvaneswari from Tiruchengode 2500");

    expect(result.name).toBe("Bhuvaneswari");
    expect(result.city).toBe("Tiruchengode");
    expect(result.amount).toBe("2500");
  });

  it("parses a spoken introduction and a place with punctuation", () => {
    const result = parseVoiceInput("I am Monica, from Salem, 2000.");

    expect(result.name).toBe("Monica");
    expect(result.city).toBe("Salem");
    expect(result.amount).toBe("2000");
  });

  it("accepts arbitrary names and places when a field is selected", () => {
    expect(parseVoiceField("name", "Kavitha Rajendran")).toBe("Kavitha Rajendran");
    expect(parseVoiceField("city", "Vellakoil")).toBe("Vellakoil");
    expect(parseVoiceField("amount", "2500 rupees")).toBe("2500");
  });

  it("fills every recognized field even when one input is focused", () => {
    const result = applyVoiceInput(
      { name: "", city: "", amount: "" },
      "name is Bhuvaneswari native place is Erode amount is 2500",
      "name"
    );

    expect(result).toEqual({ name: "Bhuvaneswari", city: "Erode", amount: "2500" });
  });

  it("puts a single spoken value into the focused field", () => {
    const result = applyVoiceInput(
      { name: "", city: "", amount: "" },
      "Vellakoil",
      "city"
    );

    expect(result.city).toBe("Vellakoil");
  });

  it("assigns unlabeled comma-separated speech by name, place, and amount order", () => {
    const result = parseVoiceInput("Bhuvaneswari, Tirupattur, 5000");

    expect(result).toEqual({
      name: "Bhuvaneswari",
      city: "Tirupattur",
      amount: "5000",
    });
  });

  it("assigns unlabeled speech without commas when the place is recognizable", () => {
    const result = parseVoiceInput("Bhuvaneswari Tirupattur 5000");

    expect(result).toEqual({
      name: "Bhuvaneswari",
      city: "Tirupattur",
      amount: "5000",
    });
  });

  it("keeps Indian-style comma-grouped amounts together", () => {
    const result = parseVoiceInput("Bhuvaneswari, Thoothukudi, 1,80000");

    expect(result.amount).toBe("180000");
  });

  it("converts a spoken lakh amount with a remaining amount", () => {
    const result = parseVoiceInput("Kavya Thoothukudi 1 lakh 80000");

    expect(result.amount).toBe("180000");
  });

  it("handles speech-result separators inside a grouped amount", () => {
    expect(parseVoiceInput("Bhuvaneswari, Thoothukudi, 1, 80000").amount).toBe("180000");
    expect(parseVoiceInput("Kavya, Thoothukudi, 1 lakh, 80000").amount).toBe("180000");
  });

  it("parses natural Indian-English speech with my name and native place", () => {
    const result = parseVoiceInput("my name is Siva from Salem amount is 3500");

    expect(result.name).toBe("Siva");
    expect(result.city).toBe("Salem");
    expect(result.amount).toBe("3500");
  });

  it("parses speech that says contributor and native place before the amount", () => {
    const result = parseVoiceInput("contributor name is Arul native place is Tirupattur amount 10000");

    expect(result.name).toBe("Arul");
    expect(result.city).toBe("Tirupattur");
    expect(result.amount).toBe("10000");
  });

  it("converts spoken amount words into numbers for voice input", () => {
    const result = parseVoiceInput("my name is Siva from Salem amount is three thousand five hundred");

    expect(result.name).toBe("Siva");
    expect(result.city).toBe("Salem");
    expect(result.amount).toBe("3500");
  });

  it("keeps single-letter initials at the start of names when spoken", () => {
    const result = parseVoiceInput("M Selvi native place is Chennai amount is 5000");

    expect(result.name).toBe("M Selvi");
    expect(result.city).toBe("Chennai");
    expect(result.amount).toBe("5000");
  });

  it("recognizes crore amounts even when spoken as one word and in different field order", () => {
    const result = parseVoiceInput("amount is 1crore name is Santhosh Vijayalakshmi place is Chennai street one");

    expect(result.name).toBe("Santhosh Vijayalakshmi");
    expect(result.city).toBe("Chennai street one");
    expect(result.amount).toBe("10000000");
  });

  it("accepts spoken field order variations with name, place, and amount in any order", () => {
    const result = parseVoiceInput("name is Santhosh Vijayalakshmi amount is 1 crore place is Chennai");

    expect(result.name).toBe("Santhosh Vijayalakshmi");
    expect(result.city).toBe("Chennai");
    expect(result.amount).toBe("10000000");
  });
});
