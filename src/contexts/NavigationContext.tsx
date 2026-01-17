import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type NavigationDirection = "left" | "right" | "none";

interface NavigationContextType {
  direction: NavigationDirection;
  setDirection: (dir: NavigationDirection) => void;
  previousIndex: number;
  setPreviousIndex: (index: number) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [direction, setDirection] = useState<NavigationDirection>("none");
  const [previousIndex, setPreviousIndex] = useState<number>(0);

  return (
    <NavigationContext.Provider value={{ direction, setDirection, previousIndex, setPreviousIndex }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

// Helper to determine direction based on nav item indices
export const getNavigationDirection = (
  currentIndex: number,
  previousIndex: number
): NavigationDirection => {
  if (currentIndex === previousIndex) return "none";
  // RTL: moving to higher index means sliding from left
  return currentIndex > previousIndex ? "left" : "right";
};
