import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import { CreateBlogRequest } from '../../requests/CreateBlogRequest'
import { BlogItem } from '../../models/BlogItem'
import { createBlog } from '../../businessLogic/blogs'
import { createLogger } from '../../utils/logger'
import * as uuid from 'uuid'

const logger = createLogger('createBlog')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Event Processing', event.body)

  const newBlog: CreateBlogRequest = JSON.parse(event.body)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const blogId = uuid.v4()

  const newItem: BlogItem = await createBlog({
    blogId,
    createdAt: new Date().toISOString(),
    name: newBlog.name,
    content: newBlog.content,
    datePublished: null,
    published: false,
    attachmentUrl: null
  }, jwtToken)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: newItem
    })
  }
}
