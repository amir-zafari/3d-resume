import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

// Loaded on demand (see Works.tsx): the Markdown stack is a large share of the bundle and is only
// needed once a work's detail page is opened.
export default function WorkMarkdown({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
      {body}
    </ReactMarkdown>
  )
}
