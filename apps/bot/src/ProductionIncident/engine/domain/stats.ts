export interface GlobalStats {
	readonly developerSanity: number;
	readonly infrastructureCost: number;
	readonly serverStability: number;
	readonly userHappiness: number;
}

export type StatKey = keyof GlobalStats;

export type StatDelta = Readonly<Partial<GlobalStats>>;
