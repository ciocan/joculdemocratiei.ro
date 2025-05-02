import { sql, type InferSelectModel } from "drizzle-orm";
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";

import { createId } from "./utils";
import type { RoundData } from "./types/game";

export const userProfileTable = table(
  "user_profile",
  {
    userId: t.text("user_id").primaryKey(),
    firstName: t.text("first_name").notNull(),
    lastName: t.text("last_name").notNull(),
    city: t.text("city").notNull(),
    county: t.text("county").notNull(),
    countyCode: t.text("county_code").notNull().default(""),
    lat: t.real("lat").notNull().default(0),
    lon: t.real("lon").notNull().default(0),
    secretKey: t.text("secret_key").notNull(),
    createdAt: t.integer("created_at").default(sql`(strftime('%s','now'))`),
  },
  (table) => [
    t.uniqueIndex("user_profile_user_id").on(table.userId),
    t.index("user_profile_city").on(table.city),
    t.index("user_profile_county").on(table.county),
    t.index("user_profile_created_at").on(table.createdAt),
    t.index("user_profile_county_code").on(table.countyCode),
  ],
);

export type UserProfileTable = InferSelectModel<typeof userProfileTable>;
export const gameHistoryTable = table(
  "game_history",
  {
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: t.text("user_id").notNull(),
    roomId: t.text("room_id").notNull(),
    roundNumber: t.integer("round_number").notNull(),
    data: t.text("data", { mode: "json" }).$type<RoundData>().notNull(),
    createdAt: t.integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    t.uniqueIndex("game_history_id").on(table.id),
    t.uniqueIndex("game_history_room_round").on(table.roomId, table.roundNumber),
    t.index("game_history_user_id").on(table.userId),
    t.index("game_history_room_id").on(table.roomId),
    t.index("game_history_room_id_created_at").on(table.createdAt),
  ],
);

export type GameHistoryTable = InferSelectModel<typeof gameHistoryTable>;

export const roomsTable = table(
  "rooms",
  {
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: t.text("user_id").notNull(),
    seats: t.integer("seats").notNull(),
    isPrivate: t.integer("is_private", { mode: "boolean" }).notNull().default(false),
    isStarted: t.integer("is_started", { mode: "boolean" }).notNull(),
    createdAt: t.integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    t.uniqueIndex("rooms_id").on(table.id),
    t.index("rooms_user_id").on(table.userId),
    t.index("rooms_is_started").on(table.isStarted),
    t.index("rooms_seats").on(table.seats),
  ],
);

export type RoomTable = InferSelectModel<typeof roomsTable>;
