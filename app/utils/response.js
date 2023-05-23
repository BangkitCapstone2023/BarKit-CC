const badResponse = (statusCode, message, error = null) => {
  const response = {
    status: statusCode,
    message: message,
  };

  if (error) {
    response.error = error;
  }

  return response;
};

const successResponse = (statusCode, message, data) => {
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
};

export { badResponse, successResponse };
