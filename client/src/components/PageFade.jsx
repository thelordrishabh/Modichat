import { useEffect, useState } from "react";

export default function PageFade({ children, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className={`${className} transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}
