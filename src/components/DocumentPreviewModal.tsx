import React from "react";
import { MediaViewerModal } from "./MediaViewerModal";

interface DocumentPreviewModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export function DocumentPreviewModal({ url, name, onClose }: DocumentPreviewModalProps) {
  return <MediaViewerModal url={url} title={name} onClose={onClose} />;
}
