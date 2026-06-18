import type { RandomSource } from "../index.js";

export class SeededRandomSource implements RandomSource {
	private state: number;

	public constructor(public readonly seed: string) {
		this.state = hashSeed(seed);
	}

	public nextFloat(): number {
		this.state =
			(1_664_525 * this.state + 1_013_904_223) >>> 0;
		return this.state / 0x1_0000_0000;
	}

	public nextInteger(
		minInclusive: number,
		maxInclusive: number,
	): number {
		const range = maxInclusive - minInclusive + 1;
		return (
			minInclusive + Math.floor(this.nextFloat() * range)
		);
	}
}

function hashSeed(seed: string): number {
	let hash = 2_166_136_261;

	for (const character of seed) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16_777_619);
	}

	return hash >>> 0;
}
