import * as AWS  from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { BlogItem } from '../models/BlogItem'
import { BlogUpdate } from '../models/BlogUpdate'
import { createLogger } from '../utils/logger'
import Jimp from 'jimp'

var AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('Blog DataAcess')

export class BlogAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly blogsTable = process.env.BLOGS_TABLE,
    private readonly bucketName = process.env.BLOGS_S3_BUCKET,
    private readonly expires = process.env.SIGNED_URL_EXPIRATION,
    private readonly thumbnailBucketName = process.env.THUMBNAILS_S3_BUCKET,
    private readonly region = process.env.BUCKET_REGION
  ) {}

  async getUserBlogs(userId: string): Promise<BlogItem[]> {
    var params = {
      TableName: this.blogsTable,
      ProjectionExpression: "blogId, createdAt, #name, content, datePublished, published, attachmentUrl",
      //FilterExpression:  "userId = :userId",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeNames:{
        "#name": "name"
      },
      ExpressionAttributeValues: {
          ":userId": userId
      }
    }

    const result = await this.docClient.query(params).promise()
    const items = result.Items
    logger.info('getUserBlogs', params, items)
    return items as BlogItem[]
  }


  async createBlog(blog: BlogItem, newUser: any): Promise<BlogItem> {
    const newBlogItem = {
      userId: newUser.userId,
      blogId: blog.blogId,
      createdAt: blog.createdAt,
      name: blog.name,
      content: blog.content,
      datePublished: blog.datePublished,
      published: blog.published,
      attachmentUrl: blog.attachmentUrl
    }

    await this.docClient.put({
      TableName: this.blogsTable,
      Item: newBlogItem
    }).promise()

    return newBlogItem
  }

  async deleteBlog(blogKey: string, userId: string) {
    let splitKey = blogKey.split('+')
    let blogId = splitKey[0]
    let createdAt = splitKey[1]
    var params = {
      TableName:this.blogsTable,
      Key:{
          "userId": userId,
          "createdAt": createdAt
      },
      ConditionExpression:"blogId = :blogId and userId = :userId",
      ExpressionAttributeValues: {
          ":blogId": blogId,
          ":userId": userId
      }
    }

    console.log('Delete Blog', params);

    await this.docClient.delete(params).promise()
  }

  async attachBlogUrl(uploadUrl: string, blogId: string) {
    const params = {
      TableName: this.blogsTable,
      Key:{
          "blogId": blogId
      },
      ConditionExpression:"blogId = :blogId",
      UpdateExpression: "set attachmentUrl = :r",
      ExpressionAttributeValues:{
          ":blogId":blogId,
          ":r":uploadUrl
      }
    }

    await this.docClient.update(params).promise()
  }


  getUploadUrl(blogId: string): string {
    const s3 = new XAWS.S3({
      signatureVersion: 'v4',
      region: this.region,
      params: { Bucket: this.bucketName }
    });

    var params = {
      Bucket: this.bucketName,
      Key: blogId,
      Expires: parseInt(this.expires)
    }

    logger.info('UrlUpload Param', params)

    return s3.getSignedUrl('putObject', params)
  }


  async updateBlog(blog: BlogUpdate, blogId: string, userId: string) {
    const params = {
      TableName: this.blogsTable,
      Key:{
          "blogId": blogId
      },
      ConditionExpression:"blogId = :blogId and userId = :userId",
      UpdateExpression: "set #name = :r, content=:c, datePublished=:p, published=:a",
      ExpressionAttributeNames:{
        "#name": "name"
      },
      ExpressionAttributeValues:{
          ":blogId":blogId,
          ":userId":userId,
          ":r":blog.name,
          ":c":blog.content,
          ":p":blog.datePublished,
          ":a":blog.published
      },
    }

    await this.docClient.update(params).promise()
  }

  async processBlogImage(key: string) {
    console.log('Processing S3 item with key: ', key)
    const s3 = new XAWS.S3({
      signatureVersion: 'v4',
      region: this.region,
      params: {Bucket: this.bucketName}
    });

    const response = await s3.getObject({
      Bucket: this.bucketName,
      Key: key
    }).promise()

    const body = response.Body
    const image = await Jimp.read(body)

    logger.info('Buffer',image)

    image.resize(150, Jimp.AUTO)
    const convertedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)

    logger.info('Writing image back to S3 bucket', this.thumbnailBucketName)
    await s3.putObject({
      Bucket: this.thumbnailBucketName,
      Key: `${key}.jpeg`,
      Body: convertedBuffer
    }).promise()
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE === "True") {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'})
}
