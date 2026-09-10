import { MinusCircle, PlusCircle } from "lucide-react";

export function DiffText({ before, after }: { before: string; after: string }) {
  return (
    <div className="font-mono text-xs space-y-2 rounded-xl p-3.5 bg-paper border border-rule/60">
      {before && (
        <div className="flex items-start gap-2 text-gap">
          <MinusCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="line-through decoration-gap/60 leading-relaxed font-sans">{before}</span>
        </div>
      )}
      {after && (
        <div className="flex items-start gap-2 text-match">
          <PlusCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-sans font-medium leading-relaxed">{after}</span>
        </div>
      )}
    </div>
  );
}

