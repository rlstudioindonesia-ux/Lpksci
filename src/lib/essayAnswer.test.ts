import { describe, it, expect } from "vitest";
import { checkEssayAnswer } from "./essayAnswer";

describe("checkEssayAnswer", () => {
  it("accepts the key ignoring case, spaces and punctuation", () => {
    expect(checkEssayAnswer(" Watashi wa gakusei desu. ", "watashi wa gakusei desu")).toBe(true);
    expect(checkEssayAnswer("はい。", "はい")).toBe(true);
  });

  it("accepts any listed variant", () => {
    expect(checkEssayAnswer("taberu", "たべる / taberu")).toBe(true);
  });

  it("no longer accepts an answer that only contains the key", () => {
    expect(checkEssayAnswer("いいえ、はいではありません", "はい")).toBe(false);
    expect(checkEssayAnswer("taberu nomu iku", "taberu")).toBe(false);
  });

  it("tolerates one typo in long answers only", () => {
    expect(checkEssayAnswer("gakuseii", "gakusei")).toBe(true);
    expect(checkEssayAnswer("gakuse", "gakusei")).toBe(true);
    expect(checkEssayAnswer("gakxsxi", "gakusei")).toBe(false);
    expect(checkEssayAnswer("inu", "ina")).toBe(false);
  });

  it("rejects empty answers", () => {
    expect(checkEssayAnswer("", "はい")).toBe(false);
    expect(checkEssayAnswer("   ", "はい")).toBe(false);
  });
});
