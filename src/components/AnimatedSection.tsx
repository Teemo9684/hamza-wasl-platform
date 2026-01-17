import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "left" | "right" | "up" | "down";
}

// Fast slide/push variants for section transitions
const sectionSlideVariants = {
  initial: (direction: string) => ({
    opacity: 0,
    x: direction === "left" ? 80 : direction === "right" ? -80 : 0,
    y: direction === "up" ? 40 : direction === "down" ? -40 : (direction === "left" || direction === "right" ? 0 : 20),
    scale: 0.97,
    filter: "blur(4px)",
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: string) => ({
    opacity: 0,
    x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
    y: direction === "up" ? -25 : direction === "down" ? 25 : -15,
    scale: 0.98,
    filter: "blur(2px)",
  }),
};

// Stagger container for dashboard pages
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
} as const;

// Individual item animation - faster
export const staggerItem = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 30,
    },
  },
} as const;

// Card animation with scale - snappier
export const cardAnimation = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 450,
      damping: 25,
    },
  },
} as const;

// Fade in animation - faster
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
} as const;

// Fast spring transition
const fastSpringTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

export const AnimatedSection = ({ 
  children, 
  className, 
  delay = 0,
  direction = "left"
}: AnimatedSectionProps) => {
  return (
    <motion.div
      custom={direction}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={sectionSlideVariants}
      transition={{
        ...fastSpringTransition,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated container for staggered children
export const AnimatedContainer = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated item for use inside AnimatedContainer
export const AnimatedItem = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
};

// Animated card with hover effects - snappier response
export const AnimatedCard = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <motion.div
      variants={cardAnimation}
      whileHover={{ scale: 1.015, y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring" as const, stiffness: 500, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// New: Swipe/Push transition for navigation items
export const SwipeSection = ({ 
  children, 
  className,
  direction = "left"
}: { 
  children: ReactNode; 
  className?: string;
  direction?: "left" | "right";
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        x: direction === "left" ? 100 : -100,
        scale: 0.95 
      }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: 1 
      }}
      exit={{ 
        opacity: 0, 
        x: direction === "left" ? -100 : 100,
        scale: 0.95 
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// New: Smooth push transition
export const PushSection = ({ 
  children, 
  className,
  isActive
}: { 
  children: ReactNode; 
  className?: string;
  isActive?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -40, filter: "blur(4px)" }}
      transition={{
        type: "spring",
        stiffness: 450,
        damping: 32,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
