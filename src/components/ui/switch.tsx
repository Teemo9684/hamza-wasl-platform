import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#1DB889] data-[state=checked]:border-[#1DB889] data-[state=unchecked]:bg-transparent data-[state=unchecked]:border-gray-400 dark:data-[state=unchecked]:border-gray-500",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[state=checked]:opacity-100 data-[state=checked]:scale-100 data-[state=unchecked]:opacity-0 data-[state=unchecked]:scale-50",
      )}
    >
      <Check className="h-5 w-5 text-white stroke-[3]" />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
