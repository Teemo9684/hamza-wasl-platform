import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useNavigation } from "@/contexts/NavigationContext";

interface ContentTransitionProps {
  children: ReactNode;
  className?: string;
}

const variants = {
  enter: (direction: string) => ({
    x: direction === "left" ? 100 : direction === "right" ? -100 : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: string) => ({
    x: direction === "left" ? -100 : direction === "right" ? 100 : 0,
    opacity: 0,
  }),
};

const transition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 40,
  mass: 0.8,
};

const ContentTransition = ({ children, className = "" }: ContentTransitionProps) => {
  const { direction } = useNavigation();

  return (
    <motion.div
      key={direction + Date.now()}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ContentTransition;
