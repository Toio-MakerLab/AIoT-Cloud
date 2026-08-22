const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=";

interface GeneratePasswordOptions {
	length?: number;
	uppercase?: boolean;
	numbers?: boolean;
	symbols?: boolean;
}

function randomChar(charset: string): string {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return charset[array[0] % charset.length];
}

function shuffle<T>(items: T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const array = new Uint32Array(1);
		crypto.getRandomValues(array);
		const j = array[0] % (i + 1);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function generatePassword({
	length = 12,
	uppercase = true,
	numbers = true,
	symbols = true,
}: GeneratePasswordOptions = {}): string {
	let charset = LOWERCASE;
	const required = [randomChar(LOWERCASE)];

	if (uppercase) {
		charset += UPPERCASE;
		required.push(randomChar(UPPERCASE));
	}
	if (numbers) {
		charset += NUMBERS;
		required.push(randomChar(NUMBERS));
	}
	if (symbols) {
		charset += SYMBOLS;
		required.push(randomChar(SYMBOLS));
	}

	const remaining = Array.from(
		{ length: Math.max(length - required.length, 0) },
		() => randomChar(charset),
	);

	return shuffle([...required, ...remaining]).join("");
}
