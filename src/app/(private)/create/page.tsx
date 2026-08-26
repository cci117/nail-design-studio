import { WandSparkles } from "lucide-react"; import { ContentPlaceholder } from "@/components/feedback/content-placeholder";
export default function Page() { return <ContentPlaceholder title="开始设计" description="创建新的美甲设计" icon={WandSparkles} emptyTitle="设计流程即将开放" emptyDescription="V0.1 已预留设计入口，暂不包含 AI 生成与图片编辑。" />; }
