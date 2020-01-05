import { BlogItem } from '../models/BlogItem'
import { BlogAccess } from '../dataLayer/blogsAccess'
import { parseUserId } from '../auth/utils'
import { BlogUpdate } from '../models/BlogUpdate'

const blogAccess = new BlogAccess()

export async function getBlogs(jwtToken: string): Promise<BlogItem[]> {
  const userId = parseUserId(jwtToken)

  return await blogAccess.getUserBlogs(userId)
}

export async function deleteBlog(blogId: string, jwtToken: string) {
  const userId = parseUserId(jwtToken)

  await blogAccess.deleteBlog(blogId, userId)
}

export async function createBlog(
  blog: BlogItem,
  jwtToken: string
): Promise<BlogItem> {
  const userId = parseUserId(jwtToken)

  return await blogAccess.createBlog(blog, {userId: userId})
}

export async function updateBlog(
  blog: BlogUpdate,
  blogId: string,
  jwtToken: string,
) {
  const userId = parseUserId(jwtToken)

  await blogAccess.updateBlog(blog, blogId, userId)
}

export function getUploadUrl(blogId: string): string {
  return blogAccess.getUploadUrl(blogId)
}

export async function attachBlogUrl(uploadUrl: string, blogId: string) {
  await blogAccess.attachBlogUrl(uploadUrl, blogId)
}

export async function processImage(Key: string) {
  await blogAccess.processBlogImage(Key)
}