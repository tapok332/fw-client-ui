import { Metadata } from "next";
import StoreView from "@/components/stores/store-view";

// In a real app, this would be fetched from backend
export async function generateMetadata({
  params
}: {
  params: Promise<{ storeId: string }>
}): Promise<Metadata> {
  // This would normally fetch store data from an API
  // Await the params object before destructuring
  const resolvedParams = await params;
  const storeId = resolvedParams.storeId;
  
  return {
    title: `Store ${storeId}`,
    description: "View menu and place your order",
  };
}

export default async function StorePage({
  params
}: {
  params: Promise<{ storeId: string }>
}) {
  // Await the params object before destructuring
  const resolvedParams = await params;
  const storeId = resolvedParams.storeId;
  
  return <StoreView storeId={storeId} />;
}
