export class AppError extends Error {
    constructor(message, name, stack) {
        super();
        this.message = message;
        this.name = name;
        this.stack = stack;
    }
    toString() {
        return this.message;
    }
    static fromAnyError(error) {
        if (error instanceof AppError) {
            return new AppError(error.message, error.name, error.stack);
        }
        if (error instanceof Error) {
            return new AppError(error.message, error.name, error.stack);
        }
        return new AppError(String(error), '', 'UnknownError');
    }
}
export class ValidationError extends AppError {
    static fromString(message) {
        return new ValidationError(String(message), 'ValidationError');
    }
}
