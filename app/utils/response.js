function badResponse(statusCode, message) {
  return {
    error_code: statusCode,
    message: message,
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

module.exports = {
  badResponse,
  successResponse,
};
