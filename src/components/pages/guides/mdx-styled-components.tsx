import { cn } from '@/lib/cn'
import * as React from 'react'

function getLanguage(children: React.ReactNode): string | null {
  const child = React.Children.toArray(children)[0]
  if (!React.isValidElement<{ className?: string }>(child)) return null
  const cn = child.props.className
  if (!cn) return null
  const match = String(cn).match(/language-(\w+)/)
  return match?.[1] ?? null
}

export function Pre({ className, children, ...props }: React.ComponentProps<'pre'>) {
  const preRef = React.useRef<HTMLPreElement>(null)
  const [copied, setCopied] = React.useState(false)
  const lang = getLanguage(children)

  const handleCopy = () => {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="bg-code-background border-pale/20 mb-4 overflow-hidden rounded-lg border last:mb-0">
      <div className="text-pale border-pale/20 flex items-center justify-between border-b px-4 py-2 text-sm">
        <span className="font-medium capitalize">{lang ?? 'code'}</span>
        <button type="button" onClick={handleCopy} className="group cursor-pointer rounded text-xs">
          [<span className="text-pale group-hover:text-code-foreground">{copied ? 'Copied' : 'Copy'}</span>]
        </button>
      </div>
      <pre ref={preRef} className={cn('bg-code-background! text-code-foreground! m-0 overflow-x-auto px-2 py-2 font-mono text-[0.9em]', className)} {...props}>
        {children}
      </pre>
    </div>
  )
}

export function Code({ className, ...props }: React.ComponentProps<'code'>) {
  if (typeof props.children === 'string') {
    return <code className={cn('bg-code-background! text-code-foreground! rounded px-[0.3rem] py-[0.2rem] font-mono text-[0.8rem] before:content-none after:content-none', className)} {...props} />
  }
  return <code className={cn('m-0 block bg-transparent p-0 text-inherit', className)} {...props} />
}

export function Ul({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('list-["-"]', className)} {...props} />
}
