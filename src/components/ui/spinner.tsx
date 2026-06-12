import * as React from "react";
import { cn } from "@/lib/utils";

type SpinnerProps = React.HTMLAttributes<HTMLDivElement>;

// export function Spinner({ className, ...props }: SpinnerProps) {
//   return (
//     <div
//       className={cn("animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full", className)}
//       {...props}
//     >
//       <span className="sr-only">Loading</span>
//     </div>
//   );
// }
const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]", className)}
    role="status"
    {...props}
  >
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
      Loading...
    </span>
  </div>
));
Spinner.displayName = "Spinner";

export { Spinner };
