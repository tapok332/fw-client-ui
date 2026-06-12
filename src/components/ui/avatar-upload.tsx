import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  name: string;
  current?: string;
  onUpload?: (file: File) => Promise<void>;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarUpload({
  name,
  current,
  onUpload,
  size = "md",
  className,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get initials from name (up to 2 characters)
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14 md:h-16 md:w-16",
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    if (onUpload) {
      try {
        setIsUploading(true);
        await onUpload(file);
        toast({
          title: "Photo updated",
          description: "Your profile photo has been updated",
        });
      } catch (error) {
        console.error("Upload failed:", error);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your photo",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <>
      <Avatar
        className={cn(
          sizeClasses[size],
          "cursor-pointer relative",
          isUploading && "opacity-70",
          className
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload profile photo"
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      >
        {current && (
          <AvatarImage
            src={current}
            alt={name}
          />
        )}
        <AvatarFallback className="bg-orange-100 text-orange-600">
          {isUploading ? (
            <Camera className="h-5 w-5 animate-pulse" />
          ) : (
            initials || "U"
          )}
        </AvatarFallback>
      </Avatar>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
        aria-label="Upload profile photo"
      />
    </>
  );
}
