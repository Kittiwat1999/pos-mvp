import type { Product } from "@/features/products";
import { ImageOff } from "lucide-react";
import { useState } from "react";


type ImageSizeConfig = {
  small: string;
  large: string;
}
const sizeClasses = {
  small: "h-14 w-14",
  large: "h-full w-full",
};

const fallbackSizeClasses = {
  small: "size-5",
  large: "size-full",
};

export function ProductImage({
  productName,
  imageUrl,
  imageSize,
  className,
}: {
  productName: string;
  imageUrl?: string | null | undefined;
  imageSize: keyof ImageSizeConfig;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  
  const fallback = (
    <div className={`flex ${sizeClasses[imageSize]} items-center justify-center rounded-md bg-muted text-muted-foreground ${className}`}>
      <ImageOff className={`size-${fallbackSizeClasses[imageSize]}`} />
    </div>
  );
  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={productName}
      className={`${sizeClasses[imageSize]} rounded-md object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  ) : (
    fallback
  );
}
