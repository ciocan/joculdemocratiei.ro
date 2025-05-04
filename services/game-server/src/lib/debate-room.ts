import { DurableObject } from "cloudflare:workers";

import {
  type GamePlayer,
  type GameMessage,
  type UserProfile,
  type GamePhase,
  type RoundData,
  type WsStatePayload,
  type Vote,
  type BotPlayer,
  logger,
  computeScores,
  getRandomDebateTopic,
  getRandomMessagesForCandidate,
  CANDIDATE_MESSAGES_COUNT,
  candidateIdToSlugMap,
  LOBBY_COUNTDOWN_TIME,
  DEBATE_COUNTDOWN_TIME,
  NEXT_ROUND_COUNTDOWN_TIME,
  VOTE_COUNTDOWN_TIME,
  GLOBAL_BOT_CONFIG,
  createBotPlayer,
  selectBotDebateAnswer,
  determineBotVote,
  isBot,
} from "@joculdemocratiei/utils";

import type { Matchmaker } from "./matchmaker";
import type { GameBackendService } from "../../../game-backend/src";
import { getMatchmakerStub, validateToken } from "./util";

interface Env {
  GAME_BACKEND: Service<GameBackendService>;
  ENVIRONMENT: "dev" | "production" | "local";
  JWT_SECRET: string;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  DEBATE_ROOMS: DurableObjectNamespace<DebateRoom>;
  RATE_LIMITER: RateLimit;
}

export class DebateRoom extends DurableObject<Env> {
  connections: Map<WebSocket, UserProfile>;
  protected ctx: DurableObjectState;
  protected env: Env;

  private readonly ROOM_ID_KEY = "roomId";
  private readonly PLAYERS_KEY = "players";
  private readonly PHASE_KEY = "phase";
  private readonly COUNTDOWN_END_TIME_KEY = "countdownEndTime";
  private readonly CURRENT_ROUND_KEY = "currentRound";
  private readonly ROUNDS_DATA_KEY = "roundsData";
  private readonly CREATOR_ID_KEY = "creatorId";

  private roomId: string | undefined;
  private creatorId: string | undefined;
  private players: GamePlayer[] = [];
  private phase: GamePhase = "lobby";
  private countdownEndTime: number | undefined;
  private currentRound = 0;
  private roundsData: RoundData[] = [];
  private mm: DurableObjectStub<Matchmaker>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.connections = new Map();
    this.mm = getMatchmakerStub(this.env);

    this.loadState();

    const websockets = this.ctx.getWebSockets();

