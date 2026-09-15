export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: {
        message: 'Invalid JSON payload',
      },
    });
  }

  let statusCode = err.statusCode ?? err.status ?? 500;
  let message = err.message ?? 'Internal server error';
  let details = err.details ?? null;

  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with one of those values already exists';
    details = err.meta?.target ?? details;
  }

  if (err.code === 'P2003') {
    statusCode = 400;
    message = 'The related record does not exist';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const payload = {
    error: {
      message,
    },
  };

  if (details) {
    payload.error.details = details;
  }

  if (process.env.NODE_ENV !== 'production' && statusCode >= 500 && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}
