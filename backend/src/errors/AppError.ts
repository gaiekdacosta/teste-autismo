export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export function notFound(message: string): AppError {
  return new AppError(message, 404);
}

export function badRequest(message: string): AppError {
  return new AppError(message, 400);
}

export function conflict(message: string): AppError {
  return new AppError(message, 409);
}

export function internalError(message: string): AppError {
  return new AppError(message, 500);
}
