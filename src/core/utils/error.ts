export class AppError extends Error {
  constructor(public message: string, public name: string, public stack?: string,) {
    super();
  }

  toString() {
    return this.message;
  }

  static fromAnyError(error: AppError | Error | string | unknown): AppError {
    if (error instanceof AppError) {
      return new AppError(error.message, error.name, error.stack)
    }

    if (error instanceof Error) {
      return new AppError(error.message, error.name, error.stack)
    }

    return new AppError(String(error), '', 'UnknownError');
  }
}

export class ValidationError extends AppError {
  static fromString(message: string) {
    return new ValidationError(String(message), 'ValidationError');
  }
}