import { DesignBuilderPage } from "@/features/design/design-builder-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <DesignBuilderPage designId={id}/>; }
