/**
 * Create a logger instance to write log messages in JSON format.
 *
 * @param loggerName - a name of a logger that will be added to all messages
 */
export function getJwtToken(authorization: any) {
  const split = authorization.split(' ')
  return split[1]
}