import { ReportDetailScreen } from "@/features/report/components/ReportDetailScreen";

export default async function Page({ params }: PageProps<"/report/[reportId]">) {
  const { reportId } = await params;
  return <ReportDetailScreen reportId={reportId} />;
}
