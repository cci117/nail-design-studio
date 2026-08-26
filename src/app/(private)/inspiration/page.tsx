import { Images } from "lucide-react"; import { ContentPlaceholder } from "@/components/feedback/content-placeholder";
export default function Page() { return <ContentPlaceholder title="灵感库" description="收藏的完整美甲款式与设计图片" icon={Images} emptyTitle="还没有灵感" emptyDescription="图片保存功能将在后续版本中开放。" />; }
