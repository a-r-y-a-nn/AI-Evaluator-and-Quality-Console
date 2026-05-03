export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on the server.' : err.message;

  if (status === 500) console.error(err);

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
}
