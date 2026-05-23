import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

type RechartsModule = typeof import("recharts");
type RechartsExport = keyof RechartsModule;
type LooseProps = Record<string, unknown>;

function lazyChart(name: RechartsExport) {
  return lazy(async () => {
    const mod = await import("recharts");
    return { default: mod[name] as ComponentType<LooseProps> };
  });
}

export const Area = lazyChart("Area");
export const AreaChart = lazyChart("AreaChart");
export const Bar = lazyChart("Bar");
export const BarChart = lazyChart("BarChart");
export const CartesianGrid = lazyChart("CartesianGrid");
export const Cell = lazyChart("Cell");
export const Legend = lazyChart("Legend");
export const Pie = lazyChart("Pie");
export const PieChart = lazyChart("PieChart");
export const ResponsiveContainer = lazyChart("ResponsiveContainer");
export const Tooltip = lazyChart("Tooltip");
export const XAxis = lazyChart("XAxis");
export const YAxis = lazyChart("YAxis");

export function ChartSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-48 items-center justify-center text-sm text-muted-foreground">
          Loading chart…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}