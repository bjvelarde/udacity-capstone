import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'
import { Editor } from '@tinymce/tinymce-react';

import { createBlog, deleteBlog, getBlogs, patchBlog } from '../api/blogs-api'
import Auth from '../auth/Auth'
import { Blog } from '../types/Blog'

interface BlogsProps {
  auth: Auth
  history: History
}

interface BlogsState {
  blogs: Blog[]
  newBlogName: string
  newBlogContent: string
  loadingBlogs: boolean
}

export class Blogs extends React.PureComponent<BlogsProps, BlogsState> {
  state: BlogsState = {
    blogs: [],
    newBlogName: '',
    newBlogContent: '',
    loadingBlogs: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newBlogName: event.target.value })
  }

  handleEditorChange = (event: any) => {
    this.setState({ newBlogContent: event.target.getContent() })
  }

  onEditButtonClick = (blogId: string) => {
    this.props.history.push(`/blogs/${blogId}/edit`)
  }

  onBlogCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      //const datePublished = this.calculateDueDate()
      const newBlog = await createBlog(this.props.auth.getIdToken(), {
        name: this.state.newBlogName,
        content: this.state.newBlogContent
      })
      this.setState({
        blogs: [...this.state.blogs, newBlog],
        newBlogName: '',
        newBlogContent: ''
      })
    } catch {
      alert('Blog creation failed')
    }
  }

  onBlogDelete = async (blogId: string, createdAt: string) => {
    try {
      await deleteBlog(this.props.auth.getIdToken(), blogId, createdAt)
      this.setState({
        blogs: this.state.blogs.filter(blog => blog.blogId != blogId)
      })
    } catch {
      alert('Blog deletion failed')
    }
  }

  onBlogCheck = async (pos: number) => {
    try {
      const blog = this.state.blogs[pos]
      await patchBlog(this.props.auth.getIdToken(), blog.blogId, {
        name: blog.name,
        content: blog.content,
        datePublished: blog.datePublished,
        published: !blog.published
      })
      this.setState({
        blogs: update(this.state.blogs, {
          [pos]: { published: { $set: !blog.published } }
        })
      })
    } catch {
      alert('Blog deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const blogs = await getBlogs(this.props.auth.getIdToken())
      this.setState({
        blogs,
        loadingBlogs: false
      })
    } catch (e) {
      alert(`Failed to fetch blogs: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">BLOGs</Header>

        {this.renderCreateBlogInput()}

        {this.renderBlogs()}
      </div>
    )
  }

  renderCreateBlogInput() {
    return (
      <>
        <Grid.Row>
          <Grid.Column width={16}>
            <Input
              action={{
                color: 'teal',
                labelPosition: 'left',
                icon: 'add',
                content: 'New Title',
                onClick: this.onBlogCreate
              }}
              fluid
              actionPosition="left"
              placeholder="To change the world..."
              onChange={this.handleNameChange}
            />
          </Grid.Column>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={16}>
          <Editor
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
              ],
              toolbar:
                'undo redo | formatselect | bold italic backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | help'
            }}
            onChange={this.handleEditorChange}
          />
          </Grid.Column>
        </Grid.Row>
      </>
    )
  }

  renderBlogs() {
    if (this.state.loadingBlogs) {
      return this.renderLoading()
    }

    return this.renderBlogsList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading BLOGs
        </Loader>
      </Grid.Row>
    )
  }

  renderBlogsList() {
    return (
      <Grid padded>
        {this.state.blogs.map((blog, pos) => {
          return (
            <Grid.Row key={blog.blogId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onBlogCheck(pos)}
                  checked={blog.published}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {blog.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {blog.datePublished}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(blog.blogId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onBlogDelete(blog.blogId, blog.createdAt)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {blog.attachmentUrl && (
                <Image src={blog.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  //calculateDueDate(): string {
  //  const date = new Date()
  //  date.setDate(date.getDate() + 7)
//
  //  return dateFormat(date, 'yyyy-mm-dd') as string
  //}
}
