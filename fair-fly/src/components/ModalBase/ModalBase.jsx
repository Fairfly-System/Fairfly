import "./modal-base.css";
import { useState, useEffect, useImperativeHandle } from "react";

export default function ModalBase({ ref,children }) {

    const [isOpen, setIsOpen] = useState(false);

    //Helper functions
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    //Expose openModal and closeModal functions
    useImperativeHandle(ref, () => ({
        openModal,
        closeModal,
    }));

    return (
        <>
            {isOpen && 
            
            <div className="modalOverlay">
                <div className="modal">
                    <div classname="modal-header">
                        <button className="closeBtn" onClick={closeModal} aria-label="Close modal">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    {children}
                </div>
            </div>}
            
        </>); 

}