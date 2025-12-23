import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">페이지를 찾을 수 없습니다</h2>
      <p className="mb-8 text-muted-foreground">요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>
      <Button asChild>
        <Link href="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          홈으로 돌아가기
        </Link>
      </Button>
    </div>
  )
}
