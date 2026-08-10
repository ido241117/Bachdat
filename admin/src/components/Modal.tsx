import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export function Modal({ open, title, onClose, children, wide }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal ${wide ? "wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn ghost dark" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
