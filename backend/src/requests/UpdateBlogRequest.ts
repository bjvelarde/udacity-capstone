/**
 * Fields in a request to update a single BLOG item.
 */
export interface UpdateBlogRequest {
  name: string
  content: string
  datePublished: string
  published: boolean
}