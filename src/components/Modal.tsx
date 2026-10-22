import { useEffect, useRef, type ReactNode } from 'react';
export function Modal({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { const dialog = ref.current; const previous = document.activeElement as HTMLElement | null; dialog?.showModal(); return () => { dialog?.close(); previous?.focus(); }; }, []);
    return <dialog ref={ref} className="modal" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="dialog-title"><div className="modal-heading"><div><span className="eyebrow">INVENTARIO / REGISTRO</span><h2 id="dialog-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar formulario">×</button></div>{children}</dialog>;
}
