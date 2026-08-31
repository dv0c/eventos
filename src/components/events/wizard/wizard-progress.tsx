import { useMemo } from "react";

import type { WizardStepId } from "@/components/events/wizard/event-type-config";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  steps: WizardStepId[];
  currentStep: number;
  stepLabels: Record<WizardStepId, string>;
}

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 40;
const PADDING_X = 8;
const AMPLITUDE = 10;
const CENTER_Y = VIEW_HEIGHT / 2;

interface Point {
  x: number;
  y: number;
}

function getStepPoints(count: number): Point[] {
  if (count <= 1) {
    return [{ x: VIEW_WIDTH / 2, y: CENTER_Y }];
  }

  const usableWidth = VIEW_WIDTH - PADDING_X * 2;

  return Array.from({ length: count }, (_, index) => ({
    x: PADDING_X + (index * usableWidth) / (count - 1),
    y: CENTER_Y + (index % 2 === 0 ? -AMPLITUDE : AMPLITUDE),
  }));
}

function buildWormPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;

    path += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }

  return path;
}

export function WizardProgress({
  steps,
  currentStep,
  stepLabels,
}: WizardProgressProps) {
  const currentStepId = steps[currentStep];
  const currentLabel = stepLabels[currentStepId];

  const { path, points, progressOffset } = useMemo(() => {
    const stepPoints = getStepPoints(steps.length);
    const wormPath = buildWormPath(stepPoints);
    const progressRatio =
      steps.length <= 1 ? 1 : currentStep / (steps.length - 1);

    return {
      path: wormPath,
      points: stepPoints,
      progressOffset: 1 - progressRatio,
    };
  }, [currentStep, steps.length]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span key={currentStepId} className="wizard-form-section-enter font-medium">
          {currentLabel}
        </span>
        <span className="tabular-nums">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={currentStep + 1}
        aria-label={currentLabel}
        className="h-10 w-full"
      >
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={path}
            fill="none"
            pathLength={1}
            className="stroke-secondary"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={progressOffset}
            className="wizard-worm-progress stroke-primary"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((point, index) => {
            const isComplete = index <= currentStep;
            const isCurrent = index === currentStep;

            return (
              <g key={steps[index]}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isCurrent ? 6 : 5}
                  className="fill-card"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isCurrent ? 5 : 4}
                  className={cn(
                    "transition-all duration-300 ease-out",
                    isComplete ? "fill-primary" : "fill-secondary",
                    !isComplete && "stroke-border stroke-[1.5]",
                  )}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
