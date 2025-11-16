import { APIError } from '../errors/api-errors';

export function successResponse<T>(data: T, message?: string) {
  return Response.json({
    success: true,
    data,
    message,
  });
}

export function errorResponse(error: APIError | Error, message?: string) {
  if (error instanceof APIError) {
    return Response.json(
      {
        success: false,
        error: message || error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  return Response.json(
    {
      success: false,
      error: message || error.message,
    },
    { status: 500 }
  );
}

export function validateRequestBody<T>(
  body: unknown,
  schema: (data: unknown) => T
): T {
  try {
    return schema(body);
  } catch (error) {
    throw new APIError('Invalid request body', 400);
  }
}