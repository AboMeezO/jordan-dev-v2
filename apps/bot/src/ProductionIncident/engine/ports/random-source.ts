export interface RandomSource {
	nextFloat(): number;
	nextInteger(
		minInclusive: number,
		maxInclusive: number,
	): number;
	readonly seed?: string;
}
