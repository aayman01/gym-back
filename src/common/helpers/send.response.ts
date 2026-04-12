type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  error: undefined;
  timestamp: string;
};

type ErrorResponse = {
  success: false;
  message: string;
  data: undefined;
  error: any;
  timestamp: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

type SendResponseInput<T> =
  | { success: true; message: string; data: T; error?: never }
  | { success: false; message: string; data?: never; error: any };

export function sendResponse<T = any>(
  info: SendResponseInput<T>,
): ApiResponse<T> {
  const { success, message } = info;

  if (success) {
    return {
      success: true,
      message,
      data: info.data,
      error: undefined,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    message,
    data: undefined,
    error: info?.error as unknown as Error,
    timestamp: new Date().toISOString(),
  };
}
