import logger from "../utils/logger.js";

const logger_middleware = (req, res, next) => {
  // log request start
  logger.start(req);

  // waiting till we get re object
  res.on("finish", () => {
    const status = res.statusCode;
    const message = status >= 400 ? "Failed" : "Success";
    logger.end(req, res, message, status);
  });

  next();
};

export default logger_middleware;