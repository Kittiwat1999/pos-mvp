import type { Product } from "@/features/products";
import { ImageOff } from "lucide-react";
import { useState } from "react";

type ImageSizeConfig = {
  fallbackHeight: string;
  fallbackWidth: string;
  fallbackSize: string;
  imageHeight: string;
  imageWidth: string;
};

const size: Record<string, ImageSizeConfig> = {
  "small": {
    fallbackHeight: "14",
    fallbackWidth: "14",
    fallbackSize: "5",
    imageHeight: "14",
    imageWidth: "14",
  },
  "large": {
    fallbackHeight: "full",
    fallbackWidth: "full",
    fallbackSize: "full",
    imageHeight: "full",
    imageWidth: "full",
  },
};

export function ProductImage({
  productName,
  imageUrl,
  imageSize,
  className,
}: {
  productName: string;
  imageUrl?: string | null | undefined;
  imageSize: keyof typeof size;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const sizeConfig = size[imageSize];

  const fallback = (
    <div className={`flex h-${sizeConfig.fallbackHeight} w-${sizeConfig.fallbackWidth} items-center justify-center rounded-md bg-muted text-muted-foreground ${className}`}>
      <ImageOff className={`size-${sizeConfig.fallbackSize}`} />
    </div>
  );
  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={productName}
      className={`h-${sizeConfig.imageHeight} w-${sizeConfig.imageWidth} rounded-md object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  ) : (
    fallback
  );
}
