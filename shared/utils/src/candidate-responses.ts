import type { CandidateSlug } from "./candidates";
import type { GameMessage } from "./types/game";
import type { TopicId } from "./debate-topics";

import { topicResponses } from "./research-data/candidate-responses";

export function getRandomMessagesForCandidate({
  candidateSlug,
  topicId,
  count = 3,
}: {
  candidateSlug: CandidateSlug;
  topicId: TopicId;
  count?: number;
}): GameMessage[] {
  const topicData = topicResponses[topicId];
  const candidateMessages = topicData[candidateSlug] || [];
  if (candidateMessages.length <= count) {
    return candidateMessages.map((msg, index) => ({
      id: `${candidateSlug}-${topicId}-${index + 1}`,
      text: msg.quote,
      isRisky: msg.isRisky,
      source: msg.source,
    }));
  }

  return [...candidateMessages]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((msg, index) => ({
      id: `${candidateSlug}-${topicId}-${index + 1}`,
      text: msg.quote,
      isRisky: msg.isRisky,
      source: msg.source,
    }));
}
