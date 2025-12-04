"use client";

import {
  InterestRateChartVisx,
  type InterestRateChartVisxProps,
  RANGE_OPTIONS,
} from "./InterestRateChartVisx";

export function InterestRateChart(props: InterestRateChartVisxProps) {
  return <InterestRateChartVisx {...props} />;
}

export { RANGE_OPTIONS };
