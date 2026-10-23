"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const InteractiveLakeMap = dynamic(
  () => import("./InteractiveLakeMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-xl border border-[#E4EAE7] bg-[#F7F9F8] flex flex-col items-center justify-center text-[#6B7773] gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin text-[#176B5B]" />
        <span className="text-xs font-medium">Loading interactive lake map...</span>
      </div>
    ),
  }
);

export default function MapContainerDynamic(props) {
  return <InteractiveLakeMap {...props} />;
}
