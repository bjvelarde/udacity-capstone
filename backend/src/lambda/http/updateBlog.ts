import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { updateBlog } from '../../businessLogic/blogs'
import { createLogger } from '../../utils/logger'
import { UpdateBlogRequest } from '../../requests/UpdateBlogRequest'

const logger = createLogger('updateBlog')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const blogId = event.pathParameters.blogId

  logger.info('BlogId', blogId)

  const updatedBlog: UpdateBlogRequest = JSON.parse(event.body)

  await updateBlog({
    name: updatedBlog.name,
    content: updatedBlog.content,
    datePublished: updatedBlog.datePublished,
    published: updatedBlog.published}, blogId, jwtToken)
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: {}
    })
  }

}
