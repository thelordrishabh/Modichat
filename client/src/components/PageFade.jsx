import { motion } from "framer-motion";

const MotionDiv = motion.div;

export default function PageFade({ children, className = "" }) {
  return (
    <MotionDiv
      className={className}
      initial={{ opacity: 0, y: 24, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionDiv>
  );
}
