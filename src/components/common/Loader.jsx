import { useEffect, useState } from "react";

export default function Loader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={show ? "fixed inset-0 z-[999] grid place-items-center bg-white" : "hidden"}>
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-ping rounded-full bg-zinc-900/30"></div>
        <div className="absolute inset-2 rounded-full bg-zinc-900"></div>
      </div>
    </div>
  );
}