    for (const ws of websockets) {
      const user = ws.deserializeAttachment();
      this.connections.set(ws, user);
    }
  }

  private async initializeDebateData() {
    const debateTopic = getRandomDebateTopic();

    const currentRoundData = this.roundsData[this.currentRound] || {};
    currentRoundData.debateAnswers = {};
    currentRoundData.playerAnswers = {};
    currentRoundData.answerTexts = {};
    currentRoundData.playerVotes = {};
    currentRoundData.playerScores = {};
    currentRoundData.cumulativeScores = {};
    currentRoundData.debateTopic = debateTopic;
    currentRoundData.answerId = undefined;

    for (const player of this.players) {
      if (player.candidateId && debateTopic) {
        const messages = getRandomMessagesForCandidate({
          candidateSlug: candidateIdToSlugMap[player.candidateId],
          topicId: debateTopic.topicId,
          count: CANDIDATE_MESSAGES_COUNT,
        });

        currentRoundData.debateAnswers[player.playerId] = messages;
      }
    }

    this.roundsData[this.currentRound] = currentRoundData;

    this.countdownEndTime = Date.now() + DEBATE_COUNTDOWN_TIME;

    if (this.countdownEndTime) {
      this.ctx.storage.setAlarm(this.countdownEndTime);
    }

    await this.saveState();
  }

  private async loadState() {
    try {
      this.roomId = (await this.ctx.storage.get(this.ROOM_ID_KEY)) || undefined;
      this.players = (await this.ctx.storage.get(this.PLAYERS_KEY)) || [];
      this.phase = (await this.ctx.storage.get(this.PHASE_KEY)) || "lobby";
      this.countdownEndTime =
        (await this.ctx.storage.get(this.COUNTDOWN_END_TIME_KEY)) || undefined;
      this.creatorId = (await this.ctx.storage.get(this.CREATOR_ID_KEY)) || undefined;

      this.currentRound = (await this.ctx.storage.get(this.CURRENT_ROUND_KEY)) || 0;
      this.roundsData = (await this.ctx.storage.get(this.ROUNDS_DATA_KEY)) || [];
    } catch (error) {
      logger.error("[DebateRoom:loadState] Error loading state:", error);
    }
  }

  private async saveState() {
    try {
      await this.ctx.storage.put(this.ROOM_ID_KEY, this.roomId);
      await this.ctx.storage.put(this.PLAYERS_KEY, this.players);
      await this.ctx.storage.put(this.PHASE_KEY, this.phase);

      if (this.countdownEndTime) {
        await this.ctx.storage.put(this.COUNTDOWN_END_TIME_KEY, this.countdownEndTime);
      }
      await this.ctx.storage.put(this.CURRENT_ROUND_KEY, this.currentRound);

      if (this.roundsData.length > 0) {
        await this.ctx.storage.put(this.ROUNDS_DATA_KEY, this.roundsData);
      }

      if (this.creatorId) {
        await this.ctx.storage.put(this.CREATOR_ID_KEY, this.creatorId);
      }
    } catch (error) {
      logger.error("[DebateRoom:saveState] Error saving state:", error);
    }
  }

  async deleteRoom() {
    await this.env.GAME_BACKEND.deleteRoom(this.roomId!);
    await this.mm.updateAvailableRoomsCount();
    this.ctx.storage.deleteAlarm();
    this.connections.clear();
    await this.ctx.storage.deleteAll();
  }

  broadcast() {
    for (const [ws, _] of this.connections.entries()) {
      if (ws.readyState === 1) {
        const currentRoundData = this.roundsData[this.currentRound];

        // TODO: Only include debate answers for the current user
        // if (this.phase === "debate" && user.userId) {
        //   const player = this.players.find((p) => p.playerId === user.userId);
        //   if (player) {
        //     currentRoundData.debateAnswers = currentRoundData.debateAnswers[player.playerId] || [];
        //     // payload.debateAnswers = this.debateAnswers[player.playerId] || [];
        //   }
        // }

        if (this.phase === "voting") {
          const answerTexts: Record<string, string> = {};

          for (const [playerId, answerId] of Object.entries(currentRoundData.playerAnswers)) {
            const playerAnswers = currentRoundData.debateAnswers[playerId] || [];
            const answer = playerAnswers.find((a) => a.id === answerId);

            if (answer) {
              answerTexts[answerId] = answer.text;
            }
          }

          currentRoundData.answerTexts = answerTexts;
        }

        // TODO: For results phase, include player scores
        // if (this.phase === "results") {
        //   payload.playerScores = this.playerScores;
        // }

        const payload: WsStatePayload = {
          type: "state",
          players: this.players,
          phase: this.phase,
          countdownEndTime: this.countdownEndTime,
          currentRound: this.currentRound,
          roundsData: this.roundsData,
        };

        ws.send(JSON.stringify(payload));
      }
    }
  }

  async send(message: GameMessage, userId: string) {
    const parsedMessage = message;

    if (!parsedMessage) {
      return false;
    }

    const ws = this.ctx.getWebSockets().find((ws) => ws.deserializeAttachment()?.userId === userId);

    if (ws) {
      ws.send(JSON.stringify(parsedMessage));
      return true;
    }

    logger.error(`ERROR: DebateRoom:send:${userId}`, "WebSocket not found");
    return false;
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const playerId = this.connections.get(ws)?.userId;

    if (!playerId) {
      logger.error("[DebateRoom:webSocketMessage] playerId not provided");
      return;
    }

    const parsedMessage = JSON.parse(message);

    switch (parsedMessage.type) {
      case "connected": {
        this.mm.updateConnectionCount();
        break;
      }

      case "candidate": {
        const player = this.players.find((p) => p.playerId === playerId);
        if (player) {
          player.candidateId = parsedMessage.id;
          await this.saveState();
        }
        this.broadcast();
        break;
      }

      case "player_ready": {
        const player = this.players.find((p) => p.playerId === playerId);
        if (player) {
          player.isReady = parsedMessage.isReady;
          await this.saveState();

          const readyPlayers = this.players.filter((p) => p.isReady).length;
          const totalPlayers = this.players.length;

          if (readyPlayers >= totalPlayers / 2 && totalPlayers >= 2) {
            const now = Date.now();
            if (!this.countdownEndTime || this.countdownEndTime < now) {
              this.countdownEndTime = now + LOBBY_COUNTDOWN_TIME;
              await this.saveState();

              if (this.countdownEndTime) {
                this.ctx.storage.setAlarm(this.countdownEndTime);
              }

              // Check if we need to add more bots
              await this.checkAndAddBots();
            }
          }

          this.broadcast();
        }
        break;
      }

      case "debate_answer": {
        const currentRoundData = this.roundsData[this.currentRound];
        currentRoundData.playerAnswers[playerId] = parsedMessage.answerId;
        await this.saveState();

        this.broadcast();
        break;
      }

      case "vote": {
        const vote = parsedMessage.vote as Vote;
        const targetPlayerId = parsedMessage.targetPlayerId as string;

        const currentRoundData = this.roundsData[this.currentRound];
        if (!currentRoundData.playerVotes[playerId]) {
          currentRoundData.playerVotes[playerId] = {};
        }

        currentRoundData.playerVotes[playerId][targetPlayerId] = vote;
        await this.saveState();

        this.broadcast();
        break;
      }

      case "remove_player": {
        await this.removePlayer(playerId);

        if (this.players.length === 0) {
          await this.deleteRoom();
        }

        this.broadcast();
        break;
      }

      case "next_round": {
        if (this.phase === "results" && this.currentRound < 2) {
          this.countdownEndTime = Date.now() + NEXT_ROUND_COUNTDOWN_TIME;
          await this.saveState();
          if (this.countdownEndTime) {
            this.ctx.storage.setAlarm(this.countdownEndTime);
          }
          this.broadcast();
        } else {
          logger.debug(
            `[DebateRoom:webSocketMessage] Not advancing - conditions not met: phase=${this.phase}, currentRound=${this.currentRound}`,
          );
        }
        break;
      }

      default:
        logger.debug("[DebateRoom:webSocketMessage] Unknown message type:", parsedMessage.type);
        break;
    }
  }

  async webSocketClose(ws: WebSocket) {
    const playerId = this.connections.get(ws)?.userId;

    if (!playerId) {
      logger.error("[DebateRoom:webSocketClose] playerId not provided");
      return;
    }

    await this.removePlayer(playerId);
    this.mm.updateConnectionCount();
    this.broadcast();
    this.connections.delete(ws);
    ws.close();
  }

  async webSocketError(_: WebSocket, error: Error) {
    logger.error("[DebateRoom:webSocketError] error", error);
  }

  async addPlayer(user: UserProfile) {
    if (!this.roomId) {
      logger.error("[DebateRoom:addPlayer] roomId not provided");
      return;
    }

    const { userId, firstName, lastName, county, countyCode, city } = user;
    const name = `${firstName} ${lastName}`;

    const existingPlayerIndex = this.players.findIndex((p) => p.playerId === userId);

    if (existingPlayerIndex >= 0) {
      if (this.players[existingPlayerIndex].name !== name) {
        this.players[existingPlayerIndex].name = name;
        await this.saveState();
      }
      return;
    }

    this.players.push({
      playerId: userId,
      name,
      county,
      countyCode,
      city,
    });
    await this.saveState();
    await this.env.GAME_BACKEND.addSeat(this.roomId);

    // Check if we need to add bots
    await this.checkAndAddBots();
  }

  /**
   * Adds a bot player to the room
   */
  private async addBotPlayer() {
    if (!this.roomId) {
      logger.error("[DebateRoom:addBotPlayer] roomId not provided");
      return;
    }

    const bot = createBotPlayer();
    this.players.push(bot);
    await this.saveState();
    await this.env.GAME_BACKEND.addSeat(this.roomId);

    logger.debug(`[DebateRoom:addBotPlayer] Added bot ${bot.name} to room ${this.roomId}`);
    return bot;
  }

  /**
   * Checks if bots should be added to the room and adds them if needed
   */
  private async checkAndAddBots() {
    if (!GLOBAL_BOT_CONFIG.enabled) {
      return;
    }

    // Count real players (non-bots)
    const realPlayers = this.players.filter((player) => !isBot(player.playerId));

    // If we have enough real players, don't add bots
    if (realPlayers.length >= GLOBAL_BOT_CONFIG.minRealPlayers + 1) {
      return;
    }

    // Calculate how many bots to add
    const currentBots = this.players.filter((player) => isBot(player.playerId));
    const totalDesiredPlayers = Math.max(3, realPlayers.length + 2); // At least 3 players total

    const botsToAdd = Math.min(
      GLOBAL_BOT_CONFIG.maxBotsPerRoom - currentBots.length,
      totalDesiredPlayers - realPlayers.length - currentBots.length,
    );

    // Add bots
    for (let i = 0; i < botsToAdd; i++) {
      await this.addBotPlayer();
    }

    // Make bots ready
    for (const player of this.players) {
      if (isBot(player.playerId) && !player.isReady) {
        player.isReady = true;
      }
    }

    await this.saveState();
    this.broadcast();
  }

  /**
   * Handles bot actions during the debate phase
   */
  private async handleBotDebateActions() {
    const currentRoundData = this.roundsData[this.currentRound];

    if (!currentRoundData) {
      return;
    }

    // Get all bots that haven't answered yet
    const botsToAct = this.players.filter(
      (p) => isBot(p.playerId) && !currentRoundData.playerAnswers[p.playerId],
    );

    // If no bots need to act, return early
    if (botsToAct.length === 0) {
      return;
    }

    // Create staggered timeouts for each bot
    for (const botPlayer of botsToAct) {
      // Get available answers for this bot
      const botAnswers = currentRoundData.debateAnswers[botPlayer.playerId] || [];
      if (botAnswers.length === 0) {
        continue;
      }

      // Generate a random delay for this specific bot
      const botDelay =
        Math.floor(Math.random() * GLOBAL_BOT_CONFIG.actionDelayRange[1]) +
        GLOBAL_BOT_CONFIG.actionDelayRange[0];

      // Create a timeout for this bot's action
      setTimeout(async () => {
        // Select an answer based on bot's risk tolerance
        const typedBotPlayer = botPlayer as BotPlayer;
        const answerId = selectBotDebateAnswer(typedBotPlayer, botAnswers);

        // Record the bot's answer
        if (answerId) {
          currentRoundData.playerAnswers[botPlayer.playerId] = answerId;
          logger.debug(
            `[DebateRoom:handleBotDebateActions] Bot ${botPlayer.name} selected answer ${answerId} after ${botDelay}ms delay`,
          );

          // Save and broadcast after each individual bot action
          await this.saveState();
          this.broadcast();
        }
      }, botDelay);
    }
  }

  /**
   * Handles bot actions during the voting phase
   */
  private async handleBotVotingActions() {
    const currentRoundData = this.roundsData[this.currentRound];
    if (!currentRoundData) {
      return;
    }

    // Get all bots that need to vote
    const botPlayers = this.players.filter((player) => isBot(player.playerId));

    // If no bots need to vote, return early
    if (botPlayers.length === 0) {
      return;
    }

    // For each bot, create a staggered timeout for its voting actions
    for (const botPlayer of botPlayers) {
      // Generate a random delay for this specific bot
      const botDelay =
        Math.floor(Math.random() * GLOBAL_BOT_CONFIG.actionDelayRange[1]) +
        GLOBAL_BOT_CONFIG.actionDelayRange[0];

      // Create a timeout for this bot's voting actions
      setTimeout(async () => {
        // Find players this bot hasn't voted for yet
        const playersToVoteFor = this.players.filter((targetPlayer) => {
          // Skip voting for self
          if (targetPlayer.playerId === botPlayer.playerId) {
            return false;
          }

          // Skip if already voted for this player
          if (
            currentRoundData.playerVotes[botPlayer.playerId] &&
            currentRoundData.playerVotes[botPlayer.playerId][targetPlayer.playerId]
          ) {
            return false;
          }

          // Skip if target player didn't submit an answer
          if (!currentRoundData.playerAnswers[targetPlayer.playerId]) {
            return false;
          }

          return true;
        });

        // If no one to vote for, skip this bot
        if (playersToVoteFor.length === 0) {
          return;
        }

        // Choose one random player to vote for in this action
        // This makes voting appear more natural (one at a time)
        const targetPlayer = playersToVoteFor[Math.floor(Math.random() * playersToVoteFor.length)];

        // Determine vote based on bot's personality and target's candidate
        const typedBotPlayer = botPlayer as BotPlayer;
        const vote = determineBotVote(
          typedBotPlayer,
          targetPlayer.playerId,
          targetPlayer.candidateId,
          this.players,
        );

        // Record the bot's vote
        if (!currentRoundData.playerVotes[botPlayer.playerId]) {
          currentRoundData.playerVotes[botPlayer.playerId] = {};
        }

        currentRoundData.playerVotes[botPlayer.playerId][targetPlayer.playerId] = vote;
        logger.debug(
          `[DebateRoom:handleBotVotingActions] Bot ${botPlayer.name} voted ${vote} for ${targetPlayer.name} after ${botDelay}ms delay`,
        );

        // Save and broadcast after each individual bot vote
        await this.saveState();
        this.broadcast();

        // If there are more players to vote for, schedule another voting action
        // This ensures bots continue voting for other players with additional delays
        if (playersToVoteFor.length > 1) {
          // Schedule the next voting action with a shorter delay
          const nextDelay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
          setTimeout(() => this.handleBotVotingActions(), nextDelay);
        }
      }, botDelay);
    }
  }

  async removePlayer(playerId: string) {
    if (!this.roomId) {
      logger.error("[DebateRoom:removePlayer] roomId not provided");
      return;
    }

    const initialLength = this.players.length;
    this.players = this.players.filter((p) => p.playerId !== playerId);

    if (this.players.length !== initialLength) {
      await this.saveState();
      await this.env.GAME_BACKEND.removeSeat(this.roomId);
    } else {
      logger.error(`[DebateRoom:removePlayer] Player ${playerId} not found in room ${this.roomId}`);
    }
  }

  async changePhase(newPhase: GamePhase) {
    if (!this.roomId) {
      logger.error("[DebateRoom:changePhase] roomId not provided");
      return;
    }

    if (this.phase === newPhase) {
      return;
    }

    if (this.phase === "lobby" && newPhase !== "lobby") {
      this.countdownEndTime = undefined;
    }

    if (newPhase === "debate") {
      await this.initializeDebateData();
      if (this.currentRound === 0) {
        await this.env.GAME_BACKEND.updateGameStarted(this.roomId, true);
      }

      await this.handleBotDebateActions();
    }

    if (newPhase === "voting") {
      this.countdownEndTime =
        Date.now() + (this.players.length <= 3 ? VOTE_COUNTDOWN_TIME / 2 : VOTE_COUNTDOWN_TIME);
      if (this.countdownEndTime) {
        this.ctx.storage.setAlarm(this.countdownEndTime);
      }

      await this.handleBotVotingActions();
    }

    if (newPhase === "results") {
      const currentRoundData = this.roundsData[this.currentRound];
      const gameState = {
        players: this.players.map((player) => ({
          playerId: player.playerId,
          name: player.name,
          candidateId: player.candidateId || "",
        })),
        playerVotes: currentRoundData.playerVotes,
      };

      currentRoundData.playerScores = computeScores(gameState);

      currentRoundData.cumulativeScores = {};

      for (const [playerId, scores] of Object.entries(currentRoundData.playerScores)) {
        currentRoundData.cumulativeScores[playerId] = { ...scores };
      }

      for (let i = 0; i < this.currentRound; i++) {
        const roundData = this.roundsData[i];
        if (roundData?.playerScores) {
          for (const [playerId, scores] of Object.entries(roundData.playerScores)) {
            if (!currentRoundData.cumulativeScores[playerId]) {
              currentRoundData.cumulativeScores[playerId] = { ...scores };
            } else {
              currentRoundData.cumulativeScores[playerId].influence += scores.influence;
              currentRoundData.cumulativeScores[playerId].empathy += scores.empathy;
              currentRoundData.cumulativeScores[playerId].harmony += scores.harmony;
            }
          }
        }
      }

      await this.archiveRoundData();

      if (this.currentRound === 2) {
        this.countdownEndTime = Date.now() + NEXT_ROUND_COUNTDOWN_TIME;
        if (this.countdownEndTime) {
          this.ctx.storage.setAlarm(this.countdownEndTime);
        }
      }
    }

    this.phase = newPhase;
    await this.saveState();
    this.broadcast();
  }

  private async archiveRoundData() {
    try {
      if (!this.roomId) {
        logger.error("[DebateRoom:archiveRoundData] roomId not provided");
        return;
      }

      const currentRoundData = this.roundsData[this.currentRound];
      if (!currentRoundData) {
        logger.error("[DebateRoom:archiveRoundData] No round data found for current round");
        return;
      }

      const existingRound = await this.env.GAME_BACKEND.getRoundData(
        this.roomId,
        this.currentRound,
      );

      if (existingRound) {
        return;
      }

      await this.env.GAME_BACKEND.archiveRoundData({
        roomId: this.roomId,
        userId: this.creatorId || "system",
        roundNumber: this.currentRound,
        data: currentRoundData,
        createdAt: new Date(),
      });

      for (const player of this.players) {
        const playerId = player.playerId;
        const playerName = player.name;
        const candidateId = player.candidateId || "unknown";

        const roundScores = currentRoundData.playerScores[playerId] || {
          influence: 0,
          empathy: 0,
          harmony: 0,
        };
        const cumulativeScores = currentRoundData.cumulativeScores[playerId] || {
          influence: 0,
          empathy: 0,
          harmony: 0,
        };

        const roundTotalScore = roundScores.influence + roundScores.empathy + roundScores.harmony;
        const cumulativeTotalScore =
          cumulativeScores.influence + cumulativeScores.empathy + cumulativeScores.harmony;

        const playerAnswerId = currentRoundData.playerAnswers[playerId];
        const playerAnswer = playerAnswerId ? currentRoundData.answerTexts[playerAnswerId] : null;

        let agreeVotes = 0;
        let neutralVotes = 0;
        let disagreeVotes = 0;

        for (const voterId in currentRoundData.playerVotes) {
          if (currentRoundData.playerVotes[voterId][playerId]) {
            const vote = currentRoundData.playerVotes[voterId][playerId];
            if (vote === "agree") {
              agreeVotes++;
            } else if (vote === "neutral") {
              neutralVotes++;
            } else if (vote === "disagree") {
              disagreeVotes++;
            }
          }
        }

        this.env.GAME_BACKEND.addLeaderboardData({
          indexes: [
            `round:${playerId}`, // Combined index: event type and playerId
          ],
          doubles: [
            roundScores.influence, // double1: Influence Score
            roundScores.empathy, // double2: Empathy Score
            roundScores.harmony, // double3: Harmony Score
            roundTotalScore, // double4: Total Score
            agreeVotes, // double5: Agree Votes
            neutralVotes, // double6: Neutral Votes
            disagreeVotes, // double7: Disagree Votes
          ],
          blobs: [
            this.roomId || "room-id-not-provided", // blob1: Room ID
            playerId, // blob2: Player ID
            playerName, // blob3: Player Name
            playerAnswerId ?? "", // blob4: Player's Answer Id
            candidateId, // blob5: Candidate ID
            this.currentRound.toString(), // blob6: Round Number
            playerAnswer ?? "", // blob7: Player's Answer
            currentRoundData.debateTopic.topicId || "", // blob8: Debate Topic ID
            currentRoundData.debateTopic.question || "", // blob9: Debate Question
            player.city, // blob10: Player's City
            player.county, // blob11: Player's County
            player.countyCode, // blob12: Player's County Code
          ],
        });

        this.env.GAME_BACKEND.addLeaderboardData({
          indexes: [
            `cumulative:${playerId}`, // Combined index: event type and playerId
          ],
          doubles: [
            cumulativeScores.influence, // double1: Cumulative Influence Score
            cumulativeScores.empathy, // double2: Cumulative Empathy Score
            cumulativeScores.harmony, // double3: Cumulative Harmony Score
            cumulativeTotalScore, // double4: Cumulative Total Score
            agreeVotes, // double5: Agree Votes
            neutralVotes, // double6: Neutral Votes
            disagreeVotes, // double7: Disagree Votes
          ],
          blobs: [
            this.roomId || "room-id-not-provided", // blob1: Room ID
            playerId, // blob2: Player ID
            playerName, // blob3: Player Name
            candidateId, // blob4: Candidate ID
            this.currentRound.toString(), // blob5: Round Number
            currentRoundData.debateTopic.topicId || "", // blob6: Debate Topic ID
            currentRoundData.debateTopic.question || "", // blob7: Debate Question
            player.city, // blob8: Player's City
            player.county, // blob9: Player's County
            player.countyCode, // blob10: Player's County Code
          ],
        });
      }
    } catch (error) {
      logger.error("[DebateRoom:archiveRoundData] Error archiving round data:", error);
    }
  }

  async alarm() {
    if (this.phase === "lobby") {
      await this.changePhase("debate");
    } else if (this.phase === "debate") {
      await this.changePhase("voting");
    } else if (this.phase === "voting") {
      await this.changePhase("results");
    } else if (this.phase === "results") {
      if (this.currentRound < 2) {
        await this.archiveRoundData();

        this.currentRound += 1;

        for (const player of this.players) {
          player.isReady = false;
        }

        await this.changePhase("debate");
        await this.saveState();
        this.broadcast();
      } else if (this.currentRound === 2) {
        const currentRoundData = this.roundsData[this.currentRound];

        const playerRankings = this.players
          .map((player) => {
            const playerId = player.playerId;
            const cumulativeScores = currentRoundData.cumulativeScores[playerId] || {
              influence: 0,
              empathy: 0,
              harmony: 0,
            };
            const totalScore =
              cumulativeScores.influence + cumulativeScores.empathy + cumulativeScores.harmony;

            return {
              playerId,
              playerName: player.name,
              city: player.city,
              county: player.county,
              countyCode: player.countyCode,
              candidateId: player.candidateId || "unknown",
              totalScore,
              influence: cumulativeScores.influence,
              empathy: cumulativeScores.empathy,
              harmony: cumulativeScores.harmony,
            };
          })
          .sort((a, b) => b.totalScore - a.totalScore);

        for (let i = 0; i < playerRankings.length; i++) {
          const player = playerRankings[i];
          const rank = i + 1;

          this.env.GAME_BACKEND.addLeaderboardData({
            indexes: [
              `final:${player.playerId}`, // Combined index: event type and playerId
            ],
            doubles: [
              player.influence, // double1: Final Influence Score
              player.empathy, // double2: Final Empathy Score
              player.harmony, // double3: Final Harmony Score
              player.totalScore, // double4: Final Total Score
              this.players.length, // double5: Total Players in Game
            ],
            blobs: [
              this.roomId || "room-id-not-provided", // blob1: Room ID
              player.playerId, // blob2: Player ID
              player.playerName, // blob3: Player Name
              player.candidateId, // blob4: Candidate ID
              rank.toString(), // blob5: Final Rank
              player.city, // blob6: Player's City
              player.county, // blob7: Player's County
              player.countyCode, // blob8: Player's County Code
            ],
          });
        }

        this.env.GAME_BACKEND.addLeaderboardData({
          indexes: [
            "game_summary:global", // Combined index: event type and a global identifier
          ],
          doubles: [
            this.currentRound + 1, // double1: Total Rounds
            Date.now(), // Timestamp
          ],
          blobs: [
            this.roomId || "room-id-not-provided", // blob1: Room ID
            this.players.length.toString(), // blob2: Number of Players
            this.creatorId || "system", // blob3: Game Creator
          ],
        });

        await this.archiveRoundData();

        await this.saveState();
        this.deleteRoom();
      }
    }
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const pathRoomId = url.pathname.split("/").pop();

    // Handle WebSocket connections
    const token = url.searchParams.get("token");

    if (!this.roomId && pathRoomId) {
      this.roomId = pathRoomId;
      await this.saveState();
    }

    if (!this.roomId) {
      return new Response("Room ID not provided", { status: 400 });
    }

    if (!token) {
      return new Response("Token not provided", { status: 400 });
    }

    const user = await validateToken(token, this.env);

    if (!user) {
      return new Response("User not found", { status: 400 });
    }

    if (!this.creatorId) {
      this.creatorId = user.userId;
      await this.saveState();
    }

    if (!this.players.find((p) => p.playerId === user.userId)) {
      await this.addPlayer(user);
    }

    try {
      const websocketPair = new WebSocketPair();
      const [client, server] = Object.values(websocketPair);

      this.ctx.acceptWebSocket(server);
      server.serializeAttachment(user);
      this.connections.set(server, user);
      this.broadcast();

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    } catch (error) {
      logger.error("[DebateRoom:fetch] WebSocket setup error:", error);
      return new Response("WebSocket setup failed", { status: 500 });
    }
  }
}
