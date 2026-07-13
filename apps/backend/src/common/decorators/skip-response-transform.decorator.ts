import { SetMetadata } from "@nestjs/common";

export const SKIP_RESPONSE_TRANSFORM_METADATA_KEY =
	"jordan-devs:skip-response-transform";

export function SkipResponseTransform() {
	return SetMetadata(
		SKIP_RESPONSE_TRANSFORM_METADATA_KEY,
		true,
	);
}
