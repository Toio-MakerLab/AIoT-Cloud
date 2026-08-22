import axios from "axios";
import humps from "humps";
import Cookies from "js-cookie";
import { ACCESS_TOKEN } from "@/stores/authStore";
import { domainConfig } from "./domain-config";

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

// Walks raw JSON and quotes any bare integer > Number.MAX_SAFE_INTEGER.
// Skips string contents so values inside quotes are never touched.
function parseJsonSafe(raw: string): unknown {
	const out: string[] = [];
	let i = 0;

	while (i < raw.length) {
		const ch = raw[i];

		if (ch === '"') {
			// Copy string literal verbatim (handles escape sequences)
			out.push(raw[i++]);
			while (i < raw.length) {
				if (raw[i] === "\\") {
					out.push(raw[i++], raw[i++]);
				} else if (raw[i] === '"') {
					out.push(raw[i++]);
					break;
				} else {
					out.push(raw[i++]);
				}
			}
			continue;
		}

		if (ch === "-" || (ch >= "0" && ch <= "9")) {
			const start = i;
			if (raw[i] === "-") i++;
			while (i < raw.length && raw[i] >= "0" && raw[i] <= "9") i++;

			const isFloat = raw[i] === "." || raw[i] === "e" || raw[i] === "E";
			if (!isFloat) {
				const token = raw.slice(start, i);
				const abs = token.startsWith("-") ? token.slice(1) : token;
				// 16-digit numbers may exceed MAX_SAFE_INTEGER; 17+ always do
				if (abs.length > 15 && BigInt(abs) > MAX_SAFE) {
					out.push(`"${token}"`);
					continue;
				}
			}
			out.push(raw.slice(start, i));
			continue;
		}

		out.push(raw[i++]);
	}

	return JSON.parse(out.join(""));
}

export const apiClient = axios.create({
	baseURL: domainConfig.VITE_API_URL || "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
	},
	transformResponse: [
		(raw: string) => {
			try {
				const parsed = parseJsonSafe(raw);
				return humps.camelizeKeys(parsed);
			} catch {
				return raw;
			}
		},
	],
});

apiClient.interceptors.request.use((config) => {
	// Always read baseURL from runtime config so it reflects domain.json values
	config.baseURL = domainConfig.VITE_API_URL || "http://localhost:3000";
	const token = Cookies.get(ACCESS_TOKEN);
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export default apiClient;
