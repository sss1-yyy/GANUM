import { describe, expect, it } from "vitest";
import { MBTI_RESULTS, codesOfType } from "../results";
import { MOCK_QUESTIONS, optionScore, typeCode } from "./questionnaire";

/** 문항마다 같은 순번(0~3)의 선택지를 골랐을 때 4글자 유형 */
function codeWhenAllPick(optionIndex: number) {
  const sums = { IE: 0, SN: 0, TF: 0, JP: 0 };
  for (const question of MOCK_QUESTIONS) {
    const scored = optionScore(question.id, question.options[optionIndex]!.id)!;
    sums[scored.axis] += scored.score;
  }
  return typeCode(sums);
}

describe("진단 채점 (정기회의6 기준)", () => {
  it("선택지 점수는 위에서부터 +2, +1, -1, -2", () => {
    const q1 = MOCK_QUESTIONS[0]!;
    expect(q1.options.map((o) => optionScore(q1.id, o.id)?.score)).toEqual([2, 1, -1, -2]);
  });

  it("모두 첫 번째를 고르면 ISTJ(신중형), 모두 마지막이면 ENFP(도전형)", () => {
    expect(codeWhenAllPick(0)).toBe("ISTJ");
    expect(MBTI_RESULTS.ISTJ.type).toBe("CAUTIOUS");
    expect(codeWhenAllPick(3)).toBe("ENFP");
    expect(MBTI_RESULTS.ENFP.type).toBe("BOLD");
  });

  it("16유형이 캐릭터마다 4개씩 (정기회의6 묶음)", () => {
    expect(codesOfType("CAUTIOUS")).toEqual(["ISTJ", "ISTP", "INTJ", "INTP"]);
    expect(codesOfType("BALANCED")).toEqual(["ISFJ", "INFJ", "ESTJ", "ENTJ"]);
    expect(codesOfType("FREE")).toEqual(["ISFP", "INFP", "ESTP", "ENTP"]);
    expect(codesOfType("BOLD")).toEqual(["ESFJ", "ESFP", "ENFJ", "ENFP"]);
  });

  it("축 합이 0 이면 앞 글자(I·S·T·J)", () => {
    expect(typeCode({ IE: 0, SN: 0, TF: 0, JP: 0 })).toBe("ISTJ");
    expect(typeCode({ IE: -1, SN: 2, TF: -3, JP: 1 })).toBe("ESFJ");
  });

  it("없는 문항·선택지는 null", () => {
    expect(optionScore("q99", "q99_o1")).toBeNull();
    expect(optionScore("q1", "q1_o9")).toBeNull();
  });
});
