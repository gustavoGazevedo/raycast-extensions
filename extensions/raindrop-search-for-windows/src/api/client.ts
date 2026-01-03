import { getPreferenceValues, showToast, Toast } from "@raycast/api";

const BASE_URL = "https://api.raindrop.io/rest/v1";

interface Preferences {
  testToken: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const { testToken } = getPreferenceValues<Preferences>();

  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${testToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    switch (response.status) {
      case 401:
        await showToast({
          style: Toast.Style.Failure,
          title: "Authentication Failed",
          message:
            "Invalid test token. Please check your token in extension preferences.",
        });
        throw new ApiError("Invalid test token", 401);

      case 429:
        await showToast({
          style: Toast.Style.Failure,
          title: "Rate Limit Exceeded",
          message: "Please wait a moment and try again.",
        });
        throw new ApiError("Rate limit exceeded", 429);

      case 500:
      case 502:
      case 503:
      case 504:
        await showToast({
          style: Toast.Style.Failure,
          title: "Server Error",
          message:
            "Raindrop.io is temporarily unavailable. Please try again later.",
        });
        throw new ApiError("Server error", response.status);

      default:
        await showToast({
          style: Toast.Style.Failure,
          title: "Request Failed",
          message: `An error occurred (${response.status})`,
        });
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status,
        );
    }
  }

  return response.json() as Promise<T>;
}
