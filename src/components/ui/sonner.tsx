import { useTheme } from "next-themes";
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: <CircleCheck className="size-4 text-financial-success" />,
        info: <Info className="size-4 text-intelligence" />,
        warning: <TriangleAlert className="size-4 text-financial-warning" />,
        error: <CircleAlert className="size-4 text-financial-danger" />,
        loading: <LoaderCircle className="size-4 text-intelligence motion-safe:animate-spin motion-reduce:animate-none" />,
        close: <X className="size-4" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-md group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:shadow-menu",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-body-small group-[.toast]:leading-relaxed group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:min-h-11 group-[.toast]:rounded-md group-[.toast]:bg-primary group-[.toast]:px-3 group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:min-h-11 group-[.toast]:rounded-md group-[.toast]:bg-muted group-[.toast]:px-3 group-[.toast]:text-foreground",
          closeButton: "focus-ring interactive-control inline-flex size-11 !h-11 !w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
          success: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-financial-success",
          error: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-financial-danger",
          warning: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-financial-warning",
          info: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-intelligence",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
