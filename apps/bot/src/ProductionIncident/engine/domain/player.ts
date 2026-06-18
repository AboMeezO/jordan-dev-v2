import type {
	PlayerId,
	RoleId,
	UnixMillis,
} from "./ids.js";

export interface Player {
	readonly displayName: string;
	readonly id: PlayerId;
	readonly joinedAt: UnixMillis;
	readonly roleId?: RoleId;
}
