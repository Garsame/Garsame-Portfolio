"use client";

import { useState } from "react";
import { Button, Plus } from "@/components/ui";
import { TemplateModal } from "@/components/admin/blog/TemplateModal";

export function NewPostButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        size="xs"
        icon={<Plus size={14} strokeWidth={2.2} />}
        onClick={() => setModalOpen(true)}
      >
        New post
      </Button>
      <TemplateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
