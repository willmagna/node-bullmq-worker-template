import logger from "../../config/logger/index.js";

export class ErrorLogger extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    logger.error(message);
    this.name = "ErrorLogger";
  }
}
