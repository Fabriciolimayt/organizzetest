import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      data-loading-state="static"
      className={cn("rounded-md bg-muted opacity-60", className)}
      {...props}
    />
  );
}

export { Skeleton };
