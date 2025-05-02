import { describe, it, expect } from "vitest";
import { getRandomMessagesForCandidate } from "./candidate-responses";

describe("getRandomMessagesForCandidate", () => {
  it("should return messages with correct ID format", () => {
    const result = getRandomMessagesForCandidate({
      candidateSlug: "simion",
      topicId: "education",
      count: 3,
    });

    expect(result.length).toBe(3);
    result.forEach((msg, index) => {
      expect(msg.id).toBe(`simion-education-${index + 1}`);
    });
  });

  it("should return all messages when count is greater than available messages", () => {
    const result = getRandomMessagesForCandidate({
      candidateSlug: "simion",
      topicId: "education",
      count: 10,
    });

    expect(result.length).toBeLessThanOrEqual(10);
    expect(
      result.every(
        (msg, index) =>
          msg.id === `simion-education-${index + 1}` &&
          typeof msg.text === "string" &&
          typeof msg.isRisky === "boolean" &&
          (msg.source === undefined || typeof msg.source === "string"),
      ),
    ).toBe(true);
  });

  it("should return exactly the requested number of messages when available", () => {
    const result = getRandomMessagesForCandidate({
      candidateSlug: "simion",
      topicId: "education",
      count: 2,
    });

    expect(result.length).toBe(2);
    result.forEach((msg, index) => {
      expect(msg.id).toBe(`simion-education-${index + 1}`);
    });
  });

  it("should return messages in random order but with sequential IDs", () => {
    const result1 = getRandomMessagesForCandidate({
      candidateSlug: "simion",
      topicId: "education",
      count: 3,
    });

    const result2 = getRandomMessagesForCandidate({
      candidateSlug: "simion",
      topicId: "education",
      count: 3,
    });

    expect(result1.map((msg) => msg.text)).not.toEqual(result2.map((msg) => msg.text));

    result1.forEach((msg, index) => {
      expect(msg.id).toBe(`simion-education-${index + 1}`);
    });
    result2.forEach((msg, index) => {
      expect(msg.id).toBe(`simion-education-${index + 1}`);
    });
  });

  it("should work with different topics and candidates", () => {
    const result = getRandomMessagesForCandidate({
      candidateSlug: "simion",
      topicId: "economy",
      count: 2,
    });

    expect(result.length).toBe(2);
    result.forEach((msg, index) => {
      expect(msg.id).toBe(`simion-economy-${index + 1}`);
    });
  });
});
