import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { SceneId } from "./landingCopy";

export type LandingSceneProps = {
  id: string;
  scene: SceneId;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  labelledBy?: string;
};

export default function LandingScene({ id, scene, children, className, innerClassName, labelledBy }: LandingSceneProps) {
  return (
    <section id={id} data-scene={scene} aria-labelledby={labelledBy} className={cn("reference-scene relative w-full scroll-mt-20", className)}>
      <div className={cn("mx-auto w-full max-w-[1120px] px-6 sm:px-10", innerClassName)}>
        {children}
      </div>
    </section>
  );
}
