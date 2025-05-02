import { candidateResponses as corruption } from "./corruption";
import { candidateResponses as economy } from "./economy";
import { candidateResponses as education } from "./education";
import { candidateResponses as diplomacy } from "./diplomacy";
import { candidateResponses as healthcare } from "./healthcare";

export const topicResponses = {
  corruption,
  economy,
  education,
  diplomacy,
  healthcare,
} as const;
