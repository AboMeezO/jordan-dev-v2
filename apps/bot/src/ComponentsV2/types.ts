export interface ContainerInput {
	accentColor?: number;
	content: string;
	buttons?: ButtonInput[][];
}

export interface ButtonInput {
	customId: string;
	label: string;
	style: "danger" | "primary" | "secondary" | "success";
	disabled?: boolean;
}
