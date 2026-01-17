import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
}

const slideVariants = {
  initial: (direction: string) => ({
    opacity: 0,
    x: direction === "left" ? 60 : direction === "right" ? -60 : 0,
    y: direction === "up" ? 30 : direction === "down" ? -30 : 0,
    scale: 0.98,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  },
  exit: (direction: string) => ({
    opacity: 0,
    x: direction === "left" ? -60 : direction === "right" ? 60 : 0,
    y: direction === "up" ? -20 : direction === "down" ? 20 : 0,
    scale: 0.98,
  }),
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
};

const PageTransition = ({ children, direction = "left" }: PageTransitionProps) => {
  return (
    <motion.div
      custom={direction}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideVariants}
      transition={pageTransition}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
