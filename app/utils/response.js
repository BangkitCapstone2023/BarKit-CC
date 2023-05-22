function badResponse(statusCode, message, error = null) {
  return {
    status: statusCode,
    message: message,
    error: error,
  };
}

function successResponse(statusCode, message, data) {
  if (data) {
    return {
      status: statusCode,
      message: message,
      data: data,
    };
  } else {
    return {
      status: statusCode,
      message: message,
    };
  }
}

export { badResponse, successResponse };
