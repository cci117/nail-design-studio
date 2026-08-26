import { Search } from "lucide-react"; import { ContentPlaceholder } from "@/components/feedback/content-placeholder";
export default function Page() { return <ContentPlaceholder title="联网搜索" description="搜索网络上的美甲款式与素材" icon={Search} emptyTitle="搜索功能尚未开放" emptyDescription="V0.1 仅预留入口，暂不访问外部图片服务。" />; }
