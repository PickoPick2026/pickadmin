'use client';

import { useEffect, useState } from 'react';
import {  Clock1 } from "lucide-react"

export default function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setTime(`${day}-${month}-${year} ${hours}:${minutes}:${seconds}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // ⛔ Prevent server render mismatch
  if (!time) return null;

  return (
  <>
    <Clock1 size={16} />
    <span className="font-medium">{time}</span>
    
  </>
);
}
