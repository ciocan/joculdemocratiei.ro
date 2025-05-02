import type { topicResponses } from "./research-data/candidate-responses";

export const debateTopics = [
  {
    topicId: "economy",
    topic: "Economie",
    question:
      "Cum veți relansa creșterea economică și crea locuri de muncă, menținând în același timp sustenabilitatea finanțelor publice?",
  },
  {
    topicId: "education",
    topic: "Educație",
    question:
      "Care sunt primele măsuri prin care veți ridica nivelul educației și veți micșora decalajul urban-rural?",
  },
  {
    topicId: "diplomacy",
    topic: "Diplomație",
    question:
      "Cum veți consolida relațiile cu vecinii României într-un context regional tensionat?",
  },
  {
    topicId: "corruption",
    topic: "Corupție",
    question:
      "Enumerați trei reforme prioritare prin care veți combate corupția și veți întări statul de drept.",
  },
  {
    topicId: "healthcare",
    topic: "Sănătate",
    question: "Ce planuri aveți pentru sistemul de sănătate?",
  },
] as const as DebateTopic[];

export function getRandomDebateTopic() {
  return debateTopics[Math.floor(Math.random() * debateTopics.length)];
}

export type DebateTopic = {
  topicId: TopicId;
  topic: string;
  question: string;
};

export type TopicResponse = (typeof topicResponses)[keyof typeof topicResponses];
export type TopicId = keyof typeof topicResponses;
