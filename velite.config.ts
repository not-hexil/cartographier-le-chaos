import { defineConfig, s } from 'velite'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: `${basePath}/static/` as `/${string}/`,
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: {
    posts: {
      name: 'Post',
      pattern: 'posts/**/*.mdx',
      schema: s
        .object({
          path: s.path(),
          title: s.string().max(120),
          date: s.isodate(),
          summary: s.string().max(300).optional(),
          draft: s.boolean().default(false),
          body: s.mdx(),
        })
        .transform((data) => {
          const slug = data.path.replace(/^posts\//, '')
          return { ...data, slug, permalink: `/posts/${slug}` }
        }),
    },
  },
})
