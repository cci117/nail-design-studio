import { Bot } from "lucide-react"; import { ContentPlaceholder } from "@/components/feedback/content-placeholder";
export default function Page() { return <ContentPlaceholder title="AI设计" description="联网功能" icon={Bot} emptyTitle="AI 功能尚未开放" emptyDescription="V0.1 仅预留入口，基础资料库不依赖 AI 服务运行。" />; }
