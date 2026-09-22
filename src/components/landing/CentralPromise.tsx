import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import LandingScene from "./LandingScene";
import PixelReveal from "./PixelReveal";
import type { LandingCopy } from "./landingCopy";

import "./opening.css";

export type CentralPromiseProps = {
  copy: LandingCopy;
};

const CentralPromise = ({ copy }: CentralPromiseProps) => {
  const promise = copy.scenes.promise;

  return (
    <LandingScene
      id="promise"
      scene="promise"
      labelledBy="promise-title"
      className="opening-promise"
      innerClassName="opening-promise__content"
    >
      <p className="sr-only">{promise.eyebrow}</p>
      <PixelReveal as="h1" id="promise-title" text="Organizze" className="opening-promise__brand" />
      <PixelReveal as="h2" text={copy.promiseTitle} className="opening-promise__title" />
      <p className="opening-promise__description">
        {promise.description}
      </p>
      <div className="opening-promise__actions">
        <Button asChild size="lg" className="opening-promise__primary">
          <Link to="/auth">
            {copy.primaryCta}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="opening-promise__secondary">
          <a href="#month">{copy.secondaryCta}</a>
        </Button>
      </div>
    </LandingScene>
  );
};

export default CentralPromise;
