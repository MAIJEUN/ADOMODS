"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { useTheme } from "@/components/theme-provider"
import Image from "next/image"
import Link from "next/link"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light")

  // 실제 적용되는 테마 ���지
  React.useEffect(() => {
    try {
      // 테마가 'system'인 경우 시스템 설정 확인
      if (theme === "system") {
        const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
        setResolvedTheme(isDarkMode ? "dark" : "light")

        // 시스템 테마 변경 감지
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = (e: MediaQueryListEvent) => {
          setResolvedTheme(e.matches ? "dark" : "light")
        }

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
      } else {
        // 'system'이 아닌 경우 직접 설정된 테마 사용
        setResolvedTheme(theme as "light" | "dark")
      }
    } catch (error) {
      console.error("Error detecting theme:", error)
      // 오류 발생 시 기본값으로 light 사용
      setResolvedTheme("light")
    }
  }, [theme])

  // 코드 블록 스타일 선택
  const codeStyle = resolvedTheme === "dark" ? vscDarkPlus : vs

  // 마크다운 렌더링 시도
  try {
    return (
      <ReactMarkdown
        className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // 코드 블록 커스텀 렌더링
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <SyntaxHighlighter
                style={codeStyle}
                language={match[1]}
                PreTag="div"
                className="rounded-md !bg-gray-100 dark:!bg-gray-800 !mt-4 !mb-4"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm`} {...props}>
                {children}
              </code>
            )
          },
          // 이미지 커스텀 렌더링
          img({ node, src, alt, ...props }) {
            if (src) {
              return (
                <div className="relative w-full h-auto min-h-[200px] my-4 rounded-md overflow-hidden">
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={alt || ""}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=200&width=400"
                    }}
                  />
                </div>
              )
            }
            return <img src={src || "/placeholder.svg"} alt={alt || ""} {...props} />
          },
          // 링크 커스텀 렌더링
          a({ node, href, children, ...props }) {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="text-primary hover:underline" {...props}>
                  {children}
                </Link>
              )
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                {...props}
              >
                {children}
              </a>
            )
          },
          // 테이블 커스텀 렌더링
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="border-collapse w-full" {...props}>
                  {children}
                </table>
              </div>
            )
          },
          // 목록 커스텀 렌더링
          ul({ node, children, ...props }) {
            return (
              <ul className="list-disc pl-6 my-4 space-y-2" {...props}>
                {children}
              </ul>
            )
          },
          ol({ node, children, ...props }) {
            return (
              <ol className="list-decimal pl-6 my-4 space-y-2" {...props}>
                {children}
              </ol>
            )
          },
          // 헤더 커스텀 렌더링
          h1({ node, children, ...props }) {
            return (
              <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b dark:border-gray-700" {...props}>
                {children}
              </h1>
            )
          },
          h2({ node, children, ...props }) {
            return (
              <h2 className="text-xl font-bold mt-5 mb-3" {...props}>
                {children}
              </h2>
            )
          },
          h3({ node, children, ...props }) {
            return (
              <h3 className="text-lg font-bold mt-4 mb-2" {...props}>
                {children}
              </h3>
            )
          },
          // 인용구 커스텀 렌더링
          blockquote({ node, children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-4 italic text-gray-700 dark:text-gray-300"
                {...props}
              >
                {children}
              </blockquote>
            )
          },
          // 수평선 커스텀 렌더링
          hr({ node, ...props }) {
            return <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    )
  } catch (error) {
    // 컨텐츠 유효성 검사
    if (!content || typeof content !== "string") {
      console.error("Invalid markdown content:", content)
      return <div className="text-red-500">유효하지 않은 마크다운 콘텐츠입니다.</div>
    }
    console.error("Error rendering markdown:", error)
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-md">
        <p className="text-red-600 dark:text-red-400 font-medium">마크다운 렌더링 중 오류가 발생했습니다.</p>
        <pre className="mt-2 text-sm text-red-500 dark:text-red-400 overflow-auto">
          {content ? content.substring(0, 100) + "..." : "내용 없음"}
        </pre>
      </div>
    )
  }
}
