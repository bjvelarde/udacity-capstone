import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import { getBlogs } from '../../businessLogic/blogs';
import { createLogger } from '../../utils/logger'
import { BlogItem } from '../../models/BlogItem';

const logger = createLogger('getBlogs')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Event Processing', event)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const blogItems: BlogItem[] = await getBlogs(jwtToken)
  let items = JSON.parse(JSON.stringify(blogItems))
  logger.info('User Blog items', items)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items
    })
  }
}
